<template>
  <div
    class="sticky top-0 z-20 flex-none flex-shrink-0 bg-primary p-4 sm:flex sm:flex-shrink-0 sm:space-x-2"
  >
    <div
      class="min-w-[12rem] flex flex-1 whitespace-nowrap rounded border border-divider"
    >
      <div class="relative flex">
        <label for="method">
          <tippy
            interactive
            trigger="click"
            theme="popover"
            :on-shown="() => methodTippyActions.focus()"
          >
            <HoppSmartSelectWrapper>
              <input
                id="method"
                class="flex w-26 cursor-pointer rounded-l bg-primaryLight px-4 py-2 font-semibold text-secondaryDark transition"
                :value="tab.document.request.method"
                :readonly="!isCustomMethod"
                :placeholder="`${t('request.method')}`"
                @input="onSelectMethod($event)"
              />
            </HoppSmartSelectWrapper>
            <template #content="{ hide }">
              <div
                ref="methodTippyActions"
                class="flex flex-col focus:outline-none"
                tabindex="0"
                @keyup.escape="hide()"
              >
                <HoppSmartItem
                  v-for="(method, index) in methods"
                  :key="`method-${index}`"
                  :label="method"
                  :style="{
                    color: getMethodLabelColor(method),
                  }"
                  @click="
                    () => {
                      updateMethod(method)
                      hide()
                    }
                  "
                />
              </div>
            </template>
          </tippy>
        </label>
      </div>
      <div
        class="flex flex-1 whitespace-nowrap rounded-r border-l border-divider bg-primaryLight transition"
      >
        <SmartEnvInput
          v-model="tab.document.request.endpoint"
          :placeholder="`${t('request.url_placeholder')}`"
          :auto-complete-source="userHistories"
          :auto-complete-env="true"
          :inspection-results="tabResults"
          @paste="onPasteUrl($event)"
          @enter="newSendRequest"
        />
      </div>
    </div>
    <CollectionsSaveRequest
      v-if="showSaveRequestModal"
      mode="rest"
      :show="showSaveRequestModal"
      :request="request"
      @hide-modal="showSaveRequestModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@composables/i18n"
import { useReadonlyStream, useStreamSubscriber } from "@composables/stream"
import { useToast } from "@composables/toast"
import { useVModel } from "@vueuse/core"
import * as E from "fp-ts/Either"
import { computed, ref, onUnmounted } from "vue"
import { defineActionHandler, invokeAction } from "~/helpers/actions"
import { runMutation } from "~/helpers/backend/GQLClient"
import { UpdateRequestDocument } from "~/helpers/backend/graphql"
import { runRESTRequest$ } from "~/helpers/RequestRunner"
import { HoppRESTResponse } from "~/helpers/types/HoppRESTResponse"
import { editRESTRequest } from "~/newstore/collections"
import { getDefaultRESTRequest } from "~/helpers/rest/default"
import { RESTHistoryEntry, restHistory$ } from "~/newstore/history"
import { platform } from "~/platform"
import { HoppRESTRequest } from "@hoppscotch/data"
import { useService } from "dioc/vue"
import { InspectionService } from "~/services/inspection"
import { HoppTab } from "~/services/tab"
import { HoppRequestDocument } from "~/helpers/rest/document"
import { RESTTabService } from "~/services/tab/rest"
import { getMethodLabelColor } from "~/helpers/rest/labelColoring"

const t = useI18n()

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

const toast = useToast()

const { subscribeToStream } = useStreamSubscriber()

const props = defineProps<{ modelValue: HoppTab<HoppRequestDocument> }>()
const emit = defineEmits(["update:modelValue"])

const tab = useVModel(props, "modelValue", emit)

const newEndpoint = computed(() => {
  return tab.value.document.request.endpoint
})
const newMethod = computed(() => {
  return tab.value.document.request.method
})

const loading = ref(false)

const showSaveRequestModal = ref(false)

// Template refs
const methodTippyActions = ref<any | null>(null)

const history = useReadonlyStream<RESTHistoryEntry[]>(restHistory$, [])

const userHistories = computed(() => {
  return history.value.map((history) => history.request.endpoint).slice(0, 10)
})

const inspectionService = useService(InspectionService)

const tabs = useService(RESTTabService)

const newSendRequest = async () => {
  if (newEndpoint.value === "" || /^\s+$/.test(newEndpoint.value)) {
    toast.error(`${t("empty.endpoint")}`)
    return
  }

  ensureMethodInEndpoint()

  loading.value = true

  const [cancel, streamPromise] = runRESTRequest$(tab)
  const streamResult = await streamPromise

  tab.value.document.cancelFunction = cancel

  if (E.isRight(streamResult)) {
    subscribeToStream(
      streamResult.right,
      (responseState) => {
        if (loading.value) {
          // Check exists because, loading can be set to false
          // when cancelled
          updateRESTResponse(responseState)
        }
      },
      () => {
        loading.value = false
      },
      () => {
        // TODO: Change this any to a proper type
        const result = (streamResult.right as any).value
        if (
          result.type === "network_fail" &&
          result.error?.error === "NO_PW_EXT_HOOK"
        ) {
          const errorResponse: HoppRESTResponse = {
            type: "extension_error",
            error: result.error.humanMessage.heading,
            component: result.error.component,
            req: result.req,
          }
          updateRESTResponse(errorResponse)
        }
        loading.value = false
      }
    )
  } else {
    loading.value = false
    toast.error(`${t("error.script_fail")}`)
    let error: Error
    if (typeof streamResult.left === "string") {
      error = { name: "RequestFailure", message: streamResult.left }
    } else {
      error = streamResult.left
    }
    updateRESTResponse({
      type: "script_fail",
      error,
    })
  }
}

const ensureMethodInEndpoint = () => {
  const endpoint = newEndpoint.value.trim()
  tab.value.document.request.endpoint = endpoint
  if (!/^http[s]?:\/\//.test(endpoint) && !endpoint.startsWith("<<")) {
    const domain = endpoint.split(/[/:#?]+/)[0]
    if (domain === "localhost" || /([0-9]+\.)*[0-9]/.test(domain)) {
      tab.value.document.request.endpoint = "http://" + endpoint
    } else {
      tab.value.document.request.endpoint = "https://" + endpoint
    }
  }
}

const onPasteUrl = (e: { pastedValue: string; prevValue: string }) => {
  if (!e) return

  const pastedData = e.pastedValue

  if (isCURL(pastedData)) {
    tab.value.document.request.endpoint = e.prevValue
  }
}

function isCURL(curl: string) {
  return curl.includes("curl ")
}

const currentTabID = tabs.currentTabID.value

onUnmounted(() => {
  //check if current tab id exist in the current tab id lists
  const isCurrentTabRemoved = !tabs
    .getActiveTabs()
    .value.some((tab) => tab.id === currentTabID)

  if (isCurrentTabRemoved) cancelRequest()
})

const cancelRequest = () => {
  loading.value = false
  tab.value.document.cancelFunction?.()

  updateRESTResponse(null)
}

const updateMethod = (method: string) => {
  tab.value.document.request.method = method
}

const onSelectMethod = (e: Event | any) => {
  // type any because of value property not being recognized by TS in the event.target object. It is a valid property though.
  updateMethod(e.target.value)
}

const clearContent = () => {
  tab.value.document.request = getDefaultRESTRequest()
}

const updateRESTResponse = (response: HoppRESTResponse | null) => {
  tab.value.document.response = response
}

const currentUser = useReadonlyStream(
  platform.auth.getCurrentUserStream(),
  platform.auth.getCurrentUser()
)

const shareRequest = () => {
  if (currentUser.value) {
    invokeAction("share.request", {
      request: tab.value.document.request,
    })
  } else {
    invokeAction("modals.login.toggle")
  }
}

const cycleUpMethod = () => {
  const currentIndex = methods.indexOf(newMethod.value)
  if (currentIndex === -1) {
    // Most probs we are in CUSTOM mode
    // Cycle up from CUSTOM is PATCH
    updateMethod("PATCH")
  } else if (currentIndex === 0) {
    updateMethod("CUSTOM")
  } else {
    updateMethod(methods[currentIndex - 1])
  }
}

const cycleDownMethod = () => {
  const currentIndex = methods.indexOf(newMethod.value)
  if (currentIndex === -1) {
    // Most probs we are in CUSTOM mode
    // Cycle down from CUSTOM is GET
    updateMethod("GET")
  } else if (currentIndex === methods.length - 1) {
    updateMethod("GET")
  } else {
    updateMethod(methods[currentIndex + 1])
  }
}

const saveRequest = () => {
  const saveCtx = tab.value.document.saveContext

  if (!saveCtx) {
    showSaveRequestModal.value = true
    return
  }
  if (saveCtx.originLocation === "user-collection") {
    const req = tab.value.document.request

    try {
      editRESTRequest(saveCtx.folderPath, saveCtx.requestIndex, req)

      tab.value.document.isDirty = false
    } catch (e) {
      tab.value.document.saveContext = undefined
      saveRequest()
    }
  } else if (saveCtx.originLocation === "team-collection") {
    const req = tab.value.document.request

    // TODO: handle error case (NOTE: overwriteRequestTeams is async)
    try {
      runMutation(UpdateRequestDocument, {
        requestID: saveCtx.requestID,
        data: {
          title: req.name,
          request: JSON.stringify(req),
        },
      })().then((result) => {
        if (E.isLeft(result)) {
          toast.error(`${t("profile.no_permission")}`)
        } else {
          tab.value.document.isDirty = false

          toast.success(`${t("request.saved")}`)
        }
      })
    } catch (error) {
      showSaveRequestModal.value = true
      toast.error(`${t("error.something_went_wrong")}`)
      console.error(error)
    }
  }
}

const request = ref<HoppRESTRequest | null>(null)

defineActionHandler("request.send-cancel", () => {
  if (!loading.value) newSendRequest()
  else cancelRequest()
})
defineActionHandler("request.reset", clearContent)
defineActionHandler("request.share-request", shareRequest)
defineActionHandler("request.method.next", cycleDownMethod)
defineActionHandler("request.method.prev", cycleUpMethod)
defineActionHandler("request-response.save", saveRequest)
defineActionHandler("request.save-as", (req) => {
  showSaveRequestModal.value = true
  if (req?.requestType === "rest" && req.request) {
    request.value = req.request
  }
})
defineActionHandler("request.method.get", () => updateMethod("GET"))
defineActionHandler("request.method.post", () => updateMethod("POST"))
defineActionHandler("request.method.put", () => updateMethod("PUT"))
defineActionHandler("request.method.delete", () => updateMethod("DELETE"))
defineActionHandler("request.method.head", () => updateMethod("HEAD"))

const isCustomMethod = computed(() => {
  return (
    tab.value.document.request.method === "CUSTOM" ||
    !methods.includes(newMethod.value)
  )
})

const tabResults = inspectionService.getResultViewFor(tabs.currentTabID.value)
</script>

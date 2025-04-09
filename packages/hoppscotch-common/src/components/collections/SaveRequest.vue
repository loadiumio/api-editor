<!-- eslint-disable prettier/prettier -->
<template>
  <HoppSmartModal
    v-if="show"
    dialog
    :title="`${t('request.new')}`"
    @close="hideModal"
  >
    <template #body>
      <div class="flex flex-col">
        <div class="flex gap-1">
          <HoppSmartInput
            v-model="requestName"
            class="flex-grow"
            styles="relative flex"
            placeholder=" "
            :label="t('request.name')"
            input-styles="floating-input"
            @submit="saveRequestAs"
          />
        </div>

        <label class="p-4">
          {{ t("collection.select_location") }}
        </label>
        <CollectionsGraphql
          v-if="mode === 'graphql'"
          :picked="picked"
          :save-request="true"
          @select="onSelect"
        />
        <Collections
          v-else
          :picked="picked"
          :save-request="true"
          @select="onSelect"
          @update-team="updateTeam"
          @update-collection-type="updateCollectionType"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <div class="flex space-x-2">
          <HoppButtonPrimary
            :label="`${t('action.save')}`"
            :loading="modalLoadingState"
            outline
            @click="saveRequestAs"
          />
          <HoppButtonSecondary
            :label="`${t('action.cancel')}`"
            outline
            filled
            @click="hideModal"
          />
        </div>
      </div>
    </template>
  </HoppSmartModal>
</template>

<script setup lang="ts">
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { HoppGQLRequest, HoppRESTRequest } from "@hoppscotch/data"
import { useService } from "dioc/vue"
import { computed, nextTick, reactive, ref, watch } from "vue"
import { Picked } from "~/helpers/types/HoppPicked"
import { GQLTabService } from "~/services/tab/graphql"
import { RESTTabService } from "~/services/tab/rest"
import { TeamWorkspace } from "~/services/workspace.service"
import { saveRESTRequestAs } from "~/newstore/collections"
import { getDefaultRESTRequest } from "@helpers/rest/default"

const t = useI18n()
const toast = useToast()

const RESTTabs = useService(RESTTabService)
const GQLTabs = useService(GQLTabService)

type CollectionType =
  | {
      type: "team-collections"
      selectedTeam: TeamWorkspace
    }
  | { type: "my-collections"; selectedTeam: undefined }

const props = withDefaults(
  defineProps<{
    show: boolean
    mode: "rest" | "graphql"
    request?: HoppRESTRequest | HoppGQLRequest | null
  }>(),
  {
    show: false,
    mode: "rest",
    request: null,
  }
)

const emit = defineEmits<{
  (
    event: "edit-request",
    payload: {
      folderPath: string
      requestIndex: string
      request: HoppRESTRequest
    }
  ): void
  (e: "hide-modal"): void
}>()

const reqName = computed(() => {
  if (props.request) {
    return props.request.name
  }
  return ""
})

const requestName = ref(reqName.value)

watch(
  () => [RESTTabs.currentActiveTab.value, GQLTabs.currentActiveTab.value],
  () => {
    if (
      props.mode === "rest" &&
      RESTTabs.currentActiveTab.value.document.type === "request"
    ) {
      requestName.value =
        RESTTabs.currentActiveTab.value?.document.request.name ?? ""
    } else {
      requestName.value =
        GQLTabs.currentActiveTab.value?.document.request.name ?? ""
    }
  }
)

const requestData = reactive({
  name: requestName,
  collectionIndex: undefined as number | undefined,
  folderName: undefined as number | undefined,
  requestIndex: undefined as number | undefined,
})

const collectionsType = ref<CollectionType>({
  type: "my-collections",
  selectedTeam: undefined,
})

const picked = ref<Picked | null>(null)

const modalLoadingState = ref(false)

// Resets
watch(
  () => requestData.collectionIndex,
  () => {
    requestData.folderName = undefined
    requestData.requestIndex = undefined
  }
)
watch(
  () => requestData.folderName,
  () => {
    requestData.requestIndex = undefined
  }
)

const updateTeam = (newTeam: TeamWorkspace) => {
  collectionsType.value.selectedTeam = newTeam
}

const updateCollectionType = (type: CollectionType["type"]) => {
  collectionsType.value.type = type
}

const onSelect = (pickedVal: Picked | null) => {
  picked.value = pickedVal
}

const saveRequestAs = async () => {
  if (!requestName.value) {
    toast.error(`${t("error.empty_req_name")}`)
    return
  }
  if (picked.value === null) {
    toast.error(`${t("collection.select")}`)
    return
  }
  //create new request
  const newRequest = getDefaultRESTRequest()
  newRequest.name = requestName.value

  saveRESTRequestAs(
    `${picked.value.collectionIndex}`,
    newRequest as HoppRESTRequest
  )

  requestSaved()
}

const requestSaved = (tab: "REST" | "GQL" = "REST") => {
  toast.success(`${t("request.added")}`)
  nextTick(() => {
    if (tab === "REST") {
      RESTTabs.currentActiveTab.value.document.isDirty = false
    } else {
      GQLTabs.currentActiveTab.value.document.isDirty = false
    }
  })
  hideModal()
}

const hideModal = () => {
  picked.value = null
  emit("hide-modal")
}
</script>

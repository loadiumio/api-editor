<template>
  <div>
    <div
      v-if="isLoadingInitialRoute"
      class="flex min-h-screen flex-col items-center justify-center"
    >
      <HoppSmartSpinner />
    </div>
    <ErrorPage v-if="errorInfo !== null" :error="errorInfo" />
    <RouterView v-else />
    <Toaster rich-colors />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import ErrorPage, { ErrorPageData } from "~/pages/_.vue"
import { HOPP_MODULES } from "@modules/."
import { isLoadingInitialRoute } from "@modules/router"
import { useI18n } from "@composables/i18n"
import { APP_IS_IN_DEV_MODE } from "@helpers/dev"
import { platform } from "./platform"
import { Toaster } from "@hoppscotch/ui"
import { useSetting } from "@composables/settings"
import { applySetting, toggleSetting } from "~/newstore/settings"
import { Environment, GlobalEnvironmentVariable } from "@hoppscotch/data"
import { globalEnv$, setGlobalEnvVariables } from "~/newstore/environments"
import { clearRESTCollection, restCollections$ } from "~/newstore/collections"
import { useService } from "dioc/vue"
import { RESTTabService } from "~/services/tab/rest"
import { getDefaultRESTRequest } from "@helpers/rest/default"
import { fillRecordData } from "@helpers/utils/fillRecordData"
import { useReadonlyStream } from "@composables/stream"
import { getFiles } from "~/newstore/files"
import { GlobalEnvironment } from "@hoppscotch/data/src"

const t = useI18n()

const errorInfo = ref<ErrorPageData | null>(null)
let fallbackTimeout: any

onMounted(() => {
  window.addEventListener("message", handleMessage)
  const sidebarLeft = useSetting("SIDEBAR_ON_LEFT")
  if (!sidebarLeft.value) toggleSetting("SIDEBAR_ON_LEFT")
  document.documentElement.setAttribute("data-accent", "orange")
  applySetting("THEME_COLOR", "orange")

  const globalEnv = {
    name: "Global",
    v: 1,
    variables: [] as GlobalEnvironmentVariable[],
  } as Environment
  setGlobalEnvVariables(globalEnv)
  clearRESTCollection()

  const tabs = useService(RESTTabService)
  const defaultTab = tabs.createNewTab({
    type: "request",
    request: getDefaultRESTRequest(),
    isDirty: false,
  })
  tabs.closeOtherTabs(defaultTab.id)
  window.parent.postMessage({ status: "READY" }, "*")
  fallbackTimeout = setTimeout(() => {
    window.location.href = "https://loadium.io/"
  }, 3000)
})

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage)
  clearTimeout(fallbackTimeout)
})

const handleMessage = (event: MessageEvent) => {
  if (event.data.theme) {
    applySetting("BG_COLOR", event.data.theme === "dark" ? "dark" : "light")
    clearTimeout(fallbackTimeout)
  }
  if (event.data.record) {
    fillRecordData(event.data.record)
  }
  if (event.data.status === "GET_DATA") {
    const myCollections = useReadonlyStream(restCollections$, [])
    const globalEnvs = useReadonlyStream(globalEnv$, {} as GlobalEnvironment)
    const csvItems = getFiles()
    window.parent.postMessage(
      {
        status: "RECORD",
        collections: JSON.stringify(myCollections.value, null, 2),
        globalVariables: JSON.stringify(globalEnvs.value),
        csvItems: JSON.stringify(csvItems.files),
        action: event.data.action,
      },
      "*"
    )
  }
}

// App Crash Handler
// If the below code gets more complicated, move this onto a module
const formatErrorMessage = (err: Error | null | undefined) => {
  if (!err) return null
  return `${err.name}: ${err.message}`
}

// App Crash Handler is only a thing in Dev Mode
if (APP_IS_IN_DEV_MODE) {
  window.onerror = (_, _1, _2, _3, err) => {
    errorInfo.value = {
      statusCode: 500,
      message: formatErrorMessage(err) ?? t("error.something_went_wrong"),
    }

    // Returning false here will not cancel the error and will log it to console
    return false
  }
}

// Run module root component setup code
HOPP_MODULES.forEach((mod) => mod.onRootSetup?.())
platform.addedHoppModules?.forEach((mod) => mod.onRootSetup?.())
</script>

<template>
  <div>
    <AppPaneLayout layout-id="http">
      <template #primary>
        <HoppSmartWindows
          v-if="currentTabID && filteredTabs.length > 0"
          :id="'rest_windows'"
          ref="hoppSmartWindowsRef"
          v-model="currentTabID"
          @remove-tab="removeTab"
          @sort="sortTabs"
          @add-tab="createNewRequest"
        >
          <HoppSmartWindow
            v-for="tab in filteredTabs"
            :id="tab.id"
            :key="tab.id"
            :label="getTabName(tab)"
            :is-removable="activeTabs.length > 1"
            :close-visibility="'hover'"
          >
            <template v-if="tab.document.type === 'request'" #tabhead>
              <HttpTabHead
                :tab="tab"
                :is-removable="activeTabs.length > 1"
                @open-rename-modal="openReqRenameModal(tab.id)"
                @close-tab="removeTab(tab.id)"
                @close-other-tabs="closeOtherTabsAction(tab.id)"
                @duplicate-tab="duplicateTab(tab.id)"
                @share-tab-request="shareTabRequest(tab.id)"
              />
            </template>
            <HttpExampleResponseTab
              v-if="tab.document.type === 'example-response'"
              :model-value="tab"
              @update:model-value="onTabUpdate"
            />
            <!-- Render TabContents -->
            <HttpTestRunner
              v-if="tab.document.type === 'test-runner'"
              :model-value="tab"
              @update:model-value="onTabUpdate"
            />
            <!-- When document.type === 'request' the tab type is HoppTab<HoppRequestDocument>-->
            <template v-if="tab.document.type === 'request'">
              <HttpSleepTab
                v-if="tab.document.request.method === 'SLEEP'"
                :model-value="tab"
                @update:model-value="onTabUpdate"
              />
              <HttpRequestTab
                v-else
                :model-value="tab"
                @update:model-value="onTabUpdate"
              />
            </template>
            <!-- END Render TabContents -->
          </HoppSmartWindow>
        </HoppSmartWindows>
        <HoppSmartPlaceholder
          v-else
          class="m-auto"
          :src="`/api-editor/images/states/${colorMode.value}/pack.svg`"
          :alt="`${t('empty.request')}`"
          :text="t('empty.request')"
        >
          <template #body>
            {{ t("script.choose_import_or_create_left") }}
          </template>
        </HoppSmartPlaceholder>
      </template>
      <template #sidebar>
        <HttpSidebar />
      </template>
    </AppPaneLayout>
    <CollectionsEditRequest
      v-model="reqName"
      :request-context="requestToRename"
      :show="showRenamingReqNameModal"
      @submit="renameReqName"
      @hide-modal="showRenamingReqNameModal = false"
    />
    <HoppSmartConfirmModal
      :show="confirmingCloseAllTabs"
      :confirm="t('modal.close_unsaved_tab')"
      :title="t('confirm.close_unsaved_tabs', { count: unsavedTabsCount })"
      @hide-modal="confirmingCloseAllTabs = false"
      @resolve="onResolveConfirmCloseAllTabs"
    />
    <CollectionsSaveRequest
      v-if="creatingRequest"
      mode="rest"
      :show="creatingRequest"
      @hide-modal="onCreateRequestModalClose"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue"
import { safelyExtractRESTRequest } from "@hoppscotch/data"
import { translateExtURLParams } from "~/helpers/RESTExtURLParams"
import { useRoute } from "vue-router"
import { useI18n } from "@composables/i18n"
import { getDefaultRESTRequest } from "~/helpers/rest/default"
import { defineActionHandler, invokeAction } from "~/helpers/actions"
import { platform } from "~/platform"
import { useReadonlyStream } from "~/composables/stream"
import { useService } from "dioc/vue"
import { InspectionService } from "~/services/inspection"
import { HeaderInspectorService } from "~/services/inspection/inspectors/header.inspector"
import { EnvironmentInspectorService } from "~/services/inspection/inspectors/environment.inspector"
import { InterceptorsInspectorService } from "~/services/inspection/inspectors/interceptors.inspector"
import { ResponseInspectorService } from "~/services/inspection/inspectors/response.inspector"
import { cloneDeep } from "lodash-es"
import { RESTTabService } from "~/services/tab/rest"
import { HoppTab } from "~/services/tab"
import { HoppRequestDocument, HoppTabDocument } from "~/helpers/rest/document"
import { AuthorizationInspectorService } from "~/services/inspection/inspectors/authorization.inspector"
import { useColorMode } from "@composables/theming"

const creatingRequest = ref(false)
const confirmingCloseForTabID = ref<string | null>(null)
const confirmingCloseAllTabs = ref(false)
const showRenamingReqNameModal = ref(false)
const reqName = ref<string>("")
const unsavedTabsCount = ref(0)
const exceptedTabID = ref<string | null>(null)
const renameTabID = ref<string | null>(null)

const t = useI18n()
const tabs = useService(RESTTabService)
const colorMode = useColorMode()

const currentTabID = tabs.currentTabID

const currentUser = useReadonlyStream(
  platform.auth.getCurrentUserStream(),
  platform.auth.getCurrentUser()
)

const hoppSmartWindowsRef = ref(null)

const activeTabs = tabs.getActiveTabs()

const filteredTabs = computed(() =>
  activeTabs.value.filter(
    (tab) =>
      tab.document.type === "request" &&
      (tab.document.request?.method === "SLEEP" ||
        tab.document.request?.name?.length > 0)
  )
)

function bindRequestToURLParams() {
  const route = useRoute()
  // Get URL parameters and set that as the request
  onMounted(() => {
    const query = route.query
    // If query params are empty, or contains code or error param (these are from Oauth Redirect)
    // We skip URL params parsing
    if (Object.keys(query).length === 0 || query.code || query.error) return

    if (tabs.currentActiveTab.value.document.type !== "request") return

    const request = tabs.currentActiveTab.value.document.request

    tabs.currentActiveTab.value.document.request = safelyExtractRESTRequest(
      translateExtURLParams(query, request),
      getDefaultRESTRequest()
    )
  })
}

const onTabUpdate = (tab: HoppTab<HoppRequestDocument>) => {
  tabs.updateTab(tab)
}

const addNewTab = () => {
  const tab = tabs.createNewTab({
    type: "request",
    request: getDefaultRESTRequest(),
    isDirty: false,
  })

  tabs.setActiveTab(tab.id)
}

const createNewRequest = () => {
  creatingRequest.value = true
}

const sortTabs = (e: { oldIndex: number; newIndex: number }) => {
  tabs.updateTabOrdering(e.oldIndex, e.newIndex)
}

const getTabName = (tab: HoppTab<HoppTabDocument>) => {
  if (tab.document.type === "request") {
    return tab.document.request.name
  } else if (tab.document.type === "test-runner") {
    return tab.document.collection.name
  } else if (tab.document.type === "example-response") {
    return tab.document.response.name
  }

  return "Unnamed tab"
}

const inspectionService = useService(InspectionService)

const removeTab = (tabID: string) => {
  const tabState = tabs.getTabRef(tabID).value

  if (tabState.document.isDirty) {
    confirmingCloseForTabID.value = tabID
  } else {
    tabs.closeTab(tabState.id)
    inspectionService.deleteTabInspectorResult(tabState.id)
  }
}

const closeOtherTabsAction = (tabID: string) => {
  const isTabDirty = tabs.getTabRef(tabID).value?.document.isDirty
  const dirtyTabCount = tabs.getDirtyTabsCount()
  // If current tab is dirty, so we need to subtract 1 from the dirty tab count
  const balanceDirtyTabCount = isTabDirty ? dirtyTabCount - 1 : dirtyTabCount

  // If there are dirty tabs, show the confirm modal
  if (balanceDirtyTabCount > 0) {
    confirmingCloseAllTabs.value = true
    unsavedTabsCount.value = balanceDirtyTabCount
    exceptedTabID.value = tabID
  } else {
    tabs.closeOtherTabs(tabID)
  }
}

const duplicateTab = (tabID: string) => {
  const tab = tabs.getTabRef(tabID)
  if (tab.value && tab.value.document.type === "request") {
    const newTab = tabs.createNewTab({
      type: "request",
      request: cloneDeep(tab.value.document.request),
      isDirty: true,
    })
    tabs.setActiveTab(newTab.id)
  }
}

const onResolveConfirmCloseAllTabs = () => {
  if (exceptedTabID.value) tabs.closeOtherTabs(exceptedTabID.value)
  confirmingCloseAllTabs.value = false
}

const requestToRename = computed(() => {
  if (!renameTabID.value) return null
  const tab = tabs.getTabRef(renameTabID.value)

  return tab.value.document.type === "request"
    ? tab.value.document.request
    : null
})

const openReqRenameModal = (tabID?: string) => {
  if (tabID) {
    const tab = tabs.getTabRef(tabID)

    if (tab.value.document.type !== "request") return

    reqName.value = tab.value.document.request.name
    renameTabID.value = tabID
  } else {
    const { id, document } = tabs.currentActiveTab.value

    if (document.type !== "request") return

    reqName.value = document.request.name
    renameTabID.value = id
  }
  showRenamingReqNameModal.value = true
}

const renameReqName = () => {
  const tab = tabs.getTabRef(renameTabID.value ?? currentTabID.value)
  if (tab.value && tab.value.document.type === "request") {
    tab.value.document.request.name = reqName.value
    tabs.updateTab(tab.value)
  }
  showRenamingReqNameModal.value = false
}

const onCreateRequestModalClose = () => {
  creatingRequest.value = false
}

const shareTabRequest = (tabID: string) => {
  const tab = tabs.getTabRef(tabID)
  if (tab.value && tab.value.document.type === "request") {
    if (currentUser.value) {
      invokeAction("share.request", {
        request: tab.value.document.request,
      })
    } else {
      invokeAction("modals.login.toggle")
    }
  }
}

bindRequestToURLParams()

defineActionHandler("rest.request.open", ({ doc }) => {
  tabs.createNewTab(doc)
})

defineActionHandler("request.rename", () => {
  if (tabs.currentActiveTab.value.document.type === "request")
    openReqRenameModal(tabs.currentActiveTab.value.id)
})
defineActionHandler("tab.duplicate-tab", ({ tabID }) => {
  duplicateTab(tabID ?? currentTabID.value)
})
defineActionHandler("tab.close-current", () => {
  removeTab(currentTabID.value)
})
defineActionHandler("tab.close-other", () => {
  tabs.closeOtherTabs(currentTabID.value)
})
defineActionHandler("tab.open-new", addNewTab)

useService(HeaderInspectorService)
useService(EnvironmentInspectorService)
useService(ResponseInspectorService)
useService(AuthorizationInspectorService)
useService(InterceptorsInspectorService)

for (const inspectorDef of platform.additionalInspectors ?? []) {
  useService(inspectorDef.service)
}
</script>

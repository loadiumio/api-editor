<template>
  <HoppSmartTabs
    v-model="selectedNavigationTab"
    styles="sticky overflow-x-auto flex-shrink-0 bg-primary z-10 top-0"
    vertical
    render-inactive-tabs
  >
    <HoppSmartTab
      :id="'collections'"
      :icon="IconFolder"
      :label="`${t('tab.collections')}`"
    >
      <Collections />
    </HoppSmartTab>
    <HoppSmartTab
      :id="'env'"
      :icon="IconGlobe"
      :label="`${t('tab.global_variables')}`"
    >
      <Environments />
    </HoppSmartTab>
    <!-- <HoppSmartTab
      :id="'history'"
      :icon="IconClock"
      :label="`${t('tab.history')}`"
    >
      <History :page="'rest'" :selected-tab="selectedNavigationTab" />
    </HoppSmartTab> -->
    <!-- <HoppSmartTab
      :id="'share-request'"
      :icon="IconShare2"
      :label="`${t('tab.shared_requests')}`"
    >
      <Share />
    </HoppSmartTab> -->
    <HoppSmartTab
      :id="'csv_upload'"
      :icon="IconImport"
      :label="`${t('tab.csv_upload')}`"
    >
      <div
        class="flex items-center overflow-x-auto whitespace-nowrap border-b border-dividerLight px-4 py-2 text-tiny text-secondaryLight"
      >
        <span class="truncate"> {{ t("request.title") }} </span>
        <icon-lucide-chevron-right class="mx-2" />
        {{ t("tab.csv_upload") }}
      </div>
      <Csv
        v-if="selectedNavigationTab === 'csv_upload'"
        :hide-label="true"
        class="px-4 mt-4"
      />
    </HoppSmartTab>
  </HoppSmartTabs>
</template>

<script setup lang="ts">
import IconGlobe from "~icons/lucide/globe"
import IconFolder from "~icons/lucide/folder"
import IconImport from "~icons/lucide/folder-down"
import { ref } from "vue"
import { useI18n } from "@composables/i18n"

const t = useI18n()

type RequestOptionTabs = "collections" | "env" | "csv_upload"

const selectedNavigationTab = ref<RequestOptionTabs>("collections")
</script>

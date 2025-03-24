<template>
  <div>
    <div>
      <div
        class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary p-2 pl-4 sm:top-upperSecondaryStickyFold"
      >
        <label class="truncate font-semibold text-secondaryLight">
          {{ t("request.json_path") }}
        </label>
      </div>
      <div
        v-for="(jsonVar, index) in availableVariables.jsonPathVariables"
        :key="`json-${index}`"
        class="group flex divide-x divide-dividerLight border-b border-dividerLight"
      >
        <SmartEnvInput v-model="jsonVar.varName" :is-disabled="true" />
        <SmartEnvInput v-model="jsonVar.expression" :is-disabled="true" />
      </div>
      <HoppSmartPlaceholder
        v-if="availableVariables.jsonPathVariables.length < 1"
        :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
        :alt="`${t('empty.run_time_json_variables')}`"
        :text="t('empty.run_time_json_variables')"
      />
    </div>
    <div>
      <div
        class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary p-2 pl-4 sm:top-upperSecondaryStickyFold"
      >
        <label class="truncate font-semibold text-secondaryLight">
          {{ t("request.regex") }}
        </label>
      </div>
      <div
        v-for="(regexVar, index) in availableVariables.regexVariables"
        :key="`regex-${index}`"
        class="group flex divide-x divide-dividerLight border-b border-dividerLight"
      >
        <SmartEnvInput v-model="regexVar.varName" :is-disabled="true" />
        <SmartEnvInput v-model="regexVar.expression" :is-disabled="true" />
      </div>
      <HoppSmartPlaceholder
        v-if="availableVariables.regexVariables.length < 1"
        :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
        :alt="`${t('empty.run_time_regex_variables')}`"
        :text="t('empty.run_time_regex_variables')"
      />
    </div>
    <div>
      <div
        class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary p-2 pl-4 sm:top-upperSecondaryStickyFold"
      >
        <label class="truncate font-semibold text-secondaryLight">
          {{ t("request.css_selector") }}
        </label>
      </div>
      <div
        v-for="(cssVar, index) in availableVariables.cssSelectorVariables"
        :key="`css-${index}`"
        class="group flex divide-x divide-dividerLight border-b border-dividerLight"
      >
        <SmartEnvInput v-model="cssVar.varName" :is-disabled="true" />
        <SmartEnvInput v-model="cssVar.expression" :is-disabled="true" />
        <SmartEnvInput v-model="cssVar.attribute" :is-disabled="true" />
        <SmartEnvInput v-model="cssVar.matchNumber" :is-disabled="true" />
      </div>
      <HoppSmartPlaceholder
        v-if="availableVariables.cssSelectorVariables.length < 1"
        :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
        :alt="`${t('empty.run_time_css_variables')}`"
        :text="t('empty.run_time_css_variables')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useColorMode } from "@composables/theming"
import { useI18n } from "@composables/i18n"

const t = useI18n()
const colorMode = useColorMode()

const props = defineProps<{
  availableVariables: {
    jsonPathVariables: any[]
    regexVariables: any[]
    cssSelectorVariables: any[]
  }
}>()

const availableVariables = ref(props.availableVariables)
</script>

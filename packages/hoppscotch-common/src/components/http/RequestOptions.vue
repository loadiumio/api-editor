<template>
  <HoppSmartTabs
    v-model="selectedOptionTab"
    styles="sticky overflow-x-auto flex-shrink-0 bg-primary top-upperMobilePrimaryStickyFold sm:top-upperPrimaryStickyFold z-10"
    render-inactive-tabs
  >
    <HoppSmartTab
      v-if="properties?.includes('params') ?? true"
      :id="'params'"
      :label="`${t('tab.parameters')}`"
      :info="`${newActiveParamsCount}`"
    >
      <HttpParameters v-model="request.params" :envs="envs" />
    </HoppSmartTab>
    <HoppSmartTab
      v-if="properties?.includes('bodyParams') ?? true"
      :id="'bodyParams'"
      :label="`${t('tab.body')}`"
      :indicator="isBodyFilled"
    >
      <HttpBody
        v-model:headers="request.headers"
        v-model:body="request.body"
        :envs="envs"
        @change-tab="changeOptionTab"
      />
    </HoppSmartTab>
    <HoppSmartTab
      v-if="properties?.includes('headers') ?? true"
      :id="'headers'"
      :label="`${t('tab.headers')}`"
      :info="`${newActiveHeadersCount}`"
    >
      <HttpHeaders
        v-model="request"
        :inherited-properties="inheritedProperties"
        :envs="envs"
        @change-tab="changeOptionTab"
      />
    </HoppSmartTab>
    <HoppSmartTab
      v-if="properties?.includes('requestVariables') ?? true"
      :id="'requestVariables'"
      :label="`${t('tab.variables')}`"
      :info="`${newActiveRequestVariablesCount}`"
    >
      <HttpRequestVariables
        v-model:json-path-variables="request.jsonPathVariables"
        v-model:regex-variables="request.regexVariables"
        v-model:css-variables="request.cssSelectorVariables"
      />
    </HoppSmartTab>
    <HoppSmartTab
      v-if="properties?.includes('requestAssertions') ?? true"
      :id="'requestAssertions'"
      :label="`${t('tab.assertions')}`"
      :info="`${newAssertionsCount}`"
    >
      <HttpRequestAssertions
        v-model:text-assertions="request.textAssertions"
        v-model:json-path-value-assertions="request.jsonPathValueAssertions"
        v-model:json-path-assertions="request.jsonPathAssertions"
      />
    </HoppSmartTab>
    <HoppSmartTab
      v-if="properties?.includes('allVariables') ?? true"
      :id="'allVariables'"
      :label="`${t('tab.runtime_variables')}`"
      :align-last="true"
      :info="`${newAvailableVariablesCount}`"
    >
      <HttpAvailableVariables :available-variables="availableVariables" />
    </HoppSmartTab>
  </HoppSmartTabs>
</template>

<script setup lang="ts">
import { useI18n } from "@composables/i18n"
import {
  HoppRESTRequest,
  HoppRESTResponseOriginalRequest,
} from "@hoppscotch/data"
import { useVModel } from "@vueuse/core"
import { computed, watch } from "vue"
import { defineActionHandler } from "~/helpers/actions"
import { HoppInheritedProperty } from "~/helpers/types/HoppInheritedProperties"
import { AggregateEnvironment } from "~/newstore/environments"

const VALID_OPTION_TABS = [
  "params",
  "bodyParams",
  "headers",
  "requestVariables",
  "requestAssertions",
  "allVariables",
] as const

export type RESTOptionTabs = (typeof VALID_OPTION_TABS)[number]

const t = useI18n()

// v-model integration with props and emit
const props = withDefaults(
  defineProps<{
    modelValue: HoppRESTRequest | HoppRESTResponseOriginalRequest
    optionTab: RESTOptionTabs
    availableVariables: {
      jsonPathVariables: any[]
      regexVariables: any[]
      cssSelectorVariables: any[]
    }
    properties?: string[]
    inheritedProperties?: HoppInheritedProperty
    envs?: AggregateEnvironment[]
  }>(),
  {
    optionTab: "params",
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: HoppRESTRequest): void
  (e: "update:optionTab", value: RESTOptionTabs): void
}>()

const request = useVModel(props, "modelValue", emit)
const selectedOptionTab = useVModel(props, "optionTab", emit)

const changeOptionTab = (e: RESTOptionTabs) => {
  selectedOptionTab.value = e
}

const newActiveParamsCount = computed(() => {
  const count = request.value.params.filter((x) => x.key || x.value).length
  return count ? count : null
})

const newActiveHeadersCount = computed(() => {
  const count = request.value.headers.filter((x) => x.key || x.value).length
  return count ? count : null
})

const newActiveRequestVariablesCount = computed(() => {
  let count = request.value.jsonPathVariables.filter((x) => x.varName || x.expression).length
  count += request.value.regexVariables.filter((x) => x.varName || x.expression).length
  count += request.value.cssSelectorVariables.filter((x) => x.varName || x.expression).length
  return count ? count : null
})

const newAssertionsCount = computed(() => {
  let count = request.value.textAssertions.filter((x) => x.value).length
  count += request.value.jsonPathValueAssertions.filter((x) => x.value).length
  count += request.value.jsonPathAssertions.filter((x) => x.expression).length
  return count ? count : null
})

const newAvailableVariablesCount = computed(() => {
  let count = props.availableVariables.jsonPathVariables.length
  count += props.availableVariables.regexVariables.length
  count += props.availableVariables.cssSelectorVariables.length
  return count ? count : null
})

const isBodyFilled = computed(() => {
  return Boolean(request.value.body.body && request.value.body.body.length > 0)
})

watch(
  () => request.value.params,
  () => {
    const baseUrl = request.value.endpoint?.split("?")[0] || ""
    const searchParams = new URLSearchParams()

    request.value.params.forEach((param: { key: string; value: string }) => {
      const key = param.key ?? ""
      const value = param.value ?? ""
      if (key || value) {
        searchParams.append(key, value)
      }
    })

    const queryString = searchParams.toString()

    request.value.endpoint = queryString ? `${baseUrl}?${queryString}` : baseUrl
  }
)

defineActionHandler("request.open-tab", ({ tab }) => {
  selectedOptionTab.value = tab as RESTOptionTabs
})
</script>

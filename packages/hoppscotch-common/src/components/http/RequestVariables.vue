<template>
  <div class="flex flex-1 flex-col">
    <HttpJsonVariables v-model:json-path-variables="jsonPathVariables" />
    <HttpRegexVariables v-model:regex-variables="regexVariables" />
    <HttpCssSelectorVariables v-model:css-variables="cssVariables" />
  </div>
</template>

<script lang="ts" setup>
import {
  LoadiumRESTJsonPathVariables,
  LoadiumRESTRegexVariable,
  LoadiumRESTCssSelectorVariables,
} from "@hoppscotch/data"
import { useVModel } from "@vueuse/core"

const props = defineProps<{
  jsonPathVariables: LoadiumRESTJsonPathVariables[]
  regexVariables: LoadiumRESTRegexVariable[]
  cssVariables: LoadiumRESTCssSelectorVariables[]
}>()

const emit = defineEmits<{
  (
    e: "update:jsonPathVariables",
    value: Array<LoadiumRESTJsonPathVariables>
  ): void
  (e: "update:regexVariables", value: Array<LoadiumRESTRegexVariable>): void
  (
    e: "update:cssVariables",
    value: Array<LoadiumRESTCssSelectorVariables>
  ): void
}>()

// The functional requestVariable list (the requestVariable actually applied to the session)
const jsonPathVariables = useVModel(props, "jsonPathVariables", emit)
const regexVariables = useVModel(props, "regexVariables", emit)
const cssVariables = useVModel(props, "cssVariables", emit)
</script>

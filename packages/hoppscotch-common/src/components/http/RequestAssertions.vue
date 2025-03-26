<template>
  <div class="flex flex-1 flex-col">
    <HttpTextAssertions v-model:text-assertions="textAssertions" />
    <HttpJsonPathValueAssertions v-model:json-path-value-assertions="jsonPathValueAssertions" />
    <HttpJsonPathAssertions v-model:json-path-assertions="jsonPathAssertions" />
  </div>
</template>

<script lang="ts" setup>
import {
  LoadiumRESTAssertionText,
  LoadiumRESTAssertionJsonPathValue,
  LoadiumRESTAssertionJsonPathAssert,
} from "@hoppscotch/data"
import { useVModel } from "@vueuse/core"

const props = defineProps<{
  textAssertions: LoadiumRESTAssertionText[]
  jsonPathValueAssertions: LoadiumRESTAssertionJsonPathValue[]
  jsonPathAssertions: LoadiumRESTAssertionJsonPathAssert[]
}>()

const emit = defineEmits<{
  (e: "update:textAssertions", value: Array<LoadiumRESTAssertionText>): void
  (
    e: "update:jsonPathValueAssertions",
    value: Array<LoadiumRESTAssertionJsonPathValue>
  ): void
  (
    e: "update:jsonPathAssertions",
    value: Array<LoadiumRESTAssertionJsonPathAssert>
  ): void
}>()

const textAssertions = useVModel(props, "textAssertions", emit)
const jsonPathValueAssertions = useVModel(props, "jsonPathValueAssertions", emit)
const jsonPathAssertions = useVModel(props, "jsonPathAssertions", emit)
</script>

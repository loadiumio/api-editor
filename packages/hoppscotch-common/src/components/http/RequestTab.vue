<template>
  <AppPaneLayout layout-id="rest-primary">
    <template #primary>
      <HttpRequest v-model="tab" />
      <HttpRequestOptions
        v-model="tab.document.request"
        v-model:option-tab="tab.document.optionTabPreference"
        v-model:inherited-properties="tab.document.inheritedProperties"
        :available-variables="availableVariables"
      />
    </template>
  </AppPaneLayout>
</template>

<script setup lang="ts">
import {onMounted, ref, toRaw, watch} from "vue"
import { useVModel } from "@vueuse/core"
import { cloneDeep } from "lodash-es"
import { isEqualHoppRESTRequest } from "@hoppscotch/data"
import { HoppTab } from "~/services/tab"
import { HoppRequestDocument } from "~/helpers/rest/document"
import { useReadonlyStream } from "@composables/stream"
import { restCollections$ } from "~/newstore/collections"

// TODO: Move Response and Request execution code to over here

const props = defineProps<{ modelValue: HoppTab<HoppRequestDocument> }>()

const emit = defineEmits<{
  (e: "update:modelValue", val: HoppTab<HoppRequestDocument>): void
}>()

const availableVariables = ref({
  jsonPathVariables: [] as any[],
  regexVariables: [] as any[],
  cssSelectorVariables: [] as any[],
})

onMounted(() => {
  const collections = useReadonlyStream(restCollections$, [], "deep")
  const saveContext = cloneDeep(tab.value.document.saveContext)
  if (saveContext) {
    const folderPathInt = parseInt(saveContext.folderPath, 10)
    const requestIndexInt = parseInt(saveContext.requestIndex, 10)
    for (
      let collectionIndex = 0;
      collectionIndex <= folderPathInt;
      collectionIndex++
    ) {
      const collection = collections.value[collectionIndex]
      const requestsToProcess =
        collectionIndex === folderPathInt
          ? requestIndexInt
          : collection.requests.length
      for (
        let requestIndex = 0;
        requestIndex < requestsToProcess;
        requestIndex++
      ) {
        const request = collection.requests[requestIndex]
        availableVariables.value.jsonPathVariables.push(
          ...toRaw(request.jsonPathVariables)
        )
        availableVariables.value.cssSelectorVariables.push(
          ...toRaw(request.cssSelectorVariables)
        )
        availableVariables.value.regexVariables.push(
          ...toRaw(request.regexVariables)
        )
      }
    }
  }
})

const tab = useVModel(props, "modelValue", emit)

// TODO: Come up with a better dirty check
let oldRequest = cloneDeep(tab.value.document.request)
watch(
  () => tab.value.document.request,
  (updatedValue) => {
    if (
      !tab.value.document.isDirty &&
      !isEqualHoppRESTRequest(oldRequest, updatedValue)
    ) {
      tab.value.document.isDirty = true
    }

    oldRequest = cloneDeep(updatedValue)
  },
  { deep: true }
)
</script>

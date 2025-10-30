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
import { onMounted, ref, toRaw, watch } from "vue"
import { useVModel } from "@vueuse/core"
import { cloneDeep } from "lodash-es"
import { HoppTab } from "~/services/tab"
import { HoppRequestDocument } from "~/helpers/rest/document"
import { useReadonlyStream } from "@composables/stream"
import { restCollections$ } from "~/newstore/collections"
import { invokeAction } from "@helpers/actions"

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

const requestList = [] as any[]

onMounted(() => {
  const collections = useReadonlyStream(restCollections$, [], "deep")
  const saveContext = cloneDeep(tab.value.document.saveContext)
  if (saveContext) {
    const folderPathValues = saveContext.folderPath.split("/").map(Number)
    const requestIndexInt = parseInt(saveContext.requestIndex, 10)

    search(folderPathValues, collections.value[folderPathValues[0]], requestIndexInt)

    requestList.forEach((request) => {
      availableVariables.value.jsonPathVariables.push(
        ...toRaw(request.jsonPathVariables)
      )
      availableVariables.value.cssSelectorVariables.push(
        ...toRaw(request.cssSelectorVariables)
      )
      availableVariables.value.regexVariables.push(
        ...toRaw(request.regexVariables)
      )
    })
  }
})

const search = (
  folderPathValues: number[],
  collection: any,
  requestIndex: number
) => {
  if (!folderPathValues.length) {
    for (const folder of collection.folders) {
      search([], folder, requestIndex)
    }
    requestList.push(...collection.requests)
    return
  }
  if (folderPathValues.length === 1) {
    for (const folder of collection.folders) {
      search([], folder, requestIndex)
    }
    for (let i = 0; i < requestIndex; i++) {
      requestList.push(collection.requests[i])
    }
    return
  }

  const newFolderPathValues = folderPathValues.slice(1)
  for (let i = 0; i < newFolderPathValues[0]; i++) {
    search([], collection.folders[i], requestIndex)
  }

  search(
    newFolderPathValues,
    collection.folders[newFolderPathValues[0]],
    requestIndex
  )
}

const tab = useVModel(props, "modelValue", emit)

// TODO: Come up with a better dirty check
watch(
  () => tab.value.document.request,
  () => {
    invokeAction("request-response.save")
  },
  { deep: true }
)
</script>

<template>
  <AppPaneLayout layout-id="rest-primary">
    <template #primary>
      <div class="items-center m-10">
        <label>{{ t("sleep.time") }}</label>
        <input
          v-model="sleepTime"
          class="flex border bg-transparent px-4 py-2"
          :placeholder="`${t('sleep.milli_second')}`"
          :name="'Sleep Time'"
        />
      </div>
    </template>
  </AppPaneLayout>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useVModel } from "@vueuse/core"
import { HoppTab } from "~/services/tab"
import { HoppRequestDocument } from "~/helpers/rest/document"
import { useI18n } from "@composables/i18n"
import { editRESTRequest } from "~/newstore/collections";
const props = defineProps<{ modelValue: HoppTab<HoppRequestDocument> }>()
const emit = defineEmits<{
  (e: "update:modelValue", val: HoppTab<HoppRequestDocument>): void
}>()
const t = useI18n()
const tab = useVModel(props, "modelValue", emit)
const sleepTime = ref<number>(
  Number(tab.value.document.request.params[0].value) || 0
)
watch(
  () => sleepTime.value,
  (updatedValue) => {
    tab.value.document.request.params[0].value = updatedValue
      ? updatedValue.toString()
      : "0"
    const saveCtx = tab.value.document.saveContext
    if (saveCtx) {
      const req = tab.value.document.request
      editRESTRequest(saveCtx.folderPath, saveCtx.requestIndex, req)
      tab.value.document.isDirty = false
    }
  }
)
</script>

<template>
  <div>
    <div>
      <div
        class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary p-2 pl-4 sm:top-upperSecondaryStickyFold"
      >
        <label class="truncate font-semibold text-secondaryLight">
          {{ t("request.run_time_variables") }}
        </label>
      </div>
      <div
        v-for="(varName, index) in variableNames"
        :key="`varName-${index}`"
        class="group flex divide-x divide-dividerLight border-b border-dividerLight"
      >
        <div class="flex w-full bg-transparent px-4 py-2">
          {{ varName }}
        </div>
        <HoppButtonSecondary :icon="IconCopy" @click="copy(varName)" />
      </div>
      <HoppSmartPlaceholder
        v-if="variableNames.length === 0"
        :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
        :alt="`${t('empty.run_time_variables')}`"
        :text="t('empty.run_time_variables')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref} from "vue"
import { useColorMode } from "@composables/theming"
import { useI18n } from "@composables/i18n"
import { copyToClipboard } from "@helpers/utils/clipboard"
import IconCopy from "~icons/lucide/copy"
import { useToast } from "@composables/toast"

const t = useI18n()
const toast = useToast()
const colorMode = useColorMode()

const props = defineProps<{
  availableVariables: {
    jsonPathVariables: any[]
    regexVariables: any[]
    cssSelectorVariables: any[]
  }
}>()

const availableVariables = ref(props.availableVariables)

const variableNames = computed(() => {
  const variableNames: string[] = []
  availableVariables.value.jsonPathVariables.forEach((variable) =>
    variableNames.push(`\${${variable.varName}}`)
  )
  availableVariables.value.cssSelectorVariables.forEach((variable) =>
    variableNames.push(`\${${variable.varName}}`)
  )
  availableVariables.value.regexVariables.forEach((variable) =>
    variableNames.push(`\${${variable.varName}}`)
  )
  return variableNames
})

const copy = (content: string) => {
  copyToClipboard(content)
  toast.success(`${t("state.copied_to_clipboard")}`)
}
</script>

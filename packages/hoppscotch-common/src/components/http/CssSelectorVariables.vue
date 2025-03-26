<template>
  <div>
    <div
      class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary pl-4 sm:top-upperSecondaryStickyFold"
    >
      <label class="truncate font-semibold text-secondaryLight">
        {{ t("request.css_selector") }}
      </label>
      <div class="flex">
        <HoppButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          :title="t('action.clear_all')"
          :icon="IconTrash2"
          @click="clearContent()"
        />
        <HoppButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          :title="t('add.new')"
          :icon="IconPlus"
          @click="addCssVariable"
        />
      </div>
    </div>
    <div>
      <draggable
        v-model="workingCssVariables"
        item-key="id"
        animation="250"
        handle=".draggable-handle"
        draggable=".draggable-content"
        ghost-class="cursor-move"
        chosen-class="bg-primaryLight"
        drag-class="cursor-grabbing"
      >
        <template #item="{ element: variable, index }">
          <div
            class="draggable-content group flex divide-x divide-dividerLight border-b border-dividerLight"
          >
            <HoppButtonSecondary
              v-tippy="{
                theme: 'tooltip',
                delay: [500, 20],
                content:
                  index !== workingCssVariables?.length - 1
                    ? t('action.drag_to_reorder')
                    : null,
              }"
              :icon="IconGripVertical"
              class="opacity-0"
              :class="{
                'draggable-handle cursor-grab group-hover:opacity-100':
                  index !== workingCssVariables?.length - 1,
              }"
              tabindex="-1"
            />
            <SmartEnvInput
              v-model="variable.varName"
              :placeholder="`${t('count.variable_name', { count: index + 1 })}`"
              @change="
                updateCssVariable(index, {
                  id: variable.id,
                  varName: $event,
                  expression: variable.expression,
                  attribute: variable.attribute,
                  matchNumber: variable.matchNumber,
                })
              "
            />
            <SmartEnvInput
              v-model="variable.expression"
              :placeholder="`${t('count.expression', { count: index + 1 })}`"
              @change="
                updateCssVariable(index, {
                  id: variable.id,
                  varName: variable.varName,
                  expression: $event,
                  attribute: variable.attribute,
                  matchNumber: variable.matchNumber,
                })
              "
            />
            <SmartEnvInput
              v-model="variable.attribute"
              :placeholder="`${t('count.attribute', { count: index + 1 })}`"
              @change="
                updateCssVariable(index, {
                  id: variable.id,
                  varName: variable.varName,
                  expression: variable.expression,
                  attribute: $event,
                  matchNumber: variable.matchNumber,
                })
              "
            />
            <SmartEnvInput
              v-model="variable.matchNumber"
              :placeholder="`${t('count.match_number', { count: index + 1 })}`"
              @change="
                updateCssVariable(index, {
                  id: variable.id,
                  varName: variable.varName,
                  expression: variable.expression,
                  attribute: variable.attribute,
                  matchNumber: $event,
                })
              "
            />
            <HoppButtonSecondary
              v-tippy="{ theme: 'tooltip' }"
              :title="t('action.remove')"
              :icon="IconTrash"
              color="red"
              @click="deleteCssVariable(index)"
            />
          </div>
        </template>
      </draggable>
      <!-- Empty Placeholder -->
      <HoppSmartPlaceholder
        v-if="workingCssVariables.length === 0"
        :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
        :alt="`${t('empty.css_variables')}`"
        :text="t('empty.css_variables')"
      >
        <template #body>
          <HoppButtonSecondary
            :label="`${t('add.new')}`"
            :icon="IconPlus"
            filled
            @click="addCssVariable"
          />
        </template>
      </HoppSmartPlaceholder>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { throwError } from "@functional/error"
import { LoadiumRESTCssSelectorVariables } from "@hoppscotch/data"
import { useVModel } from "@vueuse/core"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import { flow, pipe } from "fp-ts/function"
import { cloneDeep, isEqual } from "lodash-es"
import { ref, watch } from "vue"
import draggable from "vuedraggable-es"
import { useI18n } from "~/composables/i18n"
import { useColorMode } from "~/composables/theming"
import { useToast } from "~/composables/toast"
import { objRemoveKey } from "~/helpers/functional/object"
import IconGripVertical from "~icons/lucide/grip-vertical"
import IconPlus from "~icons/lucide/plus"
import IconTrash from "~icons/lucide/trash"
import IconTrash2 from "~icons/lucide/trash-2"

const colorMode = useColorMode()

const t = useI18n()
const toast = useToast()

const deletionToast = ref<{ goAway: (delay: number) => void } | null>(null)

const props = defineProps<{
  cssVariables: LoadiumRESTCssSelectorVariables[]
}>()

const emit = defineEmits<{
  (
    e: "update:cssVariables",
    value: Array<LoadiumRESTCssSelectorVariables>
  ): void
}>()

// The functional requestVariable list (the requestVariable actually applied to the session)
const cssVariables = useVModel(props, "cssVariables", emit)

const idTicker = ref(0)

const workingCssVariables = ref<
  Array<LoadiumRESTCssSelectorVariables & { id: number }>
>([
  {
    id: idTicker.value++,
    varName: "",
    expression: "",
    attribute: "",
    matchNumber: "1",
  },
])

watch(workingCssVariables, (variableList) => {
  if (
    variableList.length > 0 &&
    variableList[variableList.length - 1].varName !== ""
  ) {
    workingCssVariables.value.push({
      id: idTicker.value++,
      varName: "",
      expression: "",
      attribute: "",
      matchNumber: "1",
    })
  }
})

watch(workingCssVariables, (newWorkingCssVariables) => {
  const fixedCssVariables = pipe(
    newWorkingCssVariables,
    A.filterMap(
      flow(
        O.fromPredicate((e) => e.varName !== "" && e.expression !== "" && e.attribute !== "" && e.matchNumber !== ""),
        O.map(objRemoveKey("id"))
      )
    )
  )

  if (!isEqual(cssVariables.value, fixedCssVariables)) {
    cssVariables.value = cloneDeep(fixedCssVariables)
  }
})

watch(
  cssVariables,
  (newCssVariableList) => {
    const filteredWorkingCssVariables: LoadiumRESTCssSelectorVariables[] = pipe(
      workingCssVariables.value,
      A.filterMap(
        flow(
          O.fromPredicate((e) => e.varName !== "" && e.expression !== "" && e.attribute !== "" && e.matchNumber !== ""),
          O.map(objRemoveKey("id"))
        )
      )
    )
    if (!isEqual(newCssVariableList, filteredWorkingCssVariables)) {
      workingCssVariables.value = pipe(
        newCssVariableList,
        A.map((x) => ({ id: idTicker.value++, ...x }))
      )
    }
  },
  { immediate: true }
)

const addCssVariable = () => {
  workingCssVariables.value.push({
    id: idTicker.value++,
    varName: "",
    expression: "",
    attribute: "",
    matchNumber: "1",
  })
}

const updateCssVariable = (index: number, variable: any & { id: number }) => {
  workingCssVariables.value = workingCssVariables.value.map((h, i) =>
    i === index ? variable : h
  )
}

const deleteCssVariable = (index: number) => {
  const cssVariablesBeforeDeletion = cloneDeep(workingCssVariables.value)

  if (
    !(
      cssVariablesBeforeDeletion.length > 0 &&
      index === cssVariablesBeforeDeletion.length - 1
    )
  ) {
    if (deletionToast.value) {
      deletionToast.value.goAway(0)
      deletionToast.value = null
    }

    deletionToast.value = toast.success(`${t("state.deleted")}`, {
      action: [
        {
          text: `${t("action.undo")}`,
          onClick: (_, toastObject) => {
            workingCssVariables.value = cssVariablesBeforeDeletion
            toastObject.goAway(0)
            deletionToast.value = null
          },
        },
      ],

      onComplete: () => {
        deletionToast.value = null
      },
    })
  }

  workingCssVariables.value = pipe(
    workingCssVariables.value,
    A.deleteAt(index),
    O.getOrElseW(() =>
      throwError("Working Request Variable Deletion Out of Bounds")
    )
  )
}

const clearContent = () => {
  workingCssVariables.value = [
    {
      id: idTicker.value++,
      varName: "",
      expression: "",
      attribute: "",
      matchNumber: "1",
    },
  ]
}
</script>

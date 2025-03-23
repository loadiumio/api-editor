<template>
  <div>
    <div
      class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary pl-4 sm:top-upperSecondaryStickyFold"
    >
      <label class="truncate font-semibold text-secondaryLight">
        {{ t("request.regex") }}
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
          @click="addRegexVariable"
        />
      </div>
    </div>
    <div>
      <draggable
        v-model="workingRegexVariables"
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
                  index !== workingRegexVariables?.length - 1
                    ? t('action.drag_to_reorder')
                    : null,
              }"
              :icon="IconGripVertical"
              class="opacity-0"
              :class="{
                'draggable-handle cursor-grab group-hover:opacity-100':
                  index !== workingRegexVariables?.length - 1,
              }"
              tabindex="-1"
            />
            <SmartEnvInput
              v-model="variable.varName"
              :placeholder="`${t('count.variable_name', { count: index + 1 })}`"
              @change="
                updateRegexVariable(index, {
                  id: variable.id,
                  varName: $event,
                  expression: variable.value,
                  active: variable.active,
                })
              "
            />
            <SmartEnvInput
              v-model="variable.expression"
              :placeholder="`${t('count.expression', { count: index + 1 })}`"
              @change="
                updateRegexVariable(index, {
                  id: variable.id,
                  varName: variable.varName,
                  expression: $event,
                  active: variable.active,
                })
              "
            />
            <HoppButtonSecondary
              v-tippy="{ theme: 'tooltip' }"
              :title="
                variable.hasOwnProperty('active')
                  ? variable.active
                    ? t('action.turn_off')
                    : t('action.turn_on')
                  : t('action.turn_off')
              "
              :icon="
                variable.hasOwnProperty('active')
                  ? variable.active
                    ? IconCheckCircle
                    : IconCircle
                  : IconCheckCircle
              "
              color="green"
              @click="
                updateRegexVariable(index, {
                  id: variable.id,
                  varName: variable.varName,
                  expression: variable.expression,
                  active: variable.hasOwnProperty('active')
                    ? !variable.active
                    : false,
                })
              "
            />
            <HoppButtonSecondary
              v-tippy="{ theme: 'tooltip' }"
              :title="t('action.remove')"
              :icon="IconTrash"
              color="red"
              @click="deleteRegexVariable(index)"
            />
          </div>
        </template>
      </draggable>
      <!-- Empty Placeholder -->
      <HoppSmartPlaceholder
        v-if="workingRegexVariables.length === 0"
        :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
        :alt="`${t('empty.regex_variables')}`"
        :text="t('empty.regex_variables')"
      >
        <template #body>
          <HoppButtonSecondary
            :label="`${t('add.new')}`"
            :icon="IconPlus"
            filled
            @click="addRegexVariable"
          />
        </template>
      </HoppSmartPlaceholder>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { throwError } from "@functional/error"
import { LoadiumRESTRegexVariable } from "@hoppscotch/data"
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
import IconCheckCircle from "~icons/lucide/check-circle"
import IconCircle from "~icons/lucide/circle"
import IconGripVertical from "~icons/lucide/grip-vertical"
import IconPlus from "~icons/lucide/plus"
import IconTrash from "~icons/lucide/trash"
import IconTrash2 from "~icons/lucide/trash-2"

const colorMode = useColorMode()

const t = useI18n()
const toast = useToast()

const deletionToast = ref<{ goAway: (delay: number) => void } | null>(null)

const props = defineProps<{
  regexVariables: LoadiumRESTRegexVariable[]
}>()

const emit = defineEmits<{
  (
    e: "update:regexVariables",
    value: Array<LoadiumRESTRegexVariable>
  ): void
}>()

// The functional requestVariable list (the requestVariable actually applied to the session)
const regexVariables = useVModel(props, "regexVariables", emit)

const idTicker = ref(0)

const workingRegexVariables = ref<
  Array<LoadiumRESTRegexVariable & { id: number }>
>([
  {
    id: idTicker.value++,
    varName: "",
    expression: "",
    active: true,
  },
])

watch(workingRegexVariables, (variableList) => {
  if (
    variableList.length > 0 &&
    variableList[variableList.length - 1].varName !== ""
  ) {
    workingRegexVariables.value.push({
      id: idTicker.value++,
      varName: "",
      expression: "",
      active: true,
    })
  }
})

watch(workingRegexVariables, (newWorkingRegexVariables) => {
  const fixedRegexVariables = pipe(
    newWorkingRegexVariables,
    A.filterMap(
      flow(
        O.fromPredicate((e) => e.varName !== ""),
        O.map(objRemoveKey("id"))
      )
    )
  )

  if (!isEqual(regexVariables.value, fixedRegexVariables)) {
    regexVariables.value = cloneDeep(fixedRegexVariables)
  }
})

watch(
  regexVariables,
  (newRegexVariableList) => {
    const filteredWorkingRegexVariables: LoadiumRESTRegexVariable[] = pipe(
      workingRegexVariables.value,
      A.filterMap(
        flow(
          O.fromPredicate((e) => e.varName !== ""),
          O.map(objRemoveKey("id"))
        )
      )
    )
    if (!isEqual(newRegexVariableList, filteredWorkingRegexVariables)) {
      workingRegexVariables.value = pipe(
        newRegexVariableList,
        A.map((x) => ({ id: idTicker.value++, ...x }))
      )
    }
  },
  { immediate: true }
)

const addRegexVariable = () => {
  workingRegexVariables.value.push({
    id: idTicker.value++,
    varName: "",
    expression: "",
    active: true,
  })
}

const updateRegexVariable = (index: number, variable: any & { id: number }) => {
  workingRegexVariables.value = workingRegexVariables.value.map((h, i) =>
    i === index ? variable : h
  )
}

const deleteRegexVariable = (index: number) => {
  const regexVariablesBeforeDeletion = cloneDeep(
    workingRegexVariables.value
  )

  if (
    !(
      regexVariablesBeforeDeletion.length > 0 &&
      index === regexVariablesBeforeDeletion.length - 1
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
            workingRegexVariables.value = regexVariablesBeforeDeletion
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

  workingRegexVariables.value = pipe(
    workingRegexVariables.value,
    A.deleteAt(index),
    O.getOrElseW(() =>
      throwError("Working Request Variable Deletion Out of Bounds")
    )
  )
}

const clearContent = () => {
  workingRegexVariables.value = [
    {
      id: idTicker.value++,
      varName: "",
      expression: "",
      active: true,
    },
  ]
}
</script>

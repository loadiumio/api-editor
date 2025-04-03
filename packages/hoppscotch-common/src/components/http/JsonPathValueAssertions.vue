<template>
  <div>
    <div
      class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary pl-4 sm:top-upperSecondaryStickyFold"
    >
      <label class="truncate font-semibold text-secondaryLight">
        {{ t("request.json_path_value") }}
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
          @click="addJsonPathValue"
        />
      </div>
    </div>
    <div
      v-for="(assertion, index) in workingJsonPathValues"
      :key="`textAssertion-${index}`"
      class="group flex divide-x divide-dividerLight border-b border-dividerLight"
    >
      <span class="flex items-center w-full">
        <SmartEnvInput
          v-model="assertion.expression"
          :placeholder="t('request.expression')"
          @change="
            updateJsonPathValue(index, {
              id: assertion.id,
              expression: $event,
              condition: assertion.condition,
              value: assertion.value,
            })
          "
        />
      </span>
      <span class="flex items-center w-full">
        <tippy interactive trigger="click" theme="popover">
          <HoppSmartSelectWrapper>
            <HoppButtonSecondary
              :label="
                assertion.condition !== ''
                  ? assertionJsonPathConditions[assertion.condition]
                  : t('request.condition')
              "
              class="ml-2 rounded-none pr-8"
            />
          </HoppSmartSelectWrapper>
          <template #content="{ hide }">
            <div
              ref="jsonPathValueAssertTippyActions"
              class="flex flex-col focus:outline-none"
              tabindex="0"
            >
              <HoppSmartItem
                v-for="(conditionType, conditionIndex) in assertionJsonPathConditions"
                :key="`jsonPathValueConditionType-${index}-${conditionIndex}`"
                :label="conditionType"
                :icon="
                  workingJsonPathValues[index].condition === conditionIndex
                    ? IconCheckCircle
                    : IconCircle
                "
                @click="
                  () => {
                    changeCondition(index, conditionIndex)
                    hide()
                  }
                "
              />
            </div>
          </template>
        </tippy>
      </span>
      <span class="flex items-center w-full">
        <SmartEnvInput
          v-model="assertion.value"
          :placeholder="t('request.value')"
          @change="
            updateJsonPathValue(index, {
              id: assertion.id,
              expression: assertion.expression,
              condition: assertion.condition,
              value: $event,
            })
          "
        />
      </span>
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('action.remove')"
        :icon="IconTrash"
        color="red"
        @click="deleteJsonPathValueAssertion(index)"
      />
    </div>
    <HoppSmartPlaceholder
      v-if="workingJsonPathValues.length === 0"
      :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
      :alt="`${t('empty.json_path_value_assertions')}`"
      :text="t('empty.json_path_value_assertions')"
    >
      <template #body>
        <HoppButtonSecondary
          :label="`${t('add.new')}`"
          :icon="IconPlus"
          filled
          @click="addJsonPathValue"
        />
      </template>
    </HoppSmartPlaceholder>
  </div>
</template>
<script setup lang="ts">
import {
  LoadiumRESTAssertionJsonPathValue,
  assertionJsonPathConditions,
} from "@hoppscotch/data"
import { useVModel } from "@vueuse/core"
import { useColorMode } from "@composables/theming"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { ref, watch } from "vue"
import IconCircle from "~icons/lucide/circle"
import IconTrash2 from "~icons/lucide/trash2"
import IconPlus from "~icons/lucide/plus"
import { flow, pipe } from "fp-ts/function"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import { objRemoveKey } from "@functional/object"
import { cloneDeep, isEqual } from "lodash-es"
import IconTrash from "~icons/lucide/trash"
import { throwError } from "@functional/error"
import IconCheckCircle from "~icons/lucide/check-circle"

const colorMode = useColorMode()

const t = useI18n()
const toast = useToast()

const deletionToast = ref<{ goAway: (delay: number) => void } | null>(null)
const jsonPathValueAssertTippyActions = ref<any | null>(null)

const props = defineProps<{
  jsonPathValueAssertions: LoadiumRESTAssertionJsonPathValue[]
}>()

const emit = defineEmits<{
  (e: "update:jsonPathValueAssertions", value: Array<LoadiumRESTAssertionJsonPathValue>): void
}>()

const jsonPathValueAssertions = useVModel(props, "jsonPathValueAssertions", emit)

const idTicker = ref(0)

const workingJsonPathValues = ref<
  Array<LoadiumRESTAssertionJsonPathValue & { id: number }>
>([
  {
    id: idTicker.value++,
    expression: "$.",
    condition: "",
    value: "",
  },
])

watch(workingJsonPathValues, (newWorkingJsonPathValues) => {
  const fixedJsonPathValues = pipe(
    newWorkingJsonPathValues,
    A.filterMap(
      flow(
        O.fromPredicate((e) => e.expression !== "" && e.condition !== "" && e.value !== ""),
        O.map(objRemoveKey("id"))
      )
    )
  )

  if (!isEqual(jsonPathValueAssertions.value, fixedJsonPathValues)) {
    jsonPathValueAssertions.value = cloneDeep(fixedJsonPathValues)
  }
})

watch(
  jsonPathValueAssertions,
  (newJsonPathVariableList) => {
    const filteredWorkingJsonPathValues: LoadiumRESTAssertionJsonPathValue[] =
      pipe(
        workingJsonPathValues.value,
        A.filterMap(
          flow(
            O.fromPredicate((e) => e.expression !== "" && e.condition !== "" && e.value !== ""),
            O.map(objRemoveKey("id"))
          )
        )
      )
    if (!isEqual(newJsonPathVariableList, filteredWorkingJsonPathValues)) {
      workingJsonPathValues.value = pipe(
        newJsonPathVariableList,
        A.map((x) => ({ id: idTicker.value++, ...x }))
      )
    }
  },
  { immediate: true }
)

const addJsonPathValue = () => {
  workingJsonPathValues.value.push({
    id: idTicker.value++,
    expression: "$.",
    condition: "",
    value: "",
  })
}

const clearContent = () => {
  workingJsonPathValues.value = [
    {
      id: idTicker.value++,
      expression: "$.",
      condition: "",
      value: "",
    },
  ]
}

const changeCondition = (assertionIndex: any, conditionIndex: any) => {
  workingJsonPathValues.value[assertionIndex].condition = conditionIndex
}

const updateJsonPathValue = (index: number, variable: any & { id: number }) => {
  workingJsonPathValues.value = workingJsonPathValues.value.map((h, i) =>
    i === index ? variable : h
  )
}

const deleteJsonPathValueAssertion = (index: number) => {
  const jsonPathValueAssertionsBeforeDeletion = cloneDeep(
    workingJsonPathValues.value
  )

  if (
    !(
      jsonPathValueAssertionsBeforeDeletion.length > 0 &&
      index === jsonPathValueAssertionsBeforeDeletion.length - 1
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
            workingJsonPathValues.value = jsonPathValueAssertionsBeforeDeletion
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

  workingJsonPathValues.value = pipe(
    workingJsonPathValues.value,
    A.deleteAt(index),
    O.getOrElseW(() =>
      throwError("Working Request Variable Deletion Out of Bounds")
    )
  )
}
</script>

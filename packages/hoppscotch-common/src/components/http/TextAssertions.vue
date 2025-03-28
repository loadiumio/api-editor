<template>
  <div>
    <div
      class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary pl-4 sm:top-upperSecondaryStickyFold"
    >
      <label class="truncate font-semibold text-secondaryLight">
        {{ t("request.text") }}
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
          @click="addTextAssertion"
        />
      </div>
    </div>
    <div
      v-for="(assertion, index) in workingTextAssertions"
      :key="`textAssertion-${index}`"
      class="group flex divide-x divide-dividerLight border-b border-dividerLight"
    >
      <span class="flex items-center w-full">
        <tippy interactive trigger="click" theme="popover">
          <HoppSmartSelectWrapper>
            <HoppButtonSecondary
              :label="
                assertion.type !== ''
                  ? assertionTextTypes[assertion.type]
                  : t('request.subject')
              "
              class="ml-2 rounded-none pr-8"
            />
          </HoppSmartSelectWrapper>
          <template #content="{ hide }">
            <div
              ref="textAssertTippyActions"
              class="flex flex-col focus:outline-none"
              tabindex="0"
            >
              <HoppSmartItem
                v-for="(assertionType, typeIndex) in assertionTextTypes"
                :key="`assertionType-${index}-${typeIndex}`"
                :label="assertionType"
                :icon="
                  workingTextAssertions[index].type === typeIndex
                    ? IconCheckCircle
                    : IconCircle
                "
                @click="
                  () => {
                    changeAssertionType(index, typeIndex)
                    hide()
                  }
                "
              />
            </div>
          </template>
        </tippy>
      </span>
      <span class="flex items-center w-full">
        <tippy interactive trigger="click" theme="popover">
          <HoppSmartSelectWrapper>
            <HoppButtonSecondary
              :label="
                assertion.condition !== ''
                  ? assertionTextConditions[assertion.condition]
                  : t('request.condition')
              "
              class="ml-2 rounded-none pr-8"
            />
          </HoppSmartSelectWrapper>
          <template #content="{ hide }">
            <div
              ref="textAssertTippyActions"
              class="flex flex-col focus:outline-none"
              tabindex="0"
            >
              <HoppSmartItem
                v-for="(conditionType, conditionIndex) in assertionTextConditions"
                :key="`textConditionType-${index}-${conditionIndex}`"
                :label="conditionType"
                :icon="
                  workingTextAssertions[index].condition === conditionIndex
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
            updateTextAssertionValue(index, {
              id: assertion.id,
              type: assertion.type,
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
        @click="deleteTextAssertion(index)"
      />
    </div>
    <HoppSmartPlaceholder
      v-if="workingTextAssertions.length === 0"
      :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
      :alt="`${t('empty.text_assertions')}`"
      :text="t('empty.text_assertions')"
    >
      <template #body>
        <HoppButtonSecondary
          :label="`${t('add.new')}`"
          :icon="IconPlus"
          filled
          @click="addTextAssertion"
        />
      </template>
    </HoppSmartPlaceholder>
  </div>
</template>
<script setup lang="ts">
import {
  LoadiumRESTAssertionText,
  assertionTextTypes,
  assertionTextConditions,
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
const textAssertTippyActions = ref<any | null>(null)

const props = defineProps<{
  textAssertions: LoadiumRESTAssertionText[]
}>()

const emit = defineEmits<{
  (e: "update:textAssertions", value: Array<LoadiumRESTAssertionText>): void
}>()

const textAssertions = useVModel(props, "textAssertions", emit)

const idTicker = ref(0)

const workingTextAssertions = ref<
  Array<LoadiumRESTAssertionText & { id: number }>
>([
  {
    id: idTicker.value++,
    type: "",
    condition: "",
    value: "",
  },
])

watch(workingTextAssertions, (newWorkingTextAssertions) => {
  const fixedTextAssertions = pipe(
    newWorkingTextAssertions,
    A.filterMap(
      flow(
        O.fromPredicate((e) => e.type !== "" && e.condition !== "" && e.value !== ""),
        O.map(objRemoveKey("id"))
      )
    )
  )

  if (!isEqual(textAssertions.value, fixedTextAssertions)) {
    textAssertions.value = cloneDeep(fixedTextAssertions)
  }
})

watch(
  textAssertions,
  (newJsonPathVariableList) => {
    const filteredWorkingTextAssertions: LoadiumRESTAssertionText[] = pipe(
      workingTextAssertions.value,
      A.filterMap(
        flow(
          O.fromPredicate((e) => e.type !== "" && e.condition !== "" && e.value !== ""),
          O.map(objRemoveKey("id"))
        )
      )
    )
    if (!isEqual(newJsonPathVariableList, filteredWorkingTextAssertions)) {
      workingTextAssertions.value = pipe(
        newJsonPathVariableList,
        A.map((x) => ({ id: idTicker.value++, ...x }))
      )
    }
  },
  { immediate: true }
)

const addTextAssertion = () => {
  workingTextAssertions.value.push({
    id: idTicker.value++,
    type: "",
    condition: "",
    value: "",
  })
}

const clearContent = () => {
  workingTextAssertions.value = [
    {
      id: idTicker.value++,
      type: "",
      condition: "",
      value: "",
    },
  ]
}

const changeAssertionType = (assertionIndex: any, typeIndex: any) => {
  workingTextAssertions.value[assertionIndex].type = typeIndex
}

const changeCondition = (assertionIndex: any, conditionIndex: any) => {
  workingTextAssertions.value[assertionIndex].condition = conditionIndex
}

const updateTextAssertionValue = (
  index: number,
  variable: any & { id: number }
) => {
  workingTextAssertions.value = workingTextAssertions.value.map((h, i) =>
    i === index ? variable : h
  )
}

const deleteTextAssertion = (index: number) => {
  const textAssertionsBeforeDeletion = cloneDeep(workingTextAssertions.value)

  if (
    !(
      textAssertionsBeforeDeletion.length > 0 &&
      index === textAssertionsBeforeDeletion.length - 1
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
            workingTextAssertions.value = textAssertionsBeforeDeletion
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

  workingTextAssertions.value = pipe(
    workingTextAssertions.value,
    A.deleteAt(index),
    O.getOrElseW(() =>
      throwError("Working Request Variable Deletion Out of Bounds")
    )
  )
}
</script>

<template>
  <div>
    <div
      class="sticky top-upperMobileSecondaryStickyFold z-10 flex flex-shrink-0 items-center justify-between overflow-x-auto border-b border-dividerLight bg-primary pl-4 sm:top-upperSecondaryStickyFold"
    >
      <label class="truncate font-semibold text-secondaryLight">
        {{ t("request.json_path_assert") }}
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
          @click="addJsonPathAssert"
        />
      </div>
    </div>
    <div
      v-for="(assertion, index) in workingJsonPathAsserts"
      :key="`textAssertion-${index}`"
      class="group flex divide-x divide-dividerLight border-b border-dividerLight"
    >
      <span class="flex items-center w-full">
        <SmartEnvInput
          v-model="assertion.expression"
          :placeholder="t('request.expression')"
          @change="
            updateJsonPathAssertValue(index, {
              id: assertion.id,
              expression: $event,
            })
          "
        />
      </span>
      <HoppButtonSecondary
        v-tippy="{ theme: 'tooltip' }"
        :title="t('action.remove')"
        :icon="IconTrash"
        color="red"
        @click="deleteJsonPathAssertion(index)"
      />
    </div>
    <HoppSmartPlaceholder
      v-if="workingJsonPathAsserts.length === 0"
      :src="`/api-editor/images/states/${colorMode.value}/add_files.svg`"
      :alt="`${t('empty.json_path_assertions')}`"
      :text="t('empty.json_path_assertions')"
    >
      <template #body>
        <HoppButtonSecondary
          :label="`${t('add.new')}`"
          :icon="IconPlus"
          filled
          @click="addJsonPathAssert"
        />
      </template>
    </HoppSmartPlaceholder>
  </div>
</template>
<script setup lang="ts">
import {
  LoadiumRESTAssertionJsonPathAssert,
} from "@hoppscotch/data"
import { useVModel } from "@vueuse/core"
import { useColorMode } from "@composables/theming"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { ref, watch } from "vue"
import IconTrash2 from "~icons/lucide/trash2"
import IconPlus from "~icons/lucide/plus"
import { flow, pipe } from "fp-ts/function"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import { objRemoveKey } from "@functional/object"
import { cloneDeep, isEqual } from "lodash-es"
import IconTrash from "~icons/lucide/trash"
import { throwError } from "@functional/error"

const colorMode = useColorMode()

const t = useI18n()
const toast = useToast()

const deletionToast = ref<{ goAway: (delay: number) => void } | null>(null)

const props = defineProps<{
  jsonPathAssertions: LoadiumRESTAssertionJsonPathAssert[]
}>()

const emit = defineEmits<{
  (
    e: "update:jsonPathAssertions",
    value: Array<LoadiumRESTAssertionJsonPathAssert>
  ): void
}>()

const jsonPathAssertions = useVModel(props, "jsonPathAssertions", emit)

const idTicker = ref(0)

const workingJsonPathAsserts = ref<
  Array<LoadiumRESTAssertionJsonPathAssert & { id: number }>
>([
  {
    id: idTicker.value++,
    expression: "$.",
  },
])

watch(workingJsonPathAsserts, (newWorkingJsonPathAsserts) => {
  const fixedJsonPathAsserts = pipe(
    newWorkingJsonPathAsserts,
    A.filterMap(
      flow(
        O.fromPredicate((e) => e.expression !== "$."),
        O.map(objRemoveKey("id"))
      )
    )
  )

  if (!isEqual(jsonPathAssertions.value, fixedJsonPathAsserts)) {
    jsonPathAssertions.value = cloneDeep(fixedJsonPathAsserts)
  }
})

watch(
  jsonPathAssertions,
  (newJsonPathVariableList) => {
    const filteredWorkingJsonPathAsserts: LoadiumRESTAssertionJsonPathAssert[] =
      pipe(
        workingJsonPathAsserts.value,
        A.filterMap(
          flow(
            O.fromPredicate((e) => e.expression !== "$."),
            O.map(objRemoveKey("id"))
          )
        )
      )
    if (!isEqual(newJsonPathVariableList, filteredWorkingJsonPathAsserts)) {
      workingJsonPathAsserts.value = pipe(
        newJsonPathVariableList,
        A.map((x) => ({ id: idTicker.value++, ...x }))
      )
    }
  },
  { immediate: true }
)

const addJsonPathAssert = () => {
  workingJsonPathAsserts.value.push({
    id: idTicker.value++,
    expression: "$.",
  })
}

const clearContent = () => {
  workingJsonPathAsserts.value = [
    {
      id: idTicker.value++,
      expression: "$.",
    },
  ]
}

const updateJsonPathAssertValue = (
  index: number,
  variable: any & { id: number }
) => {
  workingJsonPathAsserts.value = workingJsonPathAsserts.value.map((h, i) =>
    i === index ? variable : h
  )
}

const deleteJsonPathAssertion = (index: number) => {
  const jsonPathAssertionsBeforeDeletion = cloneDeep(
    workingJsonPathAsserts.value
  )

  if (
    !(
      jsonPathAssertionsBeforeDeletion.length > 0 &&
      index === jsonPathAssertionsBeforeDeletion.length - 1
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
            workingJsonPathAsserts.value = jsonPathAssertionsBeforeDeletion
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

  workingJsonPathAsserts.value = pipe(
    workingJsonPathAsserts.value,
    A.deleteAt(index),
    O.getOrElseW(() =>
      throwError("Working Request Variable Deletion Out of Bounds")
    )
  )
}
</script>

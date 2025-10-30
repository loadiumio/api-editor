<template>
  <div>
    <div class="flex flex-col">
      <div class="mb-4 flex flex-col border border-divider rounded">
        <HoppSmartTabs v-model="selectedEnvOption" render-inactive-tabs>
          <template #actions>
            <div class="flex flex-1 items-center justify-between">
              <HoppButtonSecondary
                v-tippy="{ theme: 'tooltip' }"
                :icon="IconPlus"
                :title="t('add.new')"
                @click="addEnvironmentVariable"
              />
            </div>
          </template>

          <HoppSmartTab
            v-for="tab in tabsData"
            :id="tab.id"
            :key="tab.id"
            :label="tab.label"
          >
            <div class="divide-y divide-dividerLight">
              <HoppSmartPlaceholder
                v-if="tab.variables.length === 0"
                :src="`/api-editor/images/states/${colorMode.value}/blockchain.svg`"
                :alt="tab.emptyStateLabel"
                :text="tab.emptyStateLabel"
              >
                <template #body>
                  <HoppButtonSecondary
                    :label="`${t('add.new')}`"
                    filled
                    :icon="IconPlus"
                    @click="addEnvironmentVariable"
                  />
                </template>
              </HoppSmartPlaceholder>

              <template v-else>
                <div
                  v-for="({ id, env }, index) in tab.variables"
                  :key="`variable-${id}-${index}`"
                  class="flex divide-x divide-dividerLight"
                >
                  <input
                    v-model="env.key"
                    v-focus
                    class="flex w-full bg-transparent px-4 py-2"
                    :placeholder="`${t('count.variable', {
                      count: index + 1,
                    })}`"
                    :name="'param' + index"
                  />
                  <!--<SmartEnvInput
                    v-model="env.value"
                    :placeholder="`${t('count.value', { count: index + 1 })}`"
                    :envs="liveEnvs"
                    :name="'value' + index"
                    :secret="tab.isSecret"
                    :select-text-on-mount="
                      env.key ? env.key === editingVariableName : false
                    "
                  />-->
                  <input
                    v-model="env.value"
                    class="flex w-full bg-transparent px-4 py-2"
                    :placeholder="`${t('count.value', { count: index + 1 })}`"
                    :name="'value' + index"
                  />
                  <input
                    v-model="env.description"
                    class="flex w-full bg-transparent px-4 py-2"
                    :placeholder="`${t('count.description', { count: index + 1 })}`"
                    :name="'description' + index"
                  />
                  <div class="flex">
                    <HoppButtonSecondary
                      id="variable"
                      v-tippy="{ theme: 'tooltip' }"
                      :title="t('action.remove')"
                      :icon="IconTrash"
                      color="red"
                      @click="removeEnvironmentVariable(id)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </HoppSmartTab>
        </HoppSmartTabs>
      </div>
    </div>
  </div>
  <span class="px-2">
    <HoppButtonPrimary
      v-if="vars.length"
      v-model="editingName"
      :label="`${t('action.save')}`"
      outline
      @click="saveEnvironment"
    />
  </span>
</template>

<script setup lang="ts">
import { ref, computed, ComputedRef, onMounted, watch } from "vue"
import { environments$, getGlobalVariables } from "~/newstore/environments"
import { useColorMode } from "~/composables/theming"
import { useReadonlyStream } from "@composables/stream"
import { useI18n } from "~/composables/i18n"
import IconPlus from "~icons/lucide/plus"
import { defineActionHandler } from "~/helpers/actions"
import { sortPersonalEnvironmentsAlphabetically } from "~/helpers/utils/sortEnvironmentsAlphabetically"
import { useToast } from "~/composables/toast"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import { flow, pipe } from "fp-ts/function"
import { Environment } from "@hoppscotch/data"
import {
  setGlobalEnvVariables,
  globalEnvTracker,
} from "~/newstore/environments"
import IconTrash from "~icons/lucide/trash"

const t = useI18n()
const colorMode = useColorMode()

const environments = useReadonlyStream(environments$, [])

// Sort environments alphabetically by default
const alphabeticallySortedPersonalEnvironments = computed(() =>
  sortPersonalEnvironmentsAlphabetically(environments.value, "asc")
)

/*const showModalImportExport = ref(false)*/
const showModalDetails = ref(false)
const action = ref<"new" | "edit">("edit")
const editingEnvironmentIndex = ref<number | null>(null)
const editingVariableName = ref("")
const secretOptionSelected = ref(false)

type EnvironmentVariable = {
  id: number
  env: {
    value: string
    key: string
    secret: boolean
    description: string
  }
}
type SelectedEnv = "variables" | "secret"

const selectedEnvOption = ref<SelectedEnv>("variables")
const editingName = ref<string | null>("Global")
const toast = useToast()
const idTicker = ref(0)
const vars = ref<EnvironmentVariable[]>([])

const workingEnv = computed(() => {
  const vars = getGlobalVariables()
  return {
    name: "Global",
    variables: vars,
  } as Environment
})

onMounted(() => {
  editingName.value = workingEnv.value?.name ?? null
  selectedEnvOption.value = "variables"

  vars.value = pipe(
    workingEnv.value?.variables ?? [],
    A.mapWithIndex((index, e) => ({
      id: idTicker.value++,
      env: {
        key: e.key,
        value: e.value,
        secret: e.secret,
        description: e.description,
      },
    }))
  )
})

const displayModalEdit = (shouldDisplay: boolean) => {
  action.value = "edit"
  showModalDetails.value = shouldDisplay

  if (!shouldDisplay) resetSelectedData()
}
const editEnvironment = (environmentIndex: number) => {
  editingEnvironmentIndex.value = environmentIndex
  action.value = "edit"
  displayModalEdit(true)
}
const resetSelectedData = () => {
  editingEnvironmentIndex.value = null
  editingVariableName.value = ""
  secretOptionSelected.value = false
}

defineActionHandler(
  "modals.my.environment.edit",
  ({ envName, variableName, isSecret }) => {
    if (variableName) editingVariableName.value = variableName
    const env = alphabeticallySortedPersonalEnvironments.value.find(
      ({ env }) => env.name === envName
    )
    if (envName !== "Global" && env) {
      editEnvironment(env.index)
      secretOptionSelected.value = isSecret ?? false
    }
  }
)

const tabsData: ComputedRef<
  {
    id: string
    label: string
    emptyStateLabel: string
    isSecret: boolean
    variables: EnvironmentVariable[]
  }[]
> = computed(() => {
  return [
    {
      id: "variables",
      label: t("environment.variables"),
      emptyStateLabel: t("empty.global_variables"),
      isSecret: false,
      variables: nonSecretVars.value,
    },
  ]
})

const nonSecretVars = computed(() =>
  pipe(
    vars.value,
    A.filter((e) => !e.env.secret)
  )
)

watch(
  globalEnvTracker,
  () => {
    vars.value = pipe(
      workingEnv.value?.variables ?? [],
      A.mapWithIndex((index, e) => ({
        id: idTicker.value++,
        env: {
          key: e.key,
          value: e.value,
          secret: e.secret,
          description: e.description,
        },
      }))
    )
  },
  { deep: true, immediate: true }
)

const addEnvironmentVariable = () => {
  vars.value.push({
    id: idTicker.value++,
    env: {
      key: "",
      value: "",
      secret: selectedEnvOption.value === "secret",
      description: "",
    },
  })
}

const removeEnvironmentVariable = (id: number) => {
  const index = vars.value.findIndex((e) => e.id === id)
  if (index !== -1) {
    vars.value.splice(index, 1)
    saveEnvironment()
  }
}

const saveEnvironment = () => {
  if (!editingName.value) {
    toast.error(`${t("environment.invalid_name")}`)
    return
  }

  if (editingName.value.length < 3) {
    toast.error(`${t("environment.short_name")}`)
    return
  }

  const filteredVariables = pipe(
    vars.value,
    A.filterMap(
      flow(
        O.fromPredicate((e) => e.env.key !== ""),
        O.map((e) => e.env)
      )
    )
  )

  const variables = pipe(
    filteredVariables,
    A.map((e) => (e.secret ? { key: e.key, secret: e.secret } : e))
  )
  const environmentUpdated: Environment = {
    v: 1,
    id: "Global",
    name: editingName.value,
    variables,
  }

  setGlobalEnvVariables(environmentUpdated)
  toast.success(`${t("environment.updated")}`)
}
</script>

<template>
  <div class="group flex items-stretch">
    <span class="flex items-center justify-center px-4">
      <icon-lucide-file class="svg-icons" />
    </span>
    <span
      class="flex min-w-0 flex-1 py-2 pr-2 transition group-hover:text-secondaryDark"
    >
      <span class="truncate">
        {{ t("csv_import.csv_files") }}
      </span>
    </span>
  </div>
  <div>
    <div class="flex flex-col">
      <div class="my-0 flex flex-col border border-divider rounded">
        <HoppSmartTabs v-model="selectedFileOption" render-inactive-tabs>
          <template #actions>
            <div class="flex flex-1 items-center justify-between">
              <HoppButtonSecondary
                v-tippy="{ theme: 'tooltip' }"
                :icon="IconFilePlus"
                :title="t('csv_import.import')"
                class="!rounded-none"
                @click="displayModalImport(true)"
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
                v-if="tab.files.length === 0"
                :src="`/api-editor/images/states/${colorMode.value}/blockchain.svg`"
                :alt="tab.emptyStateLabel"
                :text="tab.emptyStateLabel"
              >
                <template #body>
                  <div class="flex flex-col items-center space-y-4">
                    <span class="text-center text-secondaryLight">
                      {{ t("csv_import.upload_file") }}
                    </span>
                    <div class="flex flex-col items-stretch gap-4">
                      <HoppButtonPrimary
                        :icon="IconImport"
                        :label="t('import.upload_title')"
                        filled
                        outline
                        style="background-color: #ff481d; border-color: #ff481d"
                        @click="displayModalImport(true)"
                      />
                    </div>
                  </div>
                </template>
              </HoppSmartPlaceholder>

              <template v-else>
                <div
                  v-for="(file, index) in csvFiles"
                  :key="`file-${file.filename}`"
                  @click="displayModalEdit(true, file)"
                >
                  <div
                    class="flex flex-1 items-center justify-between border-dividerLight"
                    @click="toggleCollapse(index)"
                  >
                    <div class="group flex items-stretch">
                      <span class="flex items-center justify-center px-4">
                        <icon-lucide-file class="svg-icons" />
                      </span>
                      <span class="flex min-w-0 flex-1 py-2 pr-2 transition">
                        <span class="truncate">
                          {{ file.filename }}
                        </span>
                      </span>
                    </div>
                    <HoppButtonSecondary
                      v-tippy="{ theme: 'tooltip' }"
                      :icon="IconTrash2"
                      :title="t('action.delete')"
                      color="red"
                      class="!rounded-none"
                      @click="displayDeleteConfirmationModal(index)"
                    />
                  </div>
                  <div v-show="!collapsedFiles[index]" class="w-full p-4">
                    <div class="grid grid-cols-2 items-center gap-4 mb-4">
                      <label>{{ t("csv_import.variable_names") }}</label>
                      <input
                        v-model="file.variableNames"
                        class="flex w-full border bg-transparent px-4 py-2"
                        :placeholder="'Variable1, Variable2...'"
                        :name="'variableNames' + index"
                      />
                    </div>
                    <div class="grid grid-cols-2 items-center gap-4 mb-4">
                      <label>{{ t("csv_import.delimiter") }}</label>
                      <input
                        v-model="file.delimiter"
                        class="flex w-full border bg-transparent px-4 py-2"
                        :placeholder="'Delimiter'"
                        :name="'delimiter' + index"
                      />
                    </div>
                    <div class="flex items-center justify-between mb-4">
                      <span>{{ t("csv_import.ignore_first") }}</span>
                      <HoppSmartToggle
                        :on="file.ignoreFirstLine"
                        @change="file.ignoreFirstLine = !file.ignoreFirstLine"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <span>{{ t("csv_import.recycle_eof") }}</span>
                      <HoppSmartToggle
                        :on="file.recycleEndOfLine"
                        @change="file.recycleEndOfLine = !file.recycleEndOfLine"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </HoppSmartTab>
        </HoppSmartTabs>
      </div>
    </div>
    <CsvImport
      v-if="showModalImport"
      :current-files="[...csvFiles]"
      @hide-modal="displayModalImport(false)"
      @add-files="addImportedFiles($event)"
    />
    <HoppSmartConfirmModal
      :show="showConfirmModal"
      :title="t('csv_import.remove_file')"
      @hide-modal="showConfirmModal = false"
      @resolve="resolveConfirmModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ComputedRef, onMounted, ref } from "vue"
import { useI18n } from "~/composables/i18n"
import { useColorMode } from "~/composables/theming"
import IconImport from "~icons/lucide/folder-down"
import IconTrash2 from "~icons/lucide/trash-2"
import IconFilePlus from "~icons/lucide/file-plus"

import { pipe } from "fp-ts/lib/function"
import { CSVFile, getFiles, setFiles } from "~/newstore/files"

const t = useI18n()
const colorMode = useColorMode()

onMounted(() => {
  const storedFiles: CSVFile[] = getFiles().files
  csvFiles.value.push(...storedFiles)
})

const selectedFileOption = ref<string>("files")

const csvFiles = ref<CSVFile[]>([])
const targetFile = ref<CSVFile | null>(null)
const deleteTargetIndex = ref(0)
const showModalImport = ref(false)
const showModalDetails = ref(false)
const showConfirmModal = ref(false)

const tabsData: ComputedRef<
  {
    id: string
    label: string
    emptyStateLabel: string
    isSecret: boolean
    files: CSVFile[]
  }[]
> = computed(() => {
  return [
    {
      id: "files",
      label: t("csv_import.csv_files"),
      emptyStateLabel: t("empty.csv_files"),
      isSecret: false,
      files: csvFileList.value,
    },
  ]
})

const csvFileList = computed(() => pipe(csvFiles.value))
const collapsedFiles = ref(Array(csvFileList.value.length).fill(true))

const displayModalEdit = (shouldDisplay: boolean, file?: CSVFile) => {
  targetFile.value = file ?? null
  showModalDetails.value = shouldDisplay
}

const displayModalImport = (shouldDisplay: boolean) => {
  showModalImport.value = shouldDisplay
}

const addImportedFiles = (importedFiles: any[]) => {
  csvFiles.value.push(...importedFiles)
  setFiles(csvFiles.value)
}

const deleteFile = (index: number) => {
  const removedFile = csvFiles.value.splice(index, 1)
  setFiles(csvFiles.value)
  window.parent.postMessage({ status: "REMOVE_FILE", filename: removedFile[0].filename }, "*")
}

const toggleCollapse = (index: number) => {
  collapsedFiles.value[index] = !collapsedFiles.value[index]
}

const displayDeleteConfirmationModal = (index: number) => {
  showConfirmModal.value = true
  deleteTargetIndex.value = index
}

const resolveConfirmModal = () => {
  deleteFile(deleteTargetIndex.value)
  showConfirmModal.value = false
}
</script>

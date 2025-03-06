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
                :icon="IconImport"
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
                        @click="displayModalImport(true)"
                      />
                    </div>
                  </div>
                </template>
              </HoppSmartPlaceholder>

              <template v-else>
                <div
                  v-for="(file, index) in csvFiles"
                  :key="`file-${file.name}`"
                  class="flex flex-1 items-center justify-between"
                  @click="displayModalEdit(true, file)"
                >
                  <div class="group flex items-stretch">
                    <span class="flex items-center justify-center px-4">
                      <icon-lucide-file class="svg-icons" />
                    </span>
                    <span class="flex min-w-0 flex-1 py-2 pr-2 transition">
                      <span class="truncate">
                        {{ file.name }}
                      </span>
                    </span>
                  </div>
                  <HoppButtonSecondary
                    :icon="IconTrash2"
                    color="red"
                    class="!rounded-none"
                    @click="deleteFile(index)"
                  />
                </div>
              </template>
            </div>
          </HoppSmartTab>
        </HoppSmartTabs>
      </div>
    </div>
    <!-- <CSVDetails
      :show="showModalDetails"
      :target-file="targetFile"
      @hide-modal="displayModalEdit(false)"
    /> -->
    <CsvImport
      v-if="showModalImport"
      @hide-modal="displayModalImport(false, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ComputedRef, ref } from "vue"
import { useI18n } from "~/composables/i18n"
import { useColorMode } from "~/composables/theming"
import IconImport from "~icons/lucide/folder-down"
import IconTrash2 from "~icons/lucide/trash-2"

import { pipe } from "fp-ts/lib/function"

const t = useI18n()
const colorMode = useColorMode()

const selectedFileOption = ref<string>("files")

const csvFiles = ref<File[]>([])
const targetFile = ref<File | null>(null)
const showModalImport = ref(false)
const showModalDetails = ref(false)

const tabsData: ComputedRef<
  {
    id: string
    label: string
    emptyStateLabel: string
    isSecret: boolean
    files: File[]
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

const displayModalEdit = (shouldDisplay: boolean, file?: File) => {
  targetFile.value = file ?? null
  showModalDetails.value = shouldDisplay
}

const displayModalImport = (shouldDisplay: boolean, data?: any[]) => {
  if (data) {
    csvFiles.value.push(...data)
  }
  showModalImport.value = shouldDisplay
}

const deleteFile = (index: number) => {
  csvFiles.value.splice(index, 1)
}
</script>

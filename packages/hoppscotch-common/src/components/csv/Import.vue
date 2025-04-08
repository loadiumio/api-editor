<template>
  <ImportExportBase
    ref="collections-import-export"
    modal-title="modal.file"
    :importer-modules="importerModules"
    :exporter-modules="[]"
    :is-upload="true"
    @hide-modal="emit('hide-modal')"
  />
</template>

<script setup lang="ts">
import { FileSource } from "~/helpers/import-export/import/import-sources/FileSource"
import { ImporterOrExporter } from "../importExport/types"
import IconFolderPlus from "~icons/lucide/folder-plus"
import { PropType, ref } from "vue"
import { CSVFile } from "~/newstore/files"
import { useI18n } from "~/composables/i18n"
import { useToast } from "@composables/toast"

const t = useI18n()
const toast = useToast()

const props = defineProps({
  currentFiles: {
    type: Array as PropType<CSVFile[]>,
    default: () => [],
    required: true,
  },
})

const isCSVImporterInProgress = ref(false)

const CSVImport: ImporterOrExporter = {
  metadata: {
    id: "import.csv",
    name: "import.csv",
    icon: IconFolderPlus,
    title: "import.csv",
    applicableTo: ["personal-workspace"],
    disabled: false,
  },
  component: FileSource({
    acceptedFileTypes: ".csv",
    caption: "import.csv",
    onImportFromFile: async (fileContents, files) => {
      isCSVImporterInProgress.value = true
      if (files) {
        const filteredFiles = filterFilesByName(files)
        checkSameFileName(filteredFiles.length, files.length)
        window.parent.postMessage({ status: "CSV_UPLOAD", files: filteredFiles }, "*")
        const CSVFiles = createCSVFiles(filteredFiles)
        emit("hide-modal")
        emit("add-files", [...CSVFiles])
      } else {
        showImportFailedError()
      }

      isCSVImporterInProgress.value = false
    },
    isLoading: isCSVImporterInProgress,
  }),
}

const importerModules = [CSVImport]

const emit = defineEmits<{
  (e: "hide-modal"): () => void
  (e: "add-files", files: any[]): () => void
}>()

const checkSameFileName = (filteredFileCount: number, fileCount: number) => {
  if (filteredFileCount !== fileCount) {
    toast.error(`${t("csv_import.file_name_error")}`)
  }
}

const filterFilesByName = (files: any[]) => {
  const existingFileNames = new Set(
    props.currentFiles.map((file) => file.filename)
  )
  return files.filter((file: File) => !existingFileNames.has(file.name) && !file.name.includes(' '))
}

const createCSVFiles = (files: any[]) => {
  return files.map(
    (file: File) =>
      ({
        filename: file.name,
        variableNames: "",
        delimiter: "",
        ignoreFirstLine: false,
        recycleEndOfLine: false,
      }) as CSVFile
  )
}

function showImportFailedError() {
  throw new Error("Function not implemented.")
}
</script>

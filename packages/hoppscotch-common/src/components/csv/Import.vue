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
      if (fileContents && files) {
        const filteredFiles = filterFilesByName(files)
        checkSameFileName(filteredFiles.length, files.length)
        const CSVFiles = createFiles(fileContents, filteredFiles)
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
    toast.error(`${t("csv_import.same_file_name")}`)
  }
}

const filterFilesByName = (fileDetails: any[]) => {
  const existingFileNames = new Set(
    props.currentFiles.map((file) => file.fileData.name)
  )
  return fileDetails.filter((file: File) => !existingFileNames.has(file.name))
}

const createFiles = (fileContents: any[], files: any[]) => {
  const filesWithContent = files.map((file, index) => {
    file["data"] = fileContents[index]
    return file
  })
  return filesWithContent.map((file: File) => ({
    fileData: file,
    variableNames: "",
    delimiter: "",
    ignoreFirst: false,
    recycleEOF: false,
  }))
}

function showImportFailedError() {
  throw new Error("Function not implemented.")
}
</script>

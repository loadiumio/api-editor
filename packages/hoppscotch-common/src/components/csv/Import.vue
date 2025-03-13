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
import { ref } from "vue"

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
    onImportFromFile: async (content, details) => {
      isCSVImporterInProgress.value = true
      if (content) {
        const files: any[] = details.map((file, index) => {
          file["data"] = content[index]
          return file
        })
        emit("hide-modal", [...files])
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
  (e: "hide-modal", files?: any[]): () => void
}>()

function showImportFailedError() {
  throw new Error("Function not implemented.")
}
</script>

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
//import * as E from "fp-ts/Either"

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
      const res = true

      //if (E.isRight(res))
      if (res) {
        //console.log(content)
        emit("hide-modal", [...details])
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
  (e: "hide-modal", importedFiles?: any[]): () => void
}>()

function showImportFailedError() {
  throw new Error("Function not implemented.")
}
</script>

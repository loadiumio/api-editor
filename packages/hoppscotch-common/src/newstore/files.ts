import DispatchingStore, {
  defineDispatchers,
} from "~/newstore/DispatchingStore"

export type CSVFile = {
  fileData: File
  variableNames: string
  delimiter: string
  ignoreFirst: boolean
  recycleEOF: boolean
}

const defaultFileState = {
  files: [] as CSVFile[],
}

const dispatchers = defineDispatchers({
  setFiles(_, { files }: { files: CSVFile[] }) {
    return {
      files: files,
    }
  },
})

export const fileStore = new DispatchingStore(defaultFileState, dispatchers)

export function setFiles(files: CSVFile[]) {
  fileStore.dispatch({
    dispatcher: "setFiles",
    payload: {
      files,
    },
  })
}

export function getFiles() {
  return fileStore.value
}

import DispatchingStore, {
  defineDispatchers,
} from "~/newstore/DispatchingStore"

export type CSVFile = {
  variableNames: string
  delimiter: string
  ignoreFirstLine: boolean
  recycleEndOfLine: boolean
  filename: string
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

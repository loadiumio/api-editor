import { addRESTCollection } from "~/newstore/collections"
import {
  HoppRESTRequest,
  makeCollection,
  Environment,
  GlobalEnvironmentVariable,
} from "@hoppscotch/data"
import { getDefaultRESTRequest } from "@helpers/rest/default"
import { setGlobalEnvVariables } from "~/newstore/environments"
import { uniqueID } from "@helpers/utils/uniqueID"
import { CSVFile, setFiles } from "~/newstore/files"

enum BodyContentTypes {
  "TEXT" = "text/plain",
  "JSON" = "application/json",
  "URLENCODED" = "application/x-www-form-urlencoded",
}

export function fillRecordData(record: any) {
  const filteredCollections = record.collections.filter(
    (collection: any) => !collection._isTempGroup
  )
  if (filteredCollections.length === 0) return
  filteredCollections.forEach((collection: any) => {
    const requestList: HoppRESTRequest[] = []
    collection.items?.forEach((request: any) => {
      if (request.type === "SLEEP") {
        const newSleep: HoppRESTRequest = {
          ...getDefaultRESTRequest(),
          method: "SLEEP",
          params: [
            {
              key: "time",
              value: request.data.time.toString(),
              description: "",
              active: true,
            },
          ],
        }
        requestList.push(newSleep)
      } else {
        const newRequest: HoppRESTRequest = {
          ...getDefaultRESTRequest(),
          name: request.data.name ?? request.data.url ?? "Request",
          endpoint: request.data.url,
          method: request.data.method,
          params: request.data.queryParameters,
          headers: request.data.requestHeaders,
          body: {
            contentType:
              BodyContentTypes[
                request.data.requestBody?.type as keyof typeof BodyContentTypes
              ],
            body: request.data.requestBody?.data,
          },
        }
        request.data.checks?.forEach((check: any) => {
          const { subject, condition, value, expression } = check.data

          switch (check.type) {
            case "TEXT":
              newRequest.textAssertions.push({
                type: subject,
                condition: condition,
                value: value,
              })
              break
            case "JSON_PATH_VALUE":
              newRequest.jsonPathValueAssertions.push({
                expression: expression,
                condition: condition,
                value: value,
              })
              break
            case "JSON_PATH_ASSETS":
              newRequest.jsonPathAssertions.push({ expression: expression })
              break
          }
        })
        request.data.variables?.forEach((variable: any) => {
          const { name, expression, attribute, matchNumber } = variable.data
          const newVariable = { varName: name, expression: expression }

          switch (variable.type) {
            case "JSON_PATH":
              newRequest.jsonPathVariables.push(newVariable)
              break
            case "REGEX":
              newRequest.regexVariables.push(newVariable)
              break
            case "CSS_SELECTOR":
              newRequest.cssSelectorVariables.push({
                ...newVariable,
                attribute: attribute,
                matchNumber: matchNumber.toString(),
              })
              break
          }
        })
        requestList.push(newRequest)
      }
    })
    const newCollection = makeCollection({
      name: collection.name,
      folders: [],
      requests: requestList,
      headers: [],
      auth: {
        authType: "none",
        authActive: true,
      },
    })
    addRESTCollection(newCollection)
    const globalEnv = {
      v: 1,
      id: uniqueID(),
      name: "Global",
      variables: (record.userDefinedVariable?.map((variable: any) => ({
        ...variable,
        secret: false,
      })) || []) as GlobalEnvironmentVariable[],
    } as Environment
    setGlobalEnvVariables(globalEnv)
    const csvFiles: CSVFile[] = []
    record.csvItems?.forEach((item: any) => {
      csvFiles.push(item as CSVFile)
    })
    setFiles(csvFiles)
  })
}

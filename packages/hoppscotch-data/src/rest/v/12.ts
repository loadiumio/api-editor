import { defineVersion } from "verzod"
import { z } from "zod"
import { V11_SCHEMA } from "./11"

export const LoadiumRESTJsonPathVariables = z.array(
  z.object({
    varName: z.string().catch(""),
    expression: z.string().catch(""),
  })
)

export const LoadiumRESTRegexVariables = z.array(
  z.object({
    varName: z.string().catch(""),
    expression: z.string().catch(""),
  })
)

export const LoadiumRESTCssSelectorVariables = z.array(
  z.object({
    varName: z.string().catch(""),
    expression: z.string().catch(""),
    attribute: z.string().catch(""),
    matchNumber: z.string().catch(""),
  })
)

export const LoadiumRESTAssertionText = z.array(
  z.object({
    type: z.string().catch(""),
    condition: z.string().catch(""),
    value: z.string().catch(""),
  })
)


export const LoadiumRESTAssertionJsonPathValue = z.array(
  z.object({
    expression: z.string().catch(""),
    condition: z.string().catch(""),
    value: z.string().catch(""),
  })
)

export const LoadiumRESTAssertionJsonPathAssert = z.array(
  z.object({
    expression: z.string().catch(""),
  })
)

export type LoadiumRESTJsonPathVariables = z.infer<typeof LoadiumRESTJsonPathVariables>
export type LoadiumRESTRegexVariables = z.infer<typeof LoadiumRESTRegexVariables>
export type LoadiumRESTCssSelectorVariables = z.infer<typeof LoadiumRESTCssSelectorVariables>
export type LoadiumRESTAssertionText = z.infer<typeof LoadiumRESTAssertionText>
export type LoadiumRESTAssertionJsonPathValue = z.infer<typeof LoadiumRESTAssertionJsonPathValue>
export type LoadiumRESTAssertionJsonPathAssert = z.infer<typeof LoadiumRESTAssertionJsonPathAssert>

export const V12_SCHEMA = V11_SCHEMA.extend({
  v: z.literal("12"),
  jsonPathVariables: LoadiumRESTJsonPathVariables,
  regexVariables: LoadiumRESTRegexVariables,
  cssSelectorVariables: LoadiumRESTCssSelectorVariables,
  textAssertions: LoadiumRESTAssertionText,
  jsonPathValueAssertions: LoadiumRESTAssertionJsonPathValue,
  jsonPathAssertions: LoadiumRESTAssertionJsonPathAssert,
})

export default defineVersion({
  initial: false,
  schema: V12_SCHEMA,
  up(old: z.infer<typeof V11_SCHEMA>) {
    return {
      ...old,
      v: "12",
      jsonPathVariables: [],
      regexVariables: [],
      cssSelectorVariables: [],
      textAssertions: [],
      jsonPathValueAssertions: [],
      jsonPathAssertions: [],
    } as z.infer<typeof V12_SCHEMA>
  },
})

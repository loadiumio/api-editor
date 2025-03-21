import { defineVersion } from "verzod"
import { z } from "zod"
import { V11_SCHEMA } from "./11"

export const LoadiumRESTJsonPathVariables = z.array(
  z.object({
    varName: z.string().catch(""),
    expression: z.string().catch(""),
    active: z.boolean().catch(true),
  })
)

export const LoadiumRESTRegexVariables = z.array(
  z.object({
    varName: z.string().catch(""),
    expression: z.string().catch(""),
    active: z.boolean().catch(true),
  })
)

export const LoadiumRESTCssSelectorVariables = z.array(
  z.object({
    varName: z.string().catch(""),
    expression: z.string().catch(""),
    attribute: z.string().catch(""),
    matchNumber: z.string().catch(""),
    active: z.boolean().catch(true),
  })
)

export type LoadiumRESTJsonPathVariables = z.infer<typeof LoadiumRESTJsonPathVariables>
export type LoadiumRESTRegexVariables = z.infer<typeof LoadiumRESTRegexVariables>
export type LoadiumRESTCssSelectorVariables = z.infer<typeof LoadiumRESTCssSelectorVariables>

export const V12_SCHEMA = V11_SCHEMA.extend({
  v: z.literal("12"),
  jsonPathVariables: LoadiumRESTJsonPathVariables,
  regexVariables: LoadiumRESTRegexVariables,
  cssSelectorVariables: LoadiumRESTCssSelectorVariables,
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
    } as z.infer<typeof V12_SCHEMA>
  },
})

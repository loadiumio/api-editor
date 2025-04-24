import { ref } from "vue"
import {
  createClient,
  TypedDocumentNode,
  OperationContext,
  fetchExchange,
  makeOperation,
  errorExchange,
  CombinedError,
  Operation,
  OperationResult,
  Client,
  AnyVariables,
} from "@urql/core"
import { AuthConfig, authExchange } from "@urql/exchange-auth"
import { SubscriptionClient } from "subscriptions-transport-ws"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { flow } from "fp-ts/function"
import { Subject } from "rxjs"
import { platform } from "~/platform"

const BACKEND_GQL_URL = import.meta.env.VITE_BACKEND_GQL_URL ?? ""
const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL ?? ""

export type GQLClientErrorEvent =
  | { type: "SUBSCRIPTION_CONN_CALLBACK_ERR_REPORT"; errors: Error[] }
  | { type: "CLIENT_REPORTED_ERROR"; error: CombinedError; op: Operation }
  | {
  type: "GQL_CLIENT_REPORTED_ERROR"
  opType: "query" | "mutation" | "subscription"
  opResult: OperationResult
}

export const gqlClientError$ = new Subject<GQLClientErrorEvent>()

const createSubscriptionClient = () =>
  new SubscriptionClient(BACKEND_WS_URL, {
    reconnect: true,
    connectionParams: () => platform.auth.getBackendHeaders(),
    connectionCallback(error) {
      if (error?.length > 0) {
        gqlClientError$.next({
          type: "SUBSCRIPTION_CONN_CALLBACK_ERR_REPORT",
          errors: error,
        })
      }
    },
  })

const createHoppClient = () => {
  const exchanges = [
    authExchange(async (): Promise<AuthConfig> => {
      const probableUser = platform.auth.getProbableUser()
      if (probableUser !== null) await platform.auth.waitProbableLoginToConfirm()
      return {
        addAuthToOperation(operation) {
          const fetchOptions =
            typeof operation.context.fetchOptions === "function"
              ? operation.context.fetchOptions()
              : operation.context.fetchOptions || {}
          const authHeaders = platform.auth.getBackendHeaders()
          return makeOperation(operation.kind, operation, {
            ...operation.context,
            fetchOptions: {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                ...authHeaders,
              },
            },
          })
        },
        willAuthError() {
          return platform.auth.willBackendHaveAuthError()
        },
        didAuthError() {
          return false
        },
        async refreshAuth() {
          // TODO
        },
      }
    }),
    fetchExchange,
    errorExchange({
      onError(error, op) {
        gqlClientError$.next({
          type: "CLIENT_REPORTED_ERROR",
          error,
          op,
        })
      },
    }),
  ]

  return createClient({
    url: BACKEND_GQL_URL,
    exchanges,
    ...(platform.auth.getGQLClientOptions
      ? platform.auth.getGQLClientOptions()
      : {}),
  })
}

let subscriptionClient: SubscriptionClient | null
export const client = ref<Client>()

export function initBackendGQLClient() {
  client.value = createHoppClient()

  platform.auth.onBackendGQLClientShouldReconnect(() => {
    const currentUser = platform.auth.getCurrentUser()

    if (currentUser && subscriptionClient) {
      subscriptionClient.client.close()
    }
    if (currentUser && !subscriptionClient) {
      subscriptionClient = createSubscriptionClient()
    }
    if (!currentUser && subscriptionClient) {
      subscriptionClient.close()
      subscriptionClient = null
    }

    client.value = createHoppClient()
  })
}

type RunQueryOptions<T = any, V = AnyVariables> = {
  query: TypedDocumentNode<T, V>
  variables: V
}

export type GQLError<T extends string> =
  | { type: "network_error"; error: Error }
  | { type: "gql_error"; error: T }

export const runGQLQuery = async <
  DocType,
  DocVarType extends AnyVariables,
  DocErrorType extends string,
>(
  args: RunQueryOptions<DocType, DocVarType>
): Promise<E.Either<GQLError<DocErrorType>, DocType>> => {
  return E.left({
    type: "network_error",
    error: new Error(""),
  })
}

export const runGQLSubscription = <
  DocType,
  DocVarType extends AnyVariables,
  DocErrorType extends string,
>(
  args: RunQueryOptions<DocType, DocVarType>
) => {
  const result$ = new Subject<E.Either<GQLError<DocErrorType>, DocType>>()
  const sub = { unsubscribe: () => {} }
  return [result$, sub] as const
}

export const runAuthOnlyGQLSubscription = flow(
  runGQLSubscription,
  ([result$, sub]) => [result$, sub] as const
)

export const parseGQLErrorString = (s: string) =>
  s.startsWith("[GraphQL] ") ? s.split("[GraphQL] ")[1] : s

export const runMutation = <
  DocType,
  DocVariables extends object | undefined,
  DocErrors extends string,
>(
  mutation: TypedDocumentNode<DocType, DocVariables>,
  variables: DocVariables,
  additionalConfig?: Partial<OperationContext>
): TE.TaskEither<GQLError<DocErrors>, DocType> =>
  TE.left({
    type: "network_error",
    error: new Error(""),
  })

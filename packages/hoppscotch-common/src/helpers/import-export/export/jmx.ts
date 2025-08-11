import {HoppCollection, HoppRESTRequest} from "@hoppscotch/data"

/**
 * Converts Hoppscotch collections to JMX format with complete structure
 * @param collections - Array of Hoppscotch collections
 * @returns JMX XML string
 */
export const jmxCollectionsExporter = (collections: HoppCollection[]): string => {
    const testPlanName = collections.length === 1 ? collections[0].name : "Loadium Test Plan"

    const allRequests = extractAllRequests(collections)
    const globalVariables = extractGlobalVariables(collections, allRequests)
    const collectionAuthorization = extractCollectionAuthorization(collections)

    return generateJMXXML(testPlanName, globalVariables, allRequests, collectionAuthorization)
}

/**
 * Extract all requests from collections recursively
 */
const extractAllRequests = (collections: HoppCollection[]): HoppRESTRequest[] => {
    const requests: HoppRESTRequest[] = []

    const processCollection = (collection: HoppCollection) => {
        if (collection.requests) {
            collection.requests.forEach(request => {
                if (request && typeof request === 'object' && 'method' in request) {
                    requests.push(request as HoppRESTRequest)
                }
            })
        }

        if (collection.folders) {
            collection.folders.forEach(folder => processCollection(folder))
        }
    }

    collections.forEach(collection => processCollection(collection))
    return requests
}

/**
 * Extract global variables from collections and requests
 */
const extractGlobalVariables = (collections: HoppCollection[], requests: HoppRESTRequest[]): {
    name: string;
    value: string;
    description?: string
}[] => {
    const variables = new Map<string, { value: string; description?: string }>()

    // Extract from collection headers
    collections.forEach(collection => {
        if (collection.headers) {
            collection.headers.forEach(header => {
                extractVariablesFromString(header.key, variables)
                extractVariablesFromString(header.value, variables)
            })
        }
    })

    requests.forEach(request => {
        // From endpoint
        extractVariablesFromString(request.endpoint, variables)

        if (request.headers) {
            request.headers.forEach(header => {
                extractVariablesFromString(header.key, variables)
                extractVariablesFromString(header.value, variables)
            })
        }

        if (request.params) {
            request.params.forEach(param => {
                extractVariablesFromString(param.key, variables)
                extractVariablesFromString(param.value, variables)
            })
        }

        if (request.body && typeof request.body === 'object') {
            if ('body' in request.body && typeof request.body.body === 'string') {
                extractVariablesFromString(request.body.body, variables)
            }
        }
    })

    const result = Array.from(variables.entries()).map(([name, data]) => ({
        name,
        value: data.value,
        description: data.description
    }))

    if (!variables.has('baseUrl')) {
        result.unshift({
            name: 'baseUrl',
            value: 'https://api.example.com',
            description: 'Base URL for API endpoints'
        })
    }

    if (!variables.has('timeout')) {
        result.push({
            name: 'timeout',
            value: '30000',
            description: 'Request timeout in milliseconds'
        })
    }

    return result
}

/**
 * Extract collection authorization for global HTTP Authorization Manager
 */
const extractCollectionAuthorization = (collections: HoppCollection[]): {
    type: string;
    headers: Array<{ key: string; value: string }>
} | null => {
    for (const collection of collections) {
        if (collection.auth && collection.auth.authType !== 'none' && collection.auth.authActive) {
            const auth = collection.auth
            const headers: Array<{ key: string; value: string }> = []

            switch (auth.authType) {
                case 'bearer':
                    if (auth.token && auth.token.trim() !== '') {
                        headers.push({key: 'Authorization', value: `Bearer ${auth.token}`})
                    }
                    break
                case 'basic':
                    if (auth.username && auth.password) {
                        const credentials = btoa(`${auth.username}:${auth.password}`)
                        headers.push({key: 'Authorization', value: `Basic ${credentials}`})
                    }
                    break
                case 'api-key':
                    if (auth.key && auth.value && auth.addTo === 'HEADERS') {
                        headers.push({key: auth.key, value: auth.value})
                    }
                    break
            }

            if (headers.length > 0) {
                return {type: auth.authType, headers}
            }
        }
    }

    return null
}

/**
 * Extract variables from string using ${variableName} pattern
 */
const extractVariablesFromString = (text: string, variables: Map<string, { value: string; description?: string }>) => {
    if (!text) return

    const matches = text.match(/\$\{([^}]+)\}/g)
    if (matches) {
        matches.forEach(match => {
            const varName = match.replace(/\$\{|\}/g, '')
            if (!variables.has(varName)) {
                variables.set(varName, {
                    value: '',
                    description: `Variable extracted from: ${text.substring(0, 50)}...`
                })
            }
        })
    }
}

/**
 * Generate complete JMX XML structure
 */
const generateJMXXML = (testPlanName: string, globalVariables: {
    name: string;
    value: string;
    description?: string
}[], requests: HoppRESTRequest[], collectionAuth: {
    type: string;
    headers: Array<{ key: string; value: string }>
} | null): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.1">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${escapeXml(testPlanName)}" enabled="true">
      <stringProp name="TestPlan.comments">Generated from Hoppscotch collections</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        ${generateGlobalVariables(globalVariables)}
      </elementProp>
    </TestPlan>
    <hashTree>
      ${generateDefaultConfigElements(collectionAuth)}
      ${generateThreadGroup(requests)}
    </hashTree>
  </hashTree>
</jmeterTestPlan>`
}

/**
 * Generate default config elements - Cookie Manager, Cache Manager and Authorization Manager
 */
const generateDefaultConfigElements = (collectionAuth: {
    type: string;
    headers: Array<{ key: string; value: string }>
} | null): string => {
    let authManager = ''

    if (collectionAuth && collectionAuth.headers.length > 0) {
        authManager = `
      <AuthManager guiclass="AuthPanel" testclass="AuthManager" testname="HTTP Authorization Manager" enabled="true">
        <collectionProp name="AuthManager.auth_list">
          <elementProp name="" elementType="Authorization">
            <stringProp name="Authorization.url"></stringProp>
            <stringProp name="Authorization.username"></stringProp>
            <stringProp name="Authorization.password"></stringProp>
            <stringProp name="Authorization.domain"></stringProp>
            <stringProp name="Authorization.realm"></stringProp>
          </elementProp>
        </collectionProp>
        <boolProp name="AuthManager.controlledByThreadGroup">false</boolProp>
      </AuthManager>
      <hashTree/>

      <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Collection Authorization Headers" enabled="true">
        <collectionProp name="HeaderManager.headers">
          ${collectionAuth.headers.map(header => `
          <elementProp name="" elementType="Header">
            <stringProp name="Header.name">${escapeXml(header.key)}</stringProp>
            <stringProp name="Header.value">${escapeXml(header.value)}</stringProp>
          </elementProp>`).join('')}
        </collectionProp>
      </HeaderManager>
      <hashTree/>`
    }

    return `
      <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager" enabled="true">
        <collectionProp name="CookieManager.cookies"/>
        <boolProp name="CookieManager.clearEachIteration">false</boolProp>
        <boolProp name="CookieManager.controlledByThreadGroup">true</boolProp>
      </CookieManager>
      <hashTree/>

      <CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager" enabled="true">
        <boolProp name="clearEachIteration">false</boolProp>
        <boolProp name="useExpires">true</boolProp>
        <boolProp name="CacheManager.controlledByThread">false</boolProp>
      </CacheManager>
      <hashTree/>${authManager}`
}

/**
 * Generate global variables from extracted variables
 */
const generateGlobalVariables = (variables: { name: string; value: string; description?: string }[]): string => {
    return variables.map(variable => `
        <elementProp name="${escapeXml(variable.name)}" elementType="Argument">
          <stringProp name="Argument.name">${escapeXml(variable.name)}</stringProp>
          <stringProp name="Argument.value">${escapeXml(variable.value)}</stringProp>
          <stringProp name="Argument.metadata">=</stringProp>
          <stringProp name="Argument.desc">${escapeXml(variable.description || '')}</stringProp>
        </elementProp>`).join('')
}

/**
 * Generate Thread Group with HTTP Samplers
 */
const generateThreadGroup = (requests: HoppRESTRequest[]): string => {
    return `
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Loadium Thread Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlGui" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
      </ThreadGroup>
      <hashTree>
        ${generateHTTPSamplers(requests)}
      </hashTree>`
}

/**
 * Generate HTTP Samplers from requests
 */
const generateHTTPSamplers = (requests: HoppRESTRequest[]): string => {
    return requests.map(request => generateHTTPSampler(request)).join('')
}

/**
 * Generate a single HTTP Sampler with complete features
 */
const generateHTTPSampler = (request: HoppRESTRequest): string => {
    const requestName = request.name || 'HTTP Request'
    const method = request.method || 'GET'
    const endpoint = request.endpoint || 'https://example.com'

    try {
        const url = new URL(endpoint.startsWith('http') ? endpoint : `https://${endpoint}`)
        const domain = url.hostname
        const port = url.port || (url.protocol === 'https:' ? 443 : 80)
        const path = url.pathname + url.search
        const headers = generateHTTPHeaders(request.headers || [])
        const parameters = generateHTTPParameters(request.params || [])
        const body = generateHTTPBody(request.body)

        return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${escapeXml(requestName)}" enabled="true">
          <stringProp name="HTTPSampler.domain">${escapeXml(domain)}</stringProp>
          <stringProp name="HTTPSampler.port">${port}</stringProp>
          <stringProp name="HTTPSampler.protocol">${url.protocol.replace(':', '')}</stringProp>
          <stringProp name="HTTPSampler.path">${escapeXml(path)}</stringProp>
          <stringProp name="HTTPSampler.method">${escapeXml(method)}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          ${parameters}
          ${body}
        </HTTPSamplerProxy>
        <hashTree>
          ${headers}
        </hashTree>`
    } catch (error) {
        // Fallback for invalid URLs
        return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${escapeXml(requestName)}" enabled="true">
          <stringProp name="HTTPSampler.domain">example.com</stringProp>
          <stringProp name="HTTPSampler.port">443</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.path">/</stringProp>
          <stringProp name="HTTPSampler.method">${escapeXml(method)}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree/>
        `
    }
}

/**
 * Generate HTTP Headers for request
 */
const generateHTTPHeaders = (headers: Array<{ key: string; value: string; active: boolean }>): string => {
    const activeHeaders = headers.filter(h => h.active && h.key && h.value)
    if (activeHeaders.length === 0) return ''

    return `
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
            <collectionProp name="HeaderManager.headers">
              ${activeHeaders.map(header => `
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">${escapeXml(header.key)}</stringProp>
                <stringProp name="Header.value">${escapeXml(header.value)}</stringProp>
              </elementProp>`).join('')}
            </collectionProp>
          </HeaderManager>
          <hashTree/>`
}

/**
 * Generate HTTP Parameters for request
 */
const generateHTTPParameters = (params: Array<{ key: string; value: string; active: boolean }>): string => {
    const activeParams = params.filter(p => p.active && p.key)
    if (activeParams.length === 0) return ''

    return `
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments">
              ${activeParams.map(param => `
              <elementProp name="${escapeXml(param.key)}" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">${escapeXml(param.value)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
                <boolProp name="HTTPArgument.use_equals">true</boolProp>
                <stringProp name="Argument.name">${escapeXml(param.key)}</stringProp>
              </elementProp>`).join('')}
            </collectionProp>
          </elementProp>`
}

/**
 * Generate HTTP Body for request
 */
const generateHTTPBody = (body: any): string => {
    if (!body || typeof body !== 'object') return ''

    let bodyContent = ''
    if ('body' in body && typeof body.body === 'string') {
        bodyContent = body.body
    } else {
        return ''
    }

    if (!bodyContent) return ''

    return `
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">${escapeXml(bodyContent)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>`
}

/**
 * Escape XML special characters
 */
const escapeXml = (text: string): string => {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

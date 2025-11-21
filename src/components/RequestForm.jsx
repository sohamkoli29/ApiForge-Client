import React, { useState } from 'react'
import { Send, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

const RequestForm = ({ onResponse, onSaveRequest,currentRequest  }) => {
  const [activeTab, setActiveTab] = useState('params')
  const [method, setMethod] = useState(currentRequest?.method || 'GET')
  const [url, setUrl] = useState(currentRequest?.url || '')
  const [headers, setHeaders] = useState(currentRequest?.headers || [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }])
  const [params, setParams] = useState(currentRequest?.params || [{ id: 1, key: '', value: '', enabled: true }])
  const [body, setBody] = useState(currentRequest?.body || '{\n  \n}')
  const [jsonError, setJsonError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Tab configurations
  const tabs = [
    { id: 'params', name: 'Params', enabled: true },
    { id: 'headers', name: 'Headers', enabled: true },
    { id: 'body', name: 'Body', enabled: method !== 'GET' },
    { id: 'auth', name: 'Auth', enabled: true }
  ]

  // Update form when currentRequest changes
React.useEffect(() => {
  if (currentRequest) {
    setUrl(currentRequest.url || '')
    setMethod(currentRequest.method || 'GET')
    setHeaders(currentRequest.headers || [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }])
    setParams(currentRequest.params || [{ id: 1, key: '', value: '', enabled: true }])
    setBody(currentRequest.body || '{\n  \n}')
  }
}, [currentRequest])

  // Header management
  const addHeader = () => {
    setHeaders([...headers, { id: Date.now(), key: '', value: '', enabled: true }])
  }

  const removeHeader = (id) => {
    if (headers.length > 1) {
      setHeaders(headers.filter(header => header.id !== id))
    }
  }

  const updateHeader = (id, field, value) => {
    setHeaders(headers.map(header => 
      header.id === id ? { ...header, [field]: value } : header
    ))
  }

  const toggleHeader = (id) => {
    setHeaders(headers.map(header => 
      header.id === id ? { ...header, enabled: !header.enabled } : header
    ))
  }

  // Params management
  const addParam = () => {
    setParams([...params, { id: Date.now(), key: '', value: '', enabled: true }])
  }

  const removeParam = (id) => {
    if (params.length > 1) {
      setParams(params.filter(param => param.id !== id))
    }
  }

  const updateParam = (id, field, value) => {
    setParams(params.map(param => 
      param.id === id ? { ...param, [field]: value } : param
    ))
  }

  const toggleParam = (id) => {
    setParams(params.map(param => 
      param.id === id ? { ...param, enabled: !param.enabled } : param
    ))
  }

  // Body validation
  const validateJSON = (jsonString) => {
    try {
      if (jsonString.trim()) {
        JSON.parse(jsonString)
      }
      setJsonError('')
      return true
    } catch (error) {
      setJsonError('Invalid JSON format: ' + error.message)
      return false
    }
  }

  const handleBodyChange = (value) => {
    setBody(value)
    if (method !== 'GET') {
      validateJSON(value)
    }
  }

  // Build URL with parameters
  const buildUrlWithParams = () => {
    if (!url) return url
    
    try {
      const urlObj = new URL(url)
      const enabledParams = params.filter(param => param.enabled && param.key.trim())
      
      // Clear existing search params and add new ones
      urlObj.search = ''
      enabledParams.forEach(param => {
        urlObj.searchParams.append(param.key, param.value)
      })
      
      return urlObj.toString()
    } catch (error) {
      // If URL is not valid yet, just return the original
      return url
    }
  }

  // Prepare request data for proxy
  const prepareRequestData = () => {
    const enabledHeaders = headers
      .filter(header => header.enabled && header.key.trim())
      .reduce((acc, header) => {
        acc[header.key] = header.value
        return acc
      }, {})

    let requestBody = null
    if (method !== 'GET' && body.trim()) {
      try {
        requestBody = JSON.parse(body)
      } catch (error) {
        throw new Error('Invalid JSON in request body')
      }
    }

    const finalUrl = buildUrlWithParams()

    return {
      url: finalUrl,
      method: method.toUpperCase(),
      headers: enabledHeaders,
      body: requestBody,
      timeout: 30000 // 30 seconds timeout
    }
  }

  // Send request to proxy
const handleSend = async () => {
  if (!url.trim()) {
    toast.error('Please enter a URL')
    return
  }

  // Validate URL format
  try {
    new URL(url)
  } catch (error) {
    toast.error('Please enter a valid URL (include http:// or https://)')
    return
  }

  if (method !== 'GET' && body.trim()) {
    if (!validateJSON(body)) {
      toast.error('Please fix JSON errors in request body')
      return
    }
  }

  setIsLoading(true)
  
  try {
    const requestData = prepareRequestData()
    
    console.log('Sending request to proxy:', requestData)

    const startTime = Date.now()
    
    // Use relative URL to go through Vite proxy
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    const result = await response.json()
    const endTime = Date.now()
    
    console.log('Proxy response:', result)

    // Add duration to result if not present
    const finalResult = {
      ...result,
      duration: result.duration || (endTime - startTime)
    }
    
    if (response.ok) {
      onResponse(finalResult)
      
      // Save to history
      if (onSaveRequest) {
        onSaveRequest({
          url: url, // Original URL without params
          method: method,
          headers: JSON.stringify(headers.filter(h => h.enabled && h.key)),
          body: method !== 'GET' ? body : null,
          params: JSON.stringify(params.filter(p => p.enabled && p.key)),
          responseStatus: finalResult.status,
          duration: finalResult.duration,
          timestamp: new Date().toLocaleTimeString(),
          date: new Date().toLocaleDateString()
        })
      }

      if (finalResult.status >= 200 && finalResult.status < 300) {
        toast.success(`✅ ${finalResult.status} - Request completed in ${finalResult.duration}ms`)
      } else {
        toast.error(`❌ ${finalResult.status} - Request completed in ${finalResult.duration}ms`)
      }
    } else {
      // Proxy itself returned an error
      onResponse({
        status: response.status,
        statusText: response.statusText,
        headers: {},
        data: { error: result.error || 'Proxy request failed' },
        duration: endTime - startTime
      })
      toast.error(`Proxy error: ${result.error || 'Request failed'}`)
    }
  } catch (error) {
    console.error('Request error:', error)
    const errorMessage = error.message || 'Network error'
    
    onResponse({
      status: 0,
      statusText: 'Connection Error',
      headers: {},
      data: { 
        error: errorMessage,
        details: 'Check the browser console for more details',
        solution: 'Make sure both frontend and backend servers are running'
      },
      duration: 0
    })
    toast.error('Failed to send request')
  } finally {
    setIsLoading(false)
  }
}

  // Format JSON
  const formatJSON = () => {
    try {
      const parsed = JSON.parse(body)
      setBody(JSON.stringify(parsed, null, 2))
      setJsonError('')
      toast.success('JSON formatted successfully')
    } catch (error) {
      setJsonError('Cannot format invalid JSON')
      toast.error('Cannot format invalid JSON')
    }
  }

  // Update body tab enabled state when method changes
  React.useEffect(() => {
    if (method === 'GET' && activeTab === 'body') {
      setActiveTab('params')
    }
  }, [method, activeTab])

  return (
    <div className="h-full flex flex-col">
      {/* Method and URL Bar */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex space-x-3 items-start">
          {/* Method Selector */}
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-24"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          {/* URL Input */}
          <div className="flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter API URL (e.g., https://jsonplaceholder.typicode.com/posts)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            {params.some(param => param.enabled && param.key) && (
              <div className="mt-1">
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer hover:text-gray-800">
                    Generated URL: {buildUrlWithParams()}
                  </summary>
                  <pre className="mt-1 p-2 bg-gray-50 rounded border text-xs overflow-x-auto">
                    {buildUrlWithParams()}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-20 justify-center transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Tabs for Params, Headers, Body, Auth */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : tab.enabled
                    ? 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                    : 'text-gray-300 cursor-not-allowed border-transparent'
                }`}
              >
                {tab.name}
                {tab.id === 'body' && method === 'GET' && (
                  <span className="text-xs text-gray-400 ml-1">(disabled for GET)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {/* Params Tab */}
          {activeTab === 'params' && (
            <div className="p-4 bg-white m-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-800">Query Parameters</h4>
                  <p className="text-sm text-gray-600">Parameters will be appended to the URL</p>
                </div>
                <button
                  onClick={addParam}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Param</span>
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-2">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">Key</div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1"></div>
                </div>
                
                {params.map((param) => (
                  <div key={param.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={() => toggleParam(param.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Parameter key"
                        value={param.key}
                        onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Parameter value"
                        value={param.value}
                        onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeParam(param.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove parameter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="p-4 bg-white m-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-800">Request Headers</h4>
                  <p className="text-sm text-gray-600">Custom HTTP headers for your request</p>
                </div>
                <button
                  onClick={addHeader}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Header</span>
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-2">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">Key</div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1"></div>
                </div>
                
                {headers.map((header) => (
                  <div key={header.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={() => toggleHeader(header.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Header name"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Header value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeHeader(header.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove header"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="p-4 bg-white m-4 rounded-lg border border-gray-200 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Request Body</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={formatJSON}
                    className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    Format JSON
                  </button>
                  <select className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>JSON</option>
                    <option disabled>Text</option>
                    <option disabled>XML</option>
                    <option disabled>Form Data</option>
                  </select>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <textarea
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                  placeholder='Enter JSON request body, e.g., {"name": "John", "email": "john@example.com"}'
                />
                {jsonError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {jsonError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auth Tab */}
          {activeTab === 'auth' && (
            <div className="p-4 bg-white m-4 rounded-lg border border-gray-200">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800">Authentication</h4>
                <p className="text-sm text-gray-600">Configure authentication for your API requests</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authentication Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>No Auth</option>
                    <option>Bearer Token</option>
                    <option>Basic Auth</option>
                    <option>API Key</option>
                    <option disabled>OAuth 2.0</option>
                  </select>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Authentication features will be implemented in later stages. 
                    For now, you can add authentication headers manually in the Headers tab.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestForm
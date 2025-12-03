import React, { useState } from 'react'
import { Send, Plus, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AuthTab from './AuthTab'
import config from '../config'


const RequestForm = ({ onResponse, onSaveRequest, currentRequest }) => {
  const [activeTab, setActiveTab] = useState('params')
  const [method, setMethod] = useState(currentRequest?.method || 'GET')
  const [url, setUrl] = useState(currentRequest?.url || '')
  
  // Ensure headers is always an array
  const [headers, setHeaders] = useState(() => {
    if (currentRequest?.headers) {
      if (Array.isArray(currentRequest.headers)) {
        return currentRequest.headers;
      }
      try {
        return JSON.parse(currentRequest.headers);
      } catch {
        return [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }];
      }
    }
    return [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }];
  })
  
  // Ensure params is always an array
  const [params, setParams] = useState(() => {
    if (currentRequest?.params) {
      if (Array.isArray(currentRequest.params)) {
        return currentRequest.params;
      }
      try {
        return JSON.parse(currentRequest.params);
      } catch {
        return [{ id: 1, key: '', value: '', enabled: true }];
      }
    }
    return [{ id: 1, key: '', value: '', enabled: true }];
  })
  
  const [body, setBody] = useState(currentRequest?.body || '{\n  \n}')
  const [jsonError, setJsonError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authConfig, setAuthConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apiTesterAuthConfig') || 'null')
    } catch {
      return null
    }
  })

  // Tab configurations
  const tabs = [
    { id: 'params', name: 'Query Parameters', enabled: true },
    { id: 'headers', name: 'Headers', enabled: true },
    { id: 'body', name: 'Body', enabled: method !== 'GET' },
    { id: 'auth', name: 'Authentication', enabled: true }
  ]

  // Update form when currentRequest changes
  React.useEffect(() => {
    if (currentRequest) {
      setUrl(currentRequest.url || '')
      setMethod(currentRequest.method || 'GET')
      
      // Safely set headers
      if (currentRequest.headers) {
        if (Array.isArray(currentRequest.headers)) {
          setHeaders(currentRequest.headers);
        } else {
          try {
            setHeaders(JSON.parse(currentRequest.headers));
          } catch {
            setHeaders([{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }]);
          }
        }
      } else {
        setHeaders([{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }]);
      }
      
      // Safely set params
      if (currentRequest.params) {
        if (Array.isArray(currentRequest.params)) {
          setParams(currentRequest.params);
        } else {
          try {
            setParams(JSON.parse(currentRequest.params));
          } catch {
            setParams([{ id: 1, key: '', value: '', enabled: true }]);
          }
        }
      } else {
        setParams([{ id: 1, key: '', value: '', enabled: true }]);
      }
      
      setBody(currentRequest.body || '{\n  \n}')
    }
  }, [currentRequest])

  // Update body tab enabled state when method changes
  React.useEffect(() => {
    if (method === 'GET' && activeTab === 'body') {
      setActiveTab('params')
    }
  }, [method, activeTab])

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

  // Build URL with parameters - with safe array checking
  const buildUrlWithParams = () => {
    if (!url) return url
    
    try {
      const urlObj = new URL(url)
      
      // Ensure params is an array before using .some() or .filter()
      const enabledParams = Array.isArray(params) 
        ? params.filter(param => param.enabled && param.key && param.key.trim())
        : []
      
      // Clear existing search params and add new ones
      urlObj.search = ''
      enabledParams.forEach(param => {
        if (param.key && param.value) {
          urlObj.searchParams.append(param.key, param.value)
        }
      })
      
      return urlObj.toString()
    } catch (error) {
      // If URL is not valid yet, just return the original
      return url
    }
  }

  // Prepare request data for proxy
  const prepareRequestData = () => {
    // Safely filter headers
    const enabledHeaders = Array.isArray(headers) 
      ? headers
          .filter(header => header.enabled && header.key && header.key.trim())
          .reduce((acc, header) => {
            acc[header.key] = header.value
            return acc
          }, {})
      : {}

    // Add authentication headers
    if (authConfig && authConfig.type !== 'none') {
      switch (authConfig.type) {
        case 'basic':
          if (authConfig.username && authConfig.password) {
            const credentials = btoa(`${authConfig.username}:${authConfig.password}`)
            enabledHeaders['Authorization'] = `Basic ${credentials}`
          }
          break
        case 'bearer':
          if (authConfig.token) {
            enabledHeaders['Authorization'] = `Bearer ${authConfig.token.trim()}`
          }
          break
        // For custom, user should add headers manually in Headers tab
      }
    }

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
      timeout: 30000,
      auth: authConfig // Pass auth config to backend if needed
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
     const response = await fetch(`${config.apiUrl}/api/proxy`, {
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
            headers: JSON.stringify(Array.isArray(headers) ? headers.filter(h => h.enabled && h.key) : []),
            body: method !== 'GET' ? body : null,
            params: JSON.stringify(Array.isArray(params) ? params.filter(p => p.enabled && p.key) : []),
            responseStatus: finalResult.status,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            duration: finalResult.duration
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
      onResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { 
          error: error.message || 'Network error',
          details: 'Check if the backend server is running on port 3001'
        },
        duration: 0
      })
      toast.error('Failed to send request. Check backend connection.')
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Method and URL Bar */}
      <div className="p-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-start">
          {/* Method Selector */}
          <div className="flex-shrink-0">
            <select 
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full lg:w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-gray-700 shadow-sm transition-colors"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          {/* URL Input */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter API URL (e.g., https://jsonplaceholder.typicode.com/posts)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm placeholder-gray-400 shadow-sm transition-colors"
              />
            </div>
            
            {/* Safe check for params before using .some() */}
            {Array.isArray(params) && params.some(param => param.enabled && param.key) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-blue-700 hover:text-blue-800 flex items-center">
                    <span>Generated URL with Parameters</span>
                  </summary>
                  <div className="mt-2 p-3 bg-white rounded border border-blue-100">
                    <code className="text-xs text-gray-700 break-all font-mono">
                      {buildUrlWithParams()}
                    </code>
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="w-full lg:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="font-medium">{isLoading ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs for Params, Headers, Body, Auth */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : tab.enabled
                    ? 'text-gray-600 hover:text-gray-800 border-transparent hover:border-gray-300 hover:bg-gray-50'
                    : 'text-gray-400 cursor-not-allowed border-transparent'
                }`}
              >
                {tab.name}
                {tab.id === 'body' && method === 'GET' && (
                  <span className="text-xs text-gray-400 ml-2">(disabled for GET)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Params Tab */}
          {activeTab === 'params' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Query Parameters</h3>
                      <p className="text-sm text-gray-600 mt-1">Parameters will be automatically appended to the URL as query strings</p>
                    </div>
                    <button
                      onClick={addParam}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Parameter</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                      <div className="col-span-1 text-center">Status</div>
                      <div className="col-span-5">Parameter Name</div>
                      <div className="col-span-5">Value</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* Parameters List */}
                    {Array.isArray(params) && params.map((param) => (
                      <div key={param.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="col-span-1 flex justify-center">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={param.enabled}
                              onChange={() => toggleParam(param.id)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="e.g., page, limit, sort"
                            value={param.key}
                            onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono transition-colors"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="e.g., 1, 20, name"
                            value={param.value}
                            onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono transition-colors"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => removeParam(param.id)}
                            className="p-3 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove parameter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Request Headers</h3>
                      <p className="text-sm text-gray-600 mt-1">Custom HTTP headers for your API request</p>
                    </div>
                    <button
                      onClick={addHeader}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Header</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                      <div className="col-span-1 text-center">Status</div>
                      <div className="col-span-5">Header Name</div>
                      <div className="col-span-5">Value</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* Headers List */}
                    {Array.isArray(headers) && headers.map((header) => (
                      <div key={header.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="col-span-1 flex justify-center">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={header.enabled}
                              onChange={() => toggleHeader(header.id)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="e.g., Content-Type, Authorization"
                            value={header.key}
                            onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono transition-colors"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="e.g., application/json, Bearer token..."
                            value={header.value}
                            onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono transition-colors"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => removeHeader(header.id)}
                            className="p-3 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove header"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Request Body</h3>
                      <p className="text-sm text-gray-600 mt-1">JSON payload for POST, PUT, PATCH requests</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={formatJSON}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                      >
                        Format JSON
                      </button>
                      <select className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700">
                        <option>JSON</option>
                        <option disabled>Text</option>
                        <option disabled>XML</option>
                        <option disabled>Form Data</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="relative">
                    <textarea
                      value={body}
                      onChange={(e) => handleBodyChange(e.target.value)}
                      className="w-full h-96 px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none shadow-sm transition-colors"
                      placeholder='Enter JSON request body, e.g., {"name": "John", "email": "john@example.com"}'
                    />
                    
                    {/* JSON Syntax Helper */}
                    {body.trim() && (
                      <div className="absolute bottom-4 right-4 flex space-x-2">
                        <button
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(body);
                              setBody(JSON.stringify(parsed, null, 2));
                              setJsonError('');
                            } catch (e) {
                              setJsonError('Invalid JSON format');
                            }
                          }}
                          className="px-3 py-2 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-200"
                        >
                          Beautify
                        </button>
                        <button
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(body);
                              setBody(JSON.stringify(parsed));
                              setJsonError('');
                            } catch (e) {
                              setJsonError('Invalid JSON format');
                            }
                          }}
                          className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                        >
                          Minify
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Error and Validation States */}
                  <div className="mt-4">
                    {jsonError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <div className="font-medium">JSON Error</div>
                        <div className="mt-1">{jsonError}</div>
                      </div>
                    )}
                    
                    {body.trim() && !jsonError && (
                      <div className="flex items-center space-x-2 text-green-600 text-sm font-medium p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span>Valid JSON format</span>
                      </div>
                    )}
                    
                    {!body.trim() && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-sm">Start typing your JSON request body...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auth Tab */}
          {activeTab === 'auth' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure authentication for your API requests</p>
                </div>
                <div className="p-6">
                  <AuthTab 
                    onAuthSuccess={setAuthConfig}
                    authConfig={authConfig}
                    setAuthConfig={setAuthConfig}
                  />
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
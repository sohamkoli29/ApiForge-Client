import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, Copy, AlertCircle, Expand, Minus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ReactJson from 'react18-json-view'

const ResponseViewer = ({ response }) => {
  const [activeView, setActiveView] = useState('body')
  const [expanded, setExpanded] = useState(false)

  if (!response) {
    return (
      <div className="h-[50vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 border border-gray-200">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">No Response Yet</h3>
          <p className="text-gray-500 text-lg">Send a request to see the response here</p>
        </div>
      </div>
    )
  }

  const isSuccess = response.status >= 200 && response.status < 300
  const hasHeaders = response.headers && Object.keys(response.headers).length > 0

  const formatJSON = (obj) => {
    if (typeof obj === 'string') {
      try {
        const parsed = JSON.parse(obj)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return obj
      }
    }
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  const isJSON = (data) => {
    if (!data) return false
    if (typeof data === 'object') return true
    if (typeof data === 'string') {
      try {
        JSON.parse(data)
        return true
      } catch {
        return false
      }
    }
    return false
  }

  const getResponseSize = () => {
    if (!response.data) return '0 B'
    
    try {
      const jsonString = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data)
      const size = new Blob([jsonString]).size
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    } catch {
      return 'Unknown'
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 300 && status < 400) return 'text-blue-600'
    if (status >= 400 && status < 500) return 'text-yellow-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  const getStatusIcon = (status) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-6 h-6 text-green-500" />
    if (status >= 400) return <XCircle className="w-6 h-6 text-red-500" />
    return <AlertCircle className="w-6 h-6 text-blue-500" />
  }

  const getStatusBackground = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-50 border-green-200'
    if (status >= 300 && status < 400) return 'bg-blue-50 border-blue-200'
    if (status >= 400 && status < 500) return 'bg-yellow-50 border-yellow-200'
    if (status >= 500) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  const renderJSONView = (data) => {
    try {
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data
      
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <ReactJson
            src={jsonData}
            theme="rjv-default"
            collapsed={!expanded}
            collapseStringsAfterLength={50}
            displayDataTypes={false}
            displayObjectSize={true}
            enableClipboard={true}
            onCopy={(copy) => {
              navigator.clipboard.writeText(JSON.stringify(copy.src, null, 2))
              toast.success('Copied to clipboard!')
            }}
            style={{
              backgroundColor: 'transparent',
              fontSize: '14px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            }}
            iconStyle="circle"
            indentWidth={2}
            quotesOnKeys={false}
            sortKeys={false}
          />
        </div>
      )
    } catch (error) {
      // Fallback to plain text if JSON parsing fails
      return (
        <div className="bg-white rounded-lg p-4 border h-full">
          <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed h-full text-gray-800">
            {formatJSON(data)}
          </pre>
        </div>
      )
    }
  }

  const renderResponseBody = () => {
    if (!response.data) {
      return (
        <div className="text-gray-500 italic p-4 h-full flex items-center justify-center bg-white">
          No response body
        </div>
      )
    }

    if (isJSON(response.data)) {
      return renderJSONView(response.data)
    }

    // Handle string responses with newlines
    if (typeof response.data === 'string') {
      return (
        <div className="bg-white rounded-lg p-4 border h-full">
          <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed h-full text-gray-800">
            {response.data}
          </pre>
        </div>
      )
    }

    // Handle HTML responses
    if (typeof response.data === 'string' && 
        (response.data.includes('<!DOCTYPE') || response.data.includes('<html'))) {
      return (
        <div className="bg-white rounded-lg p-4 border h-full">
          <code className="text-sm whitespace-pre-wrap break-words font-mono h-full text-gray-800">
            {response.data}
          </code>
        </div>
      )
    }

    // Plain text or other content
    return (
      <div className="bg-white rounded-lg p-4 border h-full">
        <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed h-full text-gray-800">
          {String(response.data)}
        </pre>
      </div>
    )
  }

  const renderHeaders = () => {
    if (!hasHeaders) {
      return <div className="text-gray-500 italic p-4 h-full flex items-center justify-center bg-white">No headers received</div>
    }

    return (
      <div className="space-y-2 bg-white">
        {Object.entries(response.headers).map(([key, value]) => (
          <div key={key} className="flex items-start border-b border-gray-200 pb-2 last:border-b-0">
            <div className="w-1/3 font-mono text-sm font-medium text-gray-800 break-all pr-2">{key}:</div>
            <div className="w-2/3 font-mono text-sm text-gray-600 break-all">{value}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-t border-gray-200 shadow-inner">
      {/* Response Status Bar - Fixed */}
      <div className={`border-b p-6 flex-shrink-0 ${getStatusBackground(response.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200">
              {getStatusIcon(response.status)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <span className={`text-2xl font-bold ${getStatusColor(response.status)}`}>
                  {response.status}
                </span>
                <span className="text-lg font-semibold text-gray-700">
                  {response.statusText || getStatusText(response.status)}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <span className="flex items-center space-x-1 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  <Clock className="w-4 h-4" />
                  <span>{response.duration} ms</span>
                </span>
                <span className="flex items-center space-x-1 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  <span>📦</span>
                  <span>{getResponseSize()}</span>
                </span>
                {response.redirected && (
                  <span className="flex items-center space-x-1 bg-white px-3 py-1 rounded-lg border border-gray-200">
                    <span>🔄</span>
                    <span>Redirected</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => copyToClipboard(formatJSON(response.data))}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Body</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Tabs - Fixed */}
      <div className="border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveView('body')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-3 ${
                activeView === 'body'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 border-transparent hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>Response Body</span>
              {isJSON(response.data) && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                  JSON
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('headers')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-3 ${
                activeView === 'headers'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 border-transparent hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>Response Headers</span>
              {hasHeaders && (
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full font-medium">
                  {Object.keys(response.headers).length}
                </span>
              )}
            </button>
          </div>
          
          {/* Expand/Collapse Toggle - Only show for JSON responses */}
          {activeView === 'body' && isJSON(response.data) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors shadow-sm"
            >
              {expanded ? <Minus className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              <span>{expanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Response Content - Scrollable - EXACTLY AS SPECIFIED */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'body' && (
          <div className="h-full flex flex-col">
            {/* Body Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h4 className="font-medium text-gray-800">Response Body</h4>
              <div className="flex space-x-2">
                {isJSON(response.data) && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    JSON
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(formatJSON(response.data))}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
            
            {/* Body Content - Scrollable */}
            <div className="flex-1 min-h-0 max-h-[200px] overflow-auto">
              {renderResponseBody()}
            </div>
          </div>
        )}

        {activeView === 'headers' && (
          <div className="h-full flex flex-col">
            {/* Headers Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h4 className="font-medium text-gray-800">Response Headers</h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(response.headers, null, 2))}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:border-gray-400 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All</span>
              </button>
            </div>
            
            {/* Headers Content - Scrollable */}
            <div className="flex-1 min-h-0 overflow-auto p-4">
              {renderHeaders()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get status text
function getStatusText(status) {
  const statusTexts = {
    100: 'Continue',
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }
  return statusTexts[status] || 'Unknown Status'
}

export default ResponseViewer
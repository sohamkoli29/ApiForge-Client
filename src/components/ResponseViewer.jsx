import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ResponseViewer = ({ response }) => {
  const [activeView, setActiveView] = useState('body')

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Response Yet</h3>
          <p className="text-gray-500">Send a request to see the response here</p>
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
    if (status >= 200 && status < 300) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status >= 400) return <XCircle className="w-5 h-5 text-red-500" />
    return <AlertCircle className="w-5 h-5 text-blue-500" />
  }

  const renderResponseBody = () => {
    if (!response.data) {
      return (
        <div className="text-gray-500 italic p-4">No response body</div>
      )
    }

    if (isJSON(response.data)) {
      return (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
          {formatJSON(response.data)}
        </pre>
      )
    }

    // Handle HTML responses
    if (typeof response.data === 'string' && 
        (response.data.includes('<!DOCTYPE') || response.data.includes('<html'))) {
      return (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm whitespace-pre-wrap">{response.data}</code>
        </div>
      )
    }

    // Plain text or other content
    return (
      <div className="bg-gray-50 rounded-lg p-4 border">
        <code className="text-sm whitespace-pre-wrap font-mono">{String(response.data)}</code>
      </div>
    )
  }

  const renderHeaders = () => {
    if (!hasHeaders) {
      return <div className="text-gray-500 italic p-4">No headers received</div>
    }

    return (
      <div className="space-y-2">
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
    <div className="h-full flex flex-col bg-white">
      {/* Response Status Bar */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(response.status)}
            <div>
              <span className={`text-lg font-semibold ${getStatusColor(response.status)}`}>
                {response.status} {response.statusText || getStatusText(response.status)}
              </span>
              <div className="text-sm text-gray-500 mt-1">
                ⏱️ {response.duration} ms • 📦 {getResponseSize()}
                {response.redirected && ' • 🔄 Redirected'}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(formatJSON(response.data))}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Body</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveView('body')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeView === 'body'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            <span>Body</span>
          </button>
          <button
            onClick={() => setActiveView('headers')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeView === 'headers'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            <span>Headers</span>
            {hasHeaders && (
              <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                {Object.keys(response.headers).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'body' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-800">Response Body</h4>
              <button
                onClick={() => copyToClipboard(formatJSON(response.data))}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:border-gray-400 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {renderResponseBody()}
            </div>
          </div>
        )}

        {activeView === 'headers' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-800">Response Headers</h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(response.headers, null, 2))}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:border-gray-400 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All</span>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
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
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  }
  return statusTexts[status] || 'Unknown Status'
}

export default ResponseViewer
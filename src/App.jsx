import React, { useState } from 'react'
import { ConvexProvider, convex } from './convex'
import Sidebar from './components/Sidebar'
import RequestForm from './components/RequestForm'
import ResponseViewer from './components/ResponseViewer'
import { Toaster } from 'react-hot-toast'

function App() {
  const [activeTab, setActiveTab] = useState('history')
  const [response, setResponse] = useState(null)
  const [currentRequest, setCurrentRequest] = useState({
    url: '',
    method: 'GET',
    headers: [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [{ id: 1, key: '', value: '', enabled: true }],
    body: '{\n  \n}'
  })

  // Generate a simple user ID for demo purposes
  const getUserId = () => {
    let userId = localStorage.getItem('apiTesterUserId')
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('apiTesterUserId', userId)
    }
    return userId
  }

  const handleSaveRequest = async (requestData) => {
    try {
      // Save to localStorage as a fallback
      const historyItem = {
        id: Date.now().toString(),
        userId: getUserId(),
        ...requestData,
        createdAt: Date.now()
      }
      
      const existingHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
      const newHistory = [historyItem, ...existingHistory.slice(0, 49)] // Keep last 50
      localStorage.setItem('apiTesterHistory', JSON.stringify(newHistory))
      
    } catch (error) {
      console.error('Failed to save request history:', error)
    }
  }

  const handleLoadRequest = (request) => {
    setCurrentRequest({
      url: request.url,
      method: request.method,
      headers: request.headers ? JSON.parse(request.headers) : [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }],
      params: request.params ? JSON.parse(request.params) : [{ id: 1, key: '', value: '', enabled: true }],
      body: request.body || '{\n  \n}'
    })
  }

  const getHistoryFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
    } catch {
      return []
    }
  }

  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen bg-gray-50 flex">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onLoadRequest={handleLoadRequest}
            getHistory={getHistoryFromStorage}
            userId={getUserId()}
            currentRequest={currentRequest}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Request Form Section */}
          <div className="flex-1 border-b border-gray-200">
            <RequestForm 
              onResponse={setResponse} 
              onSaveRequest={handleSaveRequest}
              currentRequest={currentRequest}
            />
          </div>

          {/* Response Viewer Section */}
          <div className="flex-1">
            <ResponseViewer response={response} />
          </div>
        </div>
      </div>
    </ConvexProvider>
  )
}

export default App
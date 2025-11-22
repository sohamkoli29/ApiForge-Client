import React, { useState, useEffect } from 'react'
import { Clock, Folder, Settings, User, Plus, Trash2, Loader } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CollectionsManager from './CollectionsManager'
import { supabase } from '../supabase';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  onLoadRequest, 
  getHistory, 
  collections, // Collections passed from App
  onCreateCollection, 
  onUpdateCollection, 
  onDeleteCollection,
  onAddToCollection,
  userId,
  currentRequest,
  user
}) => {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load history from database
  useEffect(() => {
    loadHistory()
  }, [userId]) // Reload when userId changes

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      if (userId === 'anonymous') {
        // Use localStorage for anonymous users
        const localHistory = getHistory()
        setHistory(localHistory)
        return
      }

      // Load from database for authenticated users
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Format database data for the UI
      const formattedHistory = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        url: item.url,
        method: item.method,
        headers: item.headers,
        params: item.params,
        body: item.body,
        responseStatus: item.response_status,
        duration: item.duration,
        createdAt: new Date(item.created_at).getTime()
      }))
      
      setHistory(formattedHistory);
    } catch (error) {
      console.error('Failed to load history from database:', error);
      // Fallback to localStorage
      const localHistory = getHistory()
      setHistory(localHistory)
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        if (userId === 'anonymous') {
          // Clear localStorage for anonymous users
          const allHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
          const otherUsersHistory = allHistory.filter(item => item.userId !== userId)
          localStorage.setItem('apiTesterHistory', JSON.stringify(otherUsersHistory))
          setHistory([])
          toast.success('History cleared successfully')
        } else {
          // Clear database history for authenticated users
          const { error } = await supabase
            .from('history')
            .delete()
            .eq('user_id', userId)

          if (error) throw error;
          
          setHistory([])
          toast.success('History cleared successfully')
        }
      } catch (error) {
        console.error('Failed to clear history:', error)
        toast.error('Failed to clear history')
      }
    }
  }

  const deleteHistoryItem = async (historyId, event) => {
    event.stopPropagation()
    
    try {
      if (userId === 'anonymous') {
        // Delete from localStorage for anonymous users
        const allHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
        const updatedHistory = allHistory.filter(item => item.id !== historyId)
        localStorage.setItem('apiTesterHistory', JSON.stringify(updatedHistory))
        setHistory(prev => prev.filter(item => item.id !== historyId))
        toast.success('Request removed from history')
      } else {
        // Delete from database for authenticated users
        const { error } = await supabase
          .from('history')
          .delete()
          .eq('id', historyId)
          .eq('user_id', userId)

        if (error) throw error;
        
        setHistory(prev => prev.filter(item => item.id !== historyId))
        toast.success('Request removed from history')
      }
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete history item')
    }
  }

  const handleLoadRequest = (request) => {
    onLoadRequest(request)
    toast.success('Request loaded into form')
  }

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'PATCH': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const truncateUrl = (url, maxLength = 40) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
  }

  return (
    <div className="h-screen flex flex-col bg-white border-r border-gray-200">
      {/* User Profile Section - Fixed Height */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-800 truncate">
              {user?.name || 'API Tester'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user ? 'Professional Plan' : 'Demo Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Fixed Height */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'history' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <Clock className="w-4 h-4" />
          <span>History</span>
          {history.length > 0 && (
            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'collections' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('collections')}
        >
          <Folder className="w-4 h-4" />
          <span>Collections</span>
          {collections.length > 0 && (
            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {collections.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'history' && (
          <div className="h-full flex flex-col">
            {/* History Header - Fixed */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Request History</h3>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-sm text-gray-500 hover:text-red-600 flex items-center space-x-1 transition-colors"
                    title="Clear all history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* History List - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No requests yet</p>
                  <p className="text-gray-400 text-xs mt-1">Your API requests will appear here</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {history.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleLoadRequest(request)}
                      className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors group relative"
                    >
                      <button
                        onClick={(e) => deleteHistoryItem(request.id, e)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        {request.responseStatus && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.responseStatus >= 200 && request.responseStatus < 300
                              ? 'bg-green-100 text-green-800'
                              : request.responseStatus >= 400
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {request.responseStatus}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatTimestamp(request.createdAt)}
                        </span>
                      </div>
                      
                      <p 
                        className="text-sm text-gray-600 break-words"
                        title={request.url}
                      >
                        {truncateUrl(request.url, 50)}
                      </p>
                      
                      {request.duration && (
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-400">
                            {request.duration}ms
                          </span>
                          <button className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Load →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="h-full">
            <CollectionsManager
              collections={collections}
              onCreateCollection={onCreateCollection}
              onUpdateCollection={onUpdateCollection}
              onDeleteCollection={onDeleteCollection}
              onAddToCollection={onAddToCollection}
              currentRequest={currentRequest}
              onLoadRequest={handleLoadRequest}
            />
          </div>
        )}
      </div>

      {/* Settings Footer - Fixed Height */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
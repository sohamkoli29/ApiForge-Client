import React, { useState, useEffect } from 'react'
import { useAuth } from "./components/AuthProvider"
import Sidebar from './components/Sidebar'
import RequestForm from './components/RequestForm'
import ResponseViewer from './components/ResponseViewer'
import UserProfile from './components/UserProfile'
import { Toaster } from 'react-hot-toast'
import { supabase } from './supabase'

function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('history')
  const [response, setResponse] = useState(null)
  const [currentRequest, setCurrentRequest] = useState({
    url: '',
    method: 'GET',
    headers: [{ id: 1, key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [{ id: 1, key: '', value: '', enabled: true }],
    body: '{\n  \n}'
  })
  const [collections, setCollections] = useState([])

  // Get user ID for data operations
  const getUserId = () => {
    return user?.id || 'anonymous'
  }

  // Load collections from database on component mount and when user changes
  useEffect(() => {
    loadCollectionsFromDatabase()
  }, [user])

  const loadCollectionsFromDatabase = async () => {
    const userId = getUserId()
    if (userId === 'anonymous') {
      // Use localStorage for anonymous users
      const localCollections = getCollectionsFromStorage()
      setCollections(localCollections)
      return
    }

    try {
      // Try to load from database
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_items(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        // Format database collections for the UI
        const formattedCollections = data.map(collection => ({
          id: collection.id,
          userId: collection.user_id,
          name: collection.name,
          description: collection.description,
          color: collection.color,
          itemCount: collection.collection_items?.length || 0,
          items: collection.collection_items?.map(item => ({
            id: item.id,
            collectionId: item.collection_id,
            userId: item.user_id,
            name: item.name,
            url: item.url,
            method: item.method,
            headers: item.headers,
            params: item.params,
            body: item.body,
            description: item.description,
            createdAt: new Date(item.created_at).getTime(),
            updatedAt: new Date(item.updated_at).getTime()
          })) || [],
          createdAt: new Date(collection.created_at).getTime(),
          updatedAt: new Date(collection.updated_at).getTime()
        }))

        setCollections(formattedCollections)
      } else {
        // No collections in database, use localStorage
        const localCollections = getCollectionsFromStorage()
        setCollections(localCollections)
      }
    } catch (error) {
      console.error('Failed to load collections from database:', error)
      // Fallback to localStorage
      const localCollections = getCollectionsFromStorage()
      setCollections(localCollections)
    }
  }

  const handleSaveRequest = async (requestData) => {
    try {
      const userId = getUserId()
      console.log('Saving request for user:', userId)
      
      // Try to save to Supabase first
      if (supabase && userId !== 'anonymous') {
        try {
          console.log('Attempting to save to Supabase...')
          const { data, error } = await supabase
            .from('history')
            .insert({
              user_id: userId,
              url: requestData.url,
              method: requestData.method,
              headers: requestData.headers ? JSON.stringify(requestData.headers) : null,
              params: requestData.params ? JSON.stringify(requestData.params) : null,
              body: requestData.body || null,
              response_status: requestData.responseStatus || null,
              duration: requestData.duration || null
            })
            .select()

          if (!error) {
            console.log('✅ Request saved to database successfully');
            return;
          } else {
            console.warn('❌ Database save failed:', error);
          }
        } catch (dbError) {
          console.warn('❌ Database exception:', dbError);
        }
      }

      // Fallback to localStorage
      console.log('🔄 Falling back to localStorage...')
      const historyItem = {
        id: Date.now().toString(),
        userId: userId,
        ...requestData,
        createdAt: Date.now()
      }
      
      const existingHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
      const newHistory = [historyItem, ...existingHistory.slice(0, 49)]
      localStorage.setItem('apiTesterHistory', JSON.stringify(newHistory))
      console.log('✅ Request saved to localStorage');
      
    } catch (error) {
      console.error('💥 Failed to save request history:', error)
    }
  }

  // Updated collections functions to handle database
  const createCollection = async (collectionData) => {
    const userId = getUserId()
    
    if (userId === 'anonymous') {
      // Use localStorage for anonymous users
      const newCollection = {
        id: 'collection_' + Date.now(),
        userId,
        ...collectionData,
        itemCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        items: []
      }
      
      const updatedCollections = [newCollection, ...collections]
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newCollection.id
    }

    try {
      // Save to database
      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: userId,
          name: collectionData.name,
          description: collectionData.description,
          color: collectionData.color
        })
        .select()
        .single()

      if (error) throw error

      const newCollection = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        color: data.color,
        itemCount: 0,
        items: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime()
      }

      const updatedCollections = [newCollection, ...collections]
      setCollections(updatedCollections)
      return data.id

    } catch (error) {
      console.error('Failed to create collection in database:', error)
      // Fallback to localStorage
      const newCollection = {
        id: 'collection_' + Date.now(),
        userId,
        ...collectionData,
        itemCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        items: []
      }
      
      const updatedCollections = [newCollection, ...collections]
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newCollection.id
    }
  }

  const updateCollection = async (collectionId, updates) => {
    const userId = getUserId()
    
    if (userId === 'anonymous') {
      // Use localStorage for anonymous users
      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { ...collection, ...updates, updatedAt: Date.now() }
          : collection
      )
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('collections')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
        .eq('user_id', userId)

      if (error) throw error

      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { ...collection, ...updates, updatedAt: Date.now() }
          : collection
      )
      setCollections(updatedCollections)

    } catch (error) {
      console.error('Failed to update collection in database:', error)
      // Fallback to localStorage
      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { ...collection, ...updates, updatedAt: Date.now() }
          : collection
      )
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
    }
  }

  const deleteCollection = async (collectionId) => {
    const userId = getUserId()
    
    if (userId === 'anonymous') {
      // Use localStorage for anonymous users
      const updatedCollections = collections.filter(collection => collection.id !== collectionId)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return
    }

    try {
      // Delete from database
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', userId)

      if (error) throw error

      const updatedCollections = collections.filter(collection => collection.id !== collectionId)
      setCollections(updatedCollections)

    } catch (error) {
      console.error('Failed to delete collection from database:', error)
      // Fallback to localStorage
      const updatedCollections = collections.filter(collection => collection.id !== collectionId)
      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
    }
  }

  const addToCollection = async (collectionId, requestData) => {
    const userId = getUserId()
    
    if (userId === 'anonymous') {
      // Use localStorage for anonymous users
      const collection = collections.find(c => c.id === collectionId)
      if (!collection) throw new Error('Collection not found')

      const newItem = {
        id: 'item_' + Date.now(),
        collectionId,
        userId,
        ...requestData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { 
              ...collection, 
              itemCount: (collection.itemCount || 0) + 1,
              updatedAt: Date.now(),
              items: [...(collection.items || []), newItem]
            }
          : collection
      )

      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newItem.id
    }

    try {
      // Save to database
      const { data, error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          user_id: userId,
          name: requestData.name,
          url: requestData.url,
          method: requestData.method,
          headers: requestData.headers ? JSON.stringify(requestData.headers) : null,
          params: requestData.params ? JSON.stringify(requestData.params) : null,
          body: requestData.body || null,
          description: requestData.description || null
        })
        .select()
        .single()

      if (error) throw error

      // Update collection updated_at
      await supabase
        .from('collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId)

      const newItem = {
        id: data.id,
        collectionId: data.collection_id,
        userId: data.user_id,
        name: data.name,
        url: data.url,
        method: data.method,
        headers: data.headers,
        params: data.params,
        body: data.body,
        description: data.description,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime()
      }

      // Update local state
      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { 
              ...collection, 
              itemCount: (collection.itemCount || 0) + 1,
              updatedAt: Date.now(),
              items: [...(collection.items || []), newItem]
            }
          : collection
      )

      setCollections(updatedCollections)
      return data.id

    } catch (error) {
      console.error('Failed to add item to collection in database:', error)
      // Fallback to localStorage
      const collection = collections.find(c => c.id === collectionId)
      if (!collection) throw new Error('Collection not found')

      const newItem = {
        id: 'item_' + Date.now(),
        collectionId,
        userId,
        ...requestData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { 
              ...collection, 
              itemCount: (collection.itemCount || 0) + 1,
              updatedAt: Date.now(),
              items: [...(collection.items || []), newItem]
            }
          : collection
      )

      saveCollectionsToStorage(updatedCollections)
      setCollections(updatedCollections)
      return newItem.id
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
      const allHistory = JSON.parse(localStorage.getItem('apiTesterHistory') || '[]')
      // Filter by current user
      return allHistory.filter(item => item.userId === getUserId())
    } catch {
      return []
    }
  }

  const getCollectionsFromStorage = () => {
    try {
      const allCollections = JSON.parse(localStorage.getItem('apiTesterCollections') || '[]')
      // Filter by current user
      return allCollections.filter(collection => collection.userId === getUserId())
    } catch {
      return []
    }
  }

  const saveCollectionsToStorage = (collections) => {
    try {
      const allCollections = JSON.parse(localStorage.getItem('apiTesterCollections') || '[]')
      const otherUsersCollections = allCollections.filter(c => c.userId !== getUserId())
      const newCollections = [...otherUsersCollections, ...collections]
      localStorage.setItem('apiTesterCollections', JSON.stringify(newCollections))
    } catch (error) {
      console.error('Failed to save collections to localStorage:', error)
      throw error
    }
  }

  return (
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
          collections={collections}
          onCreateCollection={createCollection}
          onUpdateCollection={updateCollection}
          onDeleteCollection={deleteCollection}
          onAddToCollection={addToCollection}
          userId={getUserId()}
          currentRequest={currentRequest}
          user={user}
        />
        
        {/* User Profile Section */}
        <UserProfile />
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
  )
}

export default App
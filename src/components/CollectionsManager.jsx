import React, { useState } from 'react'
import { Plus, Folder, Edit3, Trash2, MoreVertical, X, Save, FolderPlus, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

const CollectionsManager = ({ 
  collections, 
  onCreateCollection, 
  onUpdateCollection, 
  onDeleteCollection,
  onAddToCollection,
  currentRequest,
  onLoadRequest 
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [activeCollection, setActiveCollection] = useState(null)
  const [showAddToCollection, setShowAddToCollection] = useState(false)

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Collection name is required')
      return
    }

    try {
      await onCreateCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
      })
      
      setNewCollectionName('')
      setNewCollectionDescription('')
      setIsCreating(false)
      toast.success('Collection created successfully')
    } catch (error) {
      toast.error('Failed to create collection')
    }
  }

  const handleUpdateCollection = async (collection) => {
    if (!newCollectionName.trim()) {
      toast.error('Collection name is required')
      return
    }

    try {
      await onUpdateCollection(collection.id, {
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
      })
      
      setEditingCollection(null)
      setNewCollectionName('')
      setNewCollectionDescription('')
      toast.success('Collection updated successfully')
    } catch (error) {
      toast.error('Failed to update collection')
    }
  }

  const handleDeleteCollection = async (collection) => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"? This will also remove all requests in this collection.`)) {
      try {
        await onDeleteCollection(collection.id)
        toast.success('Collection deleted successfully')
      } catch (error) {
        toast.error('Failed to delete collection')
      }
    }
  }

  const handleAddToCollection = async (collection) => {
    if (!currentRequest?.url) {
      toast.error('No request to save. Please create a request first.')
      return
    }

    try {
      await onAddToCollection(collection.id, {
        name: `${currentRequest.method} ${new URL(currentRequest.url).pathname}`,
        url: currentRequest.url,
        method: currentRequest.method,
        headers: JSON.stringify(currentRequest.headers),
        params: JSON.stringify(currentRequest.params),
        body: currentRequest.body,
      })
      
      setShowAddToCollection(false)
      toast.success('Request added to collection')
    } catch (error) {
      toast.error('Failed to add request to collection')
    }
  }

  const startEdit = (collection) => {
    setEditingCollection(collection)
    setNewCollectionName(collection.name)
    setNewCollectionDescription(collection.description || '')
  }

  const cancelEdit = () => {
    setEditingCollection(null)
    setNewCollectionName('')
    setNewCollectionDescription('')
  }

  const getDefaultCollections = () => [
    {
      id: 'default-auth',
      name: 'Authentication',
      description: 'Login, logout, and token management APIs',
      itemCount: 0,
      color: '#EF4444'
    },
    {
      id: 'default-users',
      name: 'User Management',
      description: 'User CRUD operations and profiles',
      itemCount: 0,
      color: '#3B82F6'
    },
    {
      id: 'default-products',
      name: 'Products',
      description: 'Product catalog and inventory',
      itemCount: 0,
      color: '#10B981'
    }
  ]

  const allCollections = collections.length > 0 ? collections : getDefaultCollections()

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Collections</h3>
          <div className="flex space-x-2">
            {currentRequest?.url && (
              <button
                onClick={() => setShowAddToCollection(true)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded hover:border-blue-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Save Current</span>
              </button>
            )}
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 border border-green-200 rounded hover:border-green-300 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Create Collection Form */}
          {isCreating && (
            <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Create New Collection</h4>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Collection name (e.g., Auth APIs)"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                />
              </div>
              
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Create</span>
                </button>
              </div>
            </div>
          )}

          {/* Collections List */}
          <div className="space-y-2">
            {allCollections.map((collection) => (
              <div
                key={collection.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group relative"
              >
                {/* Edit/Delete Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={() => startEdit(collection)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Edit collection"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(collection)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Delete collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit Form */}
                {editingCollection?.id === collection.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                    <textarea
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                      placeholder="Description (optional)"
                    />
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateCollection(collection)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Collection Info */
                  <div 
                    className="cursor-pointer"
                    onClick={() => setActiveCollection(
                      activeCollection?.id === collection.id ? null : collection
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{collection.name}</div>
                        {collection.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {collection.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {collection.itemCount} requests • 
                          Updated {new Date(collection.updatedAt || collection.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <MoreVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* Collection Items */}
                    {activeCollection?.id === collection.id && collection.items && collection.items.length > 0 && (
                      <div className="mt-3 ml-8 space-y-2 border-t pt-3">
                        {collection.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => onLoadRequest(item)}
                            className="p-2 rounded border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                item.method === 'GET' ? 'bg-green-100 text-green-800' :
                                item.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                item.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                item.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.method}
                              </span>
                              <span className="text-sm text-gray-700 flex-1 truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {item.url}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {allCollections.length === 0 && !isCreating && (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No collections yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Create a collection to organize your API requests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add to Collection Modal - Fixed position */}
      {showAddToCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Add to Collection</h3>
              <button
                onClick={() => setShowAddToCollection(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Save current request to a collection:
              </p>
              
              {allCollections.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No collections found. Create a collection first.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allCollections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => handleAddToCollection(collection)}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Folder className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{collection.name}</div>
                          <div className="text-xs text-gray-500">
                            {collection.itemCount} requests
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollectionsManager
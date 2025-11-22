import React, { useState } from 'react'
import { Key, User, Lock, Eye, EyeOff, Save, TestTube } from 'lucide-react'
import { toast } from 'react-hot-toast'

const AuthTab = ({ onAuthSuccess, authConfig, setAuthConfig }) => {
  const [authType, setAuthType] = useState(authConfig?.type || 'none')
  const [username, setUsername] = useState(authConfig?.username || '')
  const [password, setPassword] = useState(authConfig?.password || '')
  const [token, setToken] = useState(authConfig?.token || '')
  const [showPassword, setShowPassword] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const authTypes = [
    { value: 'none', label: 'No Auth' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
   
    { value: 'custom', label: 'Custom Headers' }
  ]

  const handleSaveAuth = () => {
    const config = {
      type: authType,
      username,
      password,
      token,
      timestamp: Date.now()
    }
    
    setAuthConfig(config)
    
    // Save to localStorage
    localStorage.setItem('apiTesterAuthConfig', JSON.stringify(config))
    toast.success('Authentication configuration saved')
  }

  const handleTestAuth = async () => {
    if (!authConfig) {
      toast.error('Please save authentication configuration first')
      return
    }

    setIsTesting(true)
    try {
      const testResult = await testAuthentication(authConfig)
      
      if (testResult.success) {
        toast.success('✅ Authentication test successful!')
        onAuthSuccess(authConfig)
      } else {
        toast.error(`❌ Authentication failed: ${testResult.error}`)
      }
    } catch (error) {
      toast.error(`❌ Test failed: ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const testAuthentication = async (config) => {
    // This would be your actual authentication test logic
    // For now, we'll simulate a test
    return new Promise((resolve) => {
      setTimeout(() => {
        if (config.type === 'basic' && config.username && config.password) {
          resolve({ success: true, message: 'Basic auth configured' })
        } else if (config.type === 'bearer' && config.token) {
          resolve({ success: true, message: 'Bearer token configured' })
        } else if (config.type === 'medimapper' && config.token) {
          resolve({ success: true, message: 'MediMapper token configured' })
        } else {
          resolve({ success: false, error: 'Invalid configuration' })
        }
      }, 1000)
    })
  }

  return (
    <div className="space-y-6">
      {/* Auth Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authentication Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {authTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setAuthType(type.value)}
              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                authType === type.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Auth Fields */}
      {authType === 'basic' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>Basic Authentication</span>
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bearer Token Fields */}
      {authType === 'bearer' && (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>Bearer Token</span>
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your bearer token"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              This token will be sent in the Authorization header as: Bearer [token]
            </p>
          </div>
        </div>
      )}

 

      {/* Custom Headers Fields */}
      {authType === 'custom' && (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-800">
            Custom Headers
          </h4>
          <p className="text-sm text-purple-700">
            Use the Headers tab to add custom authentication headers like:
            <br />
            • X-API-Key: your_api_key
            <br />
            • Authorization: Custom your_token
          </p>
        </div>
      )}

      {/* Action Buttons for non-MediMapper auth types */}
      {authType  !== 'none' && (
        <div className="flex space-x-3">
          <button
            onClick={handleSaveAuth}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Auth</span>
          </button>

          <button
            onClick={handleTestAuth}
            disabled={isTesting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            <span>{isTesting ? 'Testing...' : 'Test Auth'}</span>
          </button>
        </div>
      )}

      {/* Auth Status */}
      {authConfig && authConfig.type !== 'none' && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {authConfig.type === 'basic' && 'Basic Authentication'}
                {authConfig.type === 'bearer' && 'Bearer Token'}
               
                {authConfig.type === 'custom' && 'Custom Headers'}
              </p>
              <p className="text-xs text-gray-500">
                Configured {new Date(authConfig.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthTab
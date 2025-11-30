import React from 'react'
import { Github, Mail, Heart, ExternalLink } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left Section - Branding */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">API Testing Tool</p>
              <p className="text-xs text-gray-500">Test APIs with confidence</p>
            </div>
          </div>

          {/* Center Section - Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a 
              href="https://github.com/sohamkoli29/ApiForge-Client" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Docs</span>
            </a>
            <a 
              href="mailto:sohamkoli29@gmail.com"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Support</span>
            </a>
          </div>

          {/* Right Section - Copyright */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>© {currentYear} APIForge</span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by Soham Koli</span>
            </span>
          </div>
        </div>

        {/* Bottom Section - Tech Stack */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-center text-gray-500">
            Built with React • Node.js • Express • Supabase • Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
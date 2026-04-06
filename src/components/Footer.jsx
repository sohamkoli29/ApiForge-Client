import React from 'react'
import { Github, Mail, Heart, Zap } from 'lucide-react'

const Footer = () => {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, gap: 8, flexWrap: 'wrap',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={12} color="white" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>ApiForge</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>v1.0</span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <a
          href="https://github.com/sohamkoli29/ApiForge-Client"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 11, fontWeight: 600 }}
        >
          <Github size={13} /> GitHub
        </a>
        <a
          href="mailto:sohamkoli29@gmail.com"
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 11, fontWeight: 600 }}
        >
          <Mail size={13} /> Support
        </a>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          Made with <Heart size={11} color="#ff5e5e" fill="#ff5e5e" /> by Soham Koli
        </span>
      </div>
    </footer>
  )
}

export default Footer
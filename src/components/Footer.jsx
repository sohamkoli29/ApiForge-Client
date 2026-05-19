import { Github, Mail, Heart } from 'lucide-react'

const Footer = () => (
  <footer style={{ background: '#fdf8f8', borderTop: '1px solid #e5e2e1', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 8, flexWrap: 'wrap', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#444748' }}>ApiForge</span>
      <span style={{ fontSize: 11, color: '#747878', fontFamily: "'DM Mono', monospace" }}>v1.0</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <a href="https://github.com/sohamkoli29/ApiForge-Client" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#747878', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
        <Github size={13} /> GitHub
      </a>
      <a href="mailto:sohamkoli29@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#747878', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
        <Mail size={13} /> Support
      </a>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#747878' }}>
        Made with <Heart size={11} color="#C9A96E" fill="#C9A96E" /> by Soham Koli
      </span>
    </div>
  </footer>
)

export default Footer
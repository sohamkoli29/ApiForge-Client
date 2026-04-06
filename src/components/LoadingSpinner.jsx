import { Zap } from 'lucide-react'

export default function LoadingSpinner() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 32px rgba(108,127,255,0.4)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <Zap size={26} color="white" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Loading ApiForge</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Setting things up…</div>
      <style>{`@keyframes pulse { 0%, 100% { box-shadow: 0 0 24px rgba(108,127,255,0.3); } 50% { box-shadow: 0 0 40px rgba(108,127,255,0.6); } }`}</style>
    </div>
  )
}
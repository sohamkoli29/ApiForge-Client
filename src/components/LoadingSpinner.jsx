export default function LoadingSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #C9A96E, #e4c285)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(201,169,110,0.4)', animation: 'pulse 1.5s ease-in-out infinite' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#1c1b1b' }}>Loading ApiForge</div>
      <div style={{ fontSize: 13, color: '#747878' }}>Setting things up…</div>
      <style>{`@keyframes pulse { 0%,100% { box-shadow: 0 0 24px rgba(201,169,110,0.3); } 50% { box-shadow: 0 0 40px rgba(201,169,110,0.6); } }`}</style>
    </div>
  )
}
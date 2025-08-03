export default function HomePage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '48px', color: '#1a365d', marginBottom: '20px' }}>
        🎓 Athanor
      </h1>
      <p style={{ fontSize: '20px', color: '#4a5568', marginBottom: '30px' }}>
        Plateforme de Philosophie Contemporaine
      </p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <a href="/articles" style={{ 
          background: '#1a365d', 
          color: 'white', 
          padding: '12px 24px', 
          textDecoration: 'none',
          borderRadius: '8px'
        }}>
          📚 Articles
        </a>
        <a href="/admin" style={{ 
          background: '#e53e3e', 
          color: 'white', 
          padding: '12px 24px', 
          textDecoration: 'none',
          borderRadius: '8px'
        }}>
          ⚙️ Admin
        </a>
      </div>
      <div style={{ marginTop: '40px' }}>
        <h2>✅ Site Fonctionnel !</h2>
        <p>Votre plateforme philosophique est maintenant en ligne.</p>
      </div>
    </div>
  )
}
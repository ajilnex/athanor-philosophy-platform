export default function HomePage() {
  return (
    <html lang="fr">
      <head>
        <title>Athanor - Test Final</title>
      </head>
      <body style={{fontFamily: 'Arial', padding: '20px', textAlign: 'center'}}>
        <h1 style={{color: '#2563eb'}}>🎯 TEST FINAL - Athanor</h1>
        <p>Build: {new Date().toISOString()}</p>
        <p>Région: Paris (cdg1)</p>
        
        <div style={{margin: '20px 0'}}>
          <h2>🧪 Tests disponibles:</h2>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <a href="/api/test" style={{background: '#10b981', color: 'white', padding: '8px 16px', textDecoration: 'none', borderRadius: '4px'}}>
              API Test
            </a>
            <a href="/api/health" style={{background: '#3b82f6', color: 'white', padding: '8px 16px', textDecoration: 'none', borderRadius: '4px'}}>
              Health Check
            </a>
          </div>
        </div>
        
        <div style={{background: '#fef3c7', padding: '15px', borderRadius: '8px', margin: '20px 0'}}>
          <h3>🔧 Diagnostic Status</h3>
          <p>✅ Build sans base de données</p>
          <p>✅ Région Paris forcée</p>
          <p>✅ Routes API ultra-simples</p>
          <p>⚠️ Database URL à vérifier dans Vercel</p>
        </div>
        
        <p><small>Si cette page s'affiche, le serveur fonctionne !</small></p>
      </body>
    </html>
  )
}
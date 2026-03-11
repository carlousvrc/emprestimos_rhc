'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'sans-serif', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '600px', width: '90%', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ color: '#EF4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ color: '#001A72', fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Erro na Aplicação</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Ocorreu um erro inesperado. Detalhes para diagnóstico:</p>
          <pre style={{ background: '#FEF2F2', color: '#991B1B', padding: '1rem', borderRadius: '0.75rem', textAlign: 'left', fontSize: '0.8rem', overflowX: 'auto', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error?.message || 'Erro desconhecido'}
            {error?.stack ? '\n\n' + error.stack : ''}
          </pre>
          <button
            onClick={reset}
            style={{ background: '#001A72', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 2rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Tentar Novamente
          </button>
        </div>
      </body>
    </html>
  )
}

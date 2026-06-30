import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Mining Dashboard',
  description: 'Cat vs Dog Classifier & US Accidents Analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside style={{ width: '260px', background: 'var(--background)', padding: '32px 24px', borderRight: '1px solid var(--border)' }}>
            <h2 style={{ color: '#fff', marginBottom: '4px', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Data Mining</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '0.875rem' }}>Project Dashboard</p>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="label" style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '12px' }}>Models</span>
              <a href="/" className="nav-link">Image Prediction</a>
              <a href="/training" className="nav-link">Training Analysis</a>
              
              <span className="label" style={{ marginTop: '24px', marginBottom: '8px', paddingLeft: '12px' }}>Analytics</span>
              <a href="/us-accidents" className="nav-link">US Accidents</a>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--border)' }}>Vercel-inspired UI</p>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, padding: '48px', overflowY: 'auto', height: '100vh', background: '#050505' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}

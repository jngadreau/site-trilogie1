import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminDeckLandingPage } from './pages/AdminDeckLandingPage'
import { LandingDeckPage } from './pages/LandingDeckPage'

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem' }}>Landings deck modulaires</h1>
      <p>API + Vite proxy requis (port API 3040).</p>
      <ul>
        <li>
          <a href="/deck/arbre-de-vie-a">arbre-de-vie-a</a> — Hero split, identité panneau, pour qui 2
          colonnes, comment numéroté
        </li>
        <li>
          <a href="/deck/arbre-de-vie-b">arbre-de-vie-b</a> — Hero full bleed, identité minimal, piliers,
          timeline
        </li>
        <li>
          <a href="/deck/arbre-de-vie-c">arbre-de-vie-c</a> — variante C (voir plan Grok +{' '}
          <code>deck-landing-plans/arbre-de-vie-c.json</code>)
        </li>
      </ul>
      <p>
        <a href="/admin">Admin — suivi Grok / JSON</a>
      </p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminDeckLandingPage />} />
      <Route path="/deck/:slug" element={<LandingDeckPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

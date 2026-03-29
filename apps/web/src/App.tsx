import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminHomePage } from './pages/AdminHomePage'
import { AdminDeckLandingLegacyPage } from './pages/AdminDeckLandingLegacyPage'
import { HomePage } from './pages/HomePage'
import { LandingDeckPage } from './pages/LandingDeckPage'
import { SectionDemoPage } from './pages/SectionDemoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminHomePage />} />
      <Route path="/admin/deck-landing-legacy" element={<AdminDeckLandingLegacyPage />} />
      <Route path="/demo/sections" element={<SectionDemoPage />} />
      <Route path="/demo/sections/:sectionType" element={<SectionDemoPage />} />
      <Route path="/deck/:slug" element={<LandingDeckPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

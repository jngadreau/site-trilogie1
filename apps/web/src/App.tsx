import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminDeckLandingPage } from './pages/AdminDeckLandingPage'
import { HomePage } from './pages/HomePage'
import { LandingDeckPage } from './pages/LandingDeckPage'
import { SectionDemoPage } from './pages/SectionDemoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminDeckLandingPage />} />
      <Route path="/demo/sections" element={<SectionDemoPage />} />
      <Route path="/demo/sections/:sectionType" element={<SectionDemoPage />} />
      <Route path="/deck/:slug" element={<LandingDeckPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

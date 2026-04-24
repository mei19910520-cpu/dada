import { Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import DashboardPage from '@/pages/DashboardPage'
import ChatPage from '@/pages/ChatPage'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#090b10]">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4 lg:p-6">
        <Routes>
          <Route path="/"     element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </main>
    </div>
  )
}

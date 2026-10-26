import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { HolographicWorkspace } from './components/floating/HolographicWorkspace'
import { LoadingScreen } from './components/LoadingScreen'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function WorkspaceChatRoute() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  return (
    <HolographicWorkspace
      initialOpenWindow="chat"
      initialConversationId={conversationId || null}
    />
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<HolographicWorkspace />} />
                <Route path="/chat" element={<HolographicWorkspace initialOpenWindow="chat" />} />
                <Route path="/chat/:conversationId" element={<WorkspaceChatRoute />} />
                <Route path="/knowledge" element={<HolographicWorkspace initialOpenWindow="knowledge" />} />
                <Route path="/activity" element={<HolographicWorkspace initialOpenWindow="activity" />} />
                <Route path="/system" element={<HolographicWorkspace initialOpenWindow="system" />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
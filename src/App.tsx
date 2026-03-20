import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectListPage from './pages/ProjectListPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProjectSettingsPage from './pages/ProjectSettingsPage'
import TaskDetailPage from './pages/TaskDetailPage'
import PdfExportPage from './pages/PdfExportPage'
import MonthlyReportPage from './pages/MonthlyReportPage'
import ErrorBoundary from './components/ui/ErrorBoundary'

function DataLoader({ children }: { children: React.ReactNode }) {
  const { loadAll, isLoaded } = useAppStore()

  useEffect(() => {
    loadAll().catch(err => console.error('loadAll failed:', err))
  }, [])

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#888',
        fontSize: 14,
      }}>
        読み込み中...
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <DataLoader>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/"                      element={<DashboardPage />} />
              <Route path="/projects"              element={<ProjectListPage />} />
              <Route path="/projects/:id"          element={<ProjectDetailPage />} />
              <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
              <Route path="/projects/:id/pdf"      element={<PdfExportPage />} />
              <Route path="/tasks/:id"             element={<TaskDetailPage />} />
              <Route path="/monthly"               element={<MonthlyReportPage />} />
            </Route>
          </Routes>
        </DataLoader>
      </HashRouter>
    </ErrorBoundary>
  )
}

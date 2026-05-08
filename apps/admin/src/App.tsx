import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import OverviewPage      from './pages/Overview'
import VerificationsPage from './pages/Verifications'
import DisputesPage      from './pages/Disputes'
import PayoutsPage       from './pages/Payouts'
import UsersPage         from './pages/Users'
import LoginPage         from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/"              element={<Navigate to="/overview" replace />} />
          <Route path="/overview"      element={<OverviewPage />} />
          <Route path="/verifications" element={<VerificationsPage />} />
          <Route path="/disputes"      element={<DisputesPage />} />
          <Route path="/payouts"       element={<PayoutsPage />} />
          <Route path="/users"         element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

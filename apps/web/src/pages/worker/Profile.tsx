import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
export default function WorkerProfilePage() {
  const { profile, signOut } = useAuth()
  return (
    <div className="page-with-nav px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">My Profile</h1>
      {profile && <div className="card mb-4"><p className="font-semibold">{profile.full_name}</p></div>}
      <button onClick={signOut} className="btn-secondary">Sign out</button>
      <BottomNav variant="worker" />
    </div>
  )
}

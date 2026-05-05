import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ profile }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="bg-navy/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <span className="font-display text-gold text-xl">PeptBiohacking</span>
      <div className="flex items-center gap-4">
        <span className="text-white/50 text-sm hidden sm:block">{profile?.full_name}</span>
        <button onClick={handleLogout} className="text-xs text-white/40 hover:text-teal transition-colors">
          Salir
        </button>
      </div>
    </nav>
  )
}

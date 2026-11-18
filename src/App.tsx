import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import GoogleLoginButton from './components/GoogleLoginButton'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />
  }

  if (loading) {
    return <p>載入中…</p>
  }

  return (
    <main>
      {user ? (
        <div>
          <h1>已登入</h1>
          <p>{user.email}</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
            }}
          >
            登出
          </button>
        </div>
      ) : (
        <GoogleLoginButton />
      )}
    </main>
  )
}

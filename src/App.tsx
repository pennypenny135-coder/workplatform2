import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import GoogleLoginButton from './components/GoogleLoginButton'
import AuthCallback from './pages/AuthCallback'
// 假設你嘅主面板元件放喺呢度，請根據你真實嘅檔案路徑調整：
import Dashboard from './components/Dashboard' 

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
          {/* 頂部顯示登入狀態同登出掣 */}
          <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #333' }}>
            <span>已登入: {user.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
              }}
            >
              登出
            </button>
          </header>

          {/* 喺呢度放番你個真正嘅工作平台主頁／Dashboard 元件！ */}
          <Dashboard />
        </div>
      ) : (
        <GoogleLoginButton />
      )}
    </main>
  )
}

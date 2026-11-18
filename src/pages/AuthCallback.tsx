import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        console.error('Login failed:', error?.message)
        window.location.href = '/'
        return
      }

      window.location.href = '/'
    }

    checkSession()
  }, [])

  return <p>正在完成 Google 登入…</p>
}

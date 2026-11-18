import { supabase } from '../lib/supabase'

export default function GoogleLoginButton() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Google login error:', error.message)
      alert('Google 登入失敗，請再試一次')
    }
  }

  return (
    <button onClick={handleLogin}>
      使用 Google 登入
    </button>
  )
}

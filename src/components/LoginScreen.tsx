interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  isSigningIn: boolean;
  error: string | null;
}

export default function LoginScreen({ onSignIn, isSigningIn, error }: LoginScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-bold text-white">
            W
          </div>
          <h1 className="text-2xl font-semibold text-white">Work Platform</h1>
          <p className="mt-2 text-sm text-slate-400">
            使用 Google 帳戶登入，同步你的工作平台資料。
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSignIn}
          disabled={isSigningIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningIn ? '登入中...' : '使用 Google 登入'}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          登入即表示你同意以 Google 帳戶建立及存取個人工作資料。
        </p>
      </div>
    </div>
  );
}

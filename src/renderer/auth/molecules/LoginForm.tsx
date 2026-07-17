import { useState } from 'react'
import { useAuth } from '../../shared/hooks/useAuth'
import LoginInput from '../atoms/LoginInput'

export default function LoginForm(): JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    await login({ username: username.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <LoginInput
        label="Usuario"
        type="text"
        value={username}
        onChange={setUsername}
        placeholder="Ingrese su usuario"
        autoFocus
      />
      <LoginInput
        label="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Ingrese su contraseña"
      />

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !username.trim() || !password.trim()}
        className="mt-2 flex h-10 items-center justify-center rounded-md bg-primary px-5 text-button
          text-on-primary transition-colors hover:bg-primary-active
          disabled:cursor-not-allowed disabled:bg-primary-disabled disabled:text-muted"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  )
}

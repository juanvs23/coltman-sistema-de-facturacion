import LoginForm from '../molecules/LoginForm'

export default function LoginCard(): JSX.Element {
  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <span className="text-title-md text-on-primary">SF</span>
        </div>
        <h1 className="text-title-lg text-ink">Sistema de Facturación</h1>
        <p className="mt-1 text-body-sm text-muted">Inicie sesión para continuar</p>
      </div>
      <LoginForm />
    </div>
  )
}

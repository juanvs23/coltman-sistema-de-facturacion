import { ThemeProvider } from './shared/hooks/useTheme'
import { AuthProvider } from './shared/hooks/useAuth'
import AppRouter from './AppRouter'

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}

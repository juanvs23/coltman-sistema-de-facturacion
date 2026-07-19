import { ThemeProvider } from './shared/hooks/useTheme'
import { AuthProvider } from './shared/hooks/useAuth'
import { NavigationProvider } from './shared/hooks/useNavigation'
import AppRouter from './AppRouter'

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationProvider>
          <AppRouter />
        </NavigationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

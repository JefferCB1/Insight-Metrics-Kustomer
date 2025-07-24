import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme/theme';
import Dashboard from './components/Dashboard/Dashboard';
import { useEffect } from 'react';
import { kustomerService } from './services/kustomerService';

function App() {
  useEffect(() => {
    // Probar la conexión al cargar la app
    console.log('🔍 Probando conexión con Kustomer...');
    kustomerService.testConnection()
      .then((connected: boolean) => {
        if (connected) {
          console.log('✅ Conexión con Kustomer establecida correctamente');
        }
      })
      .catch((error: Error) => {
        console.error('❌ Error al conectar con Kustomer:', error);
      });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
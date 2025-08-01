
cat > backend/server-improved.js << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Estado de la conexión
let connectionStatus = {
  isConnected: false,
  lastCheck: null,
  error: null,
  mode: 'mock'
};

// Verificar conexión con Kustomer
async function checkKustomerConnection() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.prod1.kustomer.com/v1/users/current', {
      headers: {
        'Authorization': `Bearer ${process.env.KUSTOMER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      connectionStatus = {
        isConnected: true,
        lastCheck: new Date(),
        error: null,
        mode: 'live'
      };
      console.log('✅ Conexión con Kustomer establecida');
      return true;
    }
  } catch (error) {
    connectionStatus = {
      isConnected: false,
      lastCheck: new Date(),
      error: error.message,
      mode: 'mock'
    };
    console.log('⚠️ No se pudo conectar con Kustomer, usando datos mock');
  }
  return false;
}

// Verificar conexión al iniciar
checkKustomerConnection();

// Verificar cada 5 minutos
setInterval(checkKustomerConnection, 300000);

// Ruta de estado
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    kustomer: connectionStatus,
    timestamp: new Date().toISOString()
  });
});

// Función para generar datos mock realistas
function generateMockData(endpoint) {
  const now = new Date();
  
  switch(endpoint) {
    case '/v1/users/current':
      return {
        data: {
          type: 'user',
          id: 'mock-user-123',
          attributes: {
            email: 'dashboard@bia-energy.com',
            displayName: 'CX Dashboard User',
            name: 'Dashboard API',
            role: 'org.admin'
          }
        }
      };
      
    case '/v1/conversations':
      const conversations = [];
      const teams = ['Soporte Técnico', 'Ventas', 'Billing', 'General'];
      const agents = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Pérez'];
      const statuses = ['done', 'open', 'snoozed'];
      
      for (let i = 0; i < 100; i++) {
        const createdDate = new Date(now);
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
        
        const responseTime = Math.random() * 5;
        const firstResponseDate = new Date(createdDate.getTime() + responseTime * 3600000);
        
        conversations.push({
          type: 'conversation',
          id: `conv-${i}`,
          attributes: {
            name: `Conversación #${1000 + i}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: Math.floor(Math.random() * 5),
            createdAt: createdDate.toISOString(),
            firstResponseAt: firstResponseDate.toISOString(),
            closedAt: Math.random() > 0.3 ? new Date().toISOString() : null,
            satisfactionScore: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 4 : null,
            tags: ['email', 'support'],
            custom: {
              team: teams[Math.floor(Math.random() * teams.length)],
              agent: agents[Math.floor(Math.random() * agents.length)],
              firstResponseTime: responseTime,
              csat: Math.random() * 2 + 3,
              contactRate: Math.floor(Math.random() * 10) + 1,
              channel: ['email', 'chat', 'phone'][Math.floor(Math.random() * 3)]
            }
          }
        });
      }
      
      return {
        data: conversations,
        meta: {
          page: 1,
          pages: 1,
          total: conversations.length
        }
      };
      
    default:
      return { data: [] };
  }
}

// Proxy inteligente para Kustomer
app.use('/api/kustomer', async (req, res) => {
  const endpoint = req.path;
  
  // Si hay conexión, intentar obtener datos reales
  if (connectionStatus.isConnected) {
    try {
      const response = await fetch(`https://api.prod1.kustomer.com${endpoint}`, {
        method: req.method,
        headers: {
          'Authorization': `Bearer ${process.env.KUSTOMER_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (error) {
      console.error('Error al obtener datos reales:', error.message);
    }
  }
  
  // Si no hay conexión o falló, usar datos mock
  console.log(`📊 Devolviendo datos MOCK para: ${endpoint}`);
  const mockData = generateMockData(endpoint);
  res.json(mockData);
});

app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📍 Endpoint de salud: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Modo: ${connectionStatus.mode === 'mock' ? 'MOCK (Sin conexión a Kustomer)' : 'LIVE'}`);
  console.log(`💡 El servidor intentará conectar con Kustomer cada 5 minutos`);
});
EOF
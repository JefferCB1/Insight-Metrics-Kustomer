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

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ============ DATOS MOCK TEMPORALES ============
// Simular respuesta de usuario actual
app.get('/api/kustomer/v1/users/current', (req, res) => {
  console.log('📊 Devolviendo datos MOCK de usuario');
  res.json({
    data: {
      type: 'user',
      id: 'mock-user-123',
      attributes: {
        email: 'dashboard@bia-energy.com',
        displayName: 'CX Dashboard User',
        name: 'Dashboard API',
        avatarUrl: null,
        role: 'org.admin'
      }
    }
  });
});

// Simular conversaciones
app.get('/api/kustomer/v1/conversations', (req, res) => {
  console.log('📊 Devolviendo datos MOCK de conversaciones');
  
  // Generar datos mock realistas
  const conversations = [];
  const teams = ['Soporte Técnico', 'Ventas', 'Billing', 'General'];
  const agents = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Pérez'];
  
  // Generar 50 conversaciones de los últimos 30 días
  for (let i = 0; i < 50; i++) {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
    
    const responseTime = Math.random() * 5; // 0-5 horas
    const firstResponseDate = new Date(createdDate.getTime() + responseTime * 3600000);
    
    conversations.push({
      type: 'conversation',
      id: `conv-${i}`,
      attributes: {
        name: `Conversación #${1000 + i}`,
        status: Math.random() > 0.3 ? 'done' : 'open',
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
          csat: Math.random() * 2 + 3, // 3-5
          contactRate: Math.floor(Math.random() * 10) + 1
        }
      }
    });
  }
  
  res.json({
    data: conversations,
    meta: {
      page: 1,
      pages: 1,
      total: conversations.length
    }
  });
});

// Simular teams
app.get('/api/kustomer/v1/teams', (req, res) => {
  console.log('📊 Devolviendo datos MOCK de teams');
  res.json({
    data: [
      { id: '1', attributes: { name: 'Soporte Técnico', displayName: 'Soporte Técnico' } },
      { id: '2', attributes: { name: 'Ventas', displayName: 'Ventas' } },
      { id: '3', attributes: { name: 'Billing', displayName: 'Billing' } },
      { id: '4', attributes: { name: 'General', displayName: 'General' } }
    ]
  });
});

// Simular agentes
app.get('/api/kustomer/v1/users', (req, res) => {
  console.log('📊 Devolviendo datos MOCK de agentes');
  res.json({
    data: [
      { id: '1', attributes: { name: 'Ana García', email: 'ana@bia-energy.com' } },
      { id: '2', attributes: { name: 'Carlos López', email: 'carlos@bia-energy.com' } },
      { id: '3', attributes: { name: 'María Rodríguez', email: 'maria@bia-energy.com' } },
      { id: '4', attributes: { name: 'Juan Pérez', email: 'juan@bia-energy.com' } }
    ]
  });
});

// Catch all para otros endpoints
app.use('/api/kustomer', (req, res) => {
  console.log('⚠️  Endpoint no implementado:', req.path);
  res.status(404).json({
    error: 'Endpoint no implementado en modo mock',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📍 Endpoint de salud: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Proxy de Kustomer: http://localhost:${PORT}/api/kustomer/*`);
  console.log(`⚠️  MODO MOCK ACTIVADO - Usando datos simulados`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET /api/kustomer/v1/users/current`);
  console.log(`   - GET /api/kustomer/v1/conversations`);
  console.log(`   - GET /api/kustomer/v1/teams`);
  console.log(`   - GET /api/kustomer/v1/users`);
});
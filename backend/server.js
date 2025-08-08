// src/services/kustomerService.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class KustomerService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async fetchFromBackend(endpoint, params) {
    try {
      const queryString = params 
        ? '?' + new URLSearchParams(params).toString() 
        : '';
      
      console.log(`🔍 Fetching from: ${this.baseUrl}/kustomer${endpoint}${queryString}`);
      
      const response = await fetch(`${this.baseUrl}/kustomer${endpoint}${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 Response data:`, data);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching from backend:', error);
      throw error;
    }
  }

  async getMetrics(startDate, endDate) {
    try {
      console.log('📊 Obteniendo métricas del backend...');
      console.log('📅 Rango de fechas:', startDate.toISOString(), 'a', endDate.toISOString());
      
      // Intentar primero con el endpoint de conversaciones
      const response = await this.fetchFromBackend('/v1/conversations', {
        'page[size]': '100',
        'filter[createdAt]': `${startDate.toISOString()},${endDate.toISOString()}`,
        'include': 'assignedTeams,assignedUsers'
      });
      
      let conversations = response.data || [];
      
      // Si no hay datos, intentar sin filtros para debug
      if (conversations.length === 0) {
        console.log('⚠️ No se encontraron conversaciones con filtros, intentando sin filtros...');
        const allResponse = await this.fetchFromBackend('/v1/conversations');
        conversations = allResponse.data || [];
        console.log(`📊 Total de conversaciones sin filtro: ${conversations.length}`);
      }
      
      // También obtener información de equipos y usuarios si es posible
      let teams = [];
      let users = [];
      
      try {
        const teamsResponse = await this.fetchFromBackend('/v1/teams');
        teams = teamsResponse.data || [];
        console.log(`👥 Teams encontrados: ${teams.length}`);
      } catch (e) {
        console.log('⚠️ No se pudieron obtener teams');
      }
      
      try {
        const usersResponse = await this.fetchFromBackend('/v1/users');
        users = usersResponse.data || [];
        console.log(`👤 Users encontrados: ${users.length}`);
      } catch (e) {
        console.log('⚠️ No se pudieron obtener users');
      }
      
      // Transformar datos de Kustomer a CXData
      const metrics = conversations
        .filter(conv => {
          const convDate = new Date(conv.attributes.createdAt);
          return convDate >= startDate && convDate <= endDate;
        })
        .map(conv => {
          // Calcular tiempo de primera respuesta
          let firstResponseTime = 0;
          
          // Opción 1: Usar firstDone.time (en milisegundos)
          if (conv.attributes.firstDone?.time) {
            firstResponseTime = conv.attributes.firstDone.time / (1000 * 60 * 60); // convertir ms a horas
          }
          // Opción 2: Usar firstResponse si existe
          else if (conv.attributes.firstResponse?.createdAt) {
            const created = new Date(conv.attributes.createdAt);
            const firstResp = new Date(conv.attributes.firstResponse.createdAt);
            firstResponseTime = (firstResp.getTime() - created.getTime()) / (1000 * 60 * 60);
          }
          // Opción 3: Usar firstMessageOut
          else if (conv.attributes.firstMessageOut?.sentAt) {
            const created = new Date(conv.attributes.createdAt);
            const firstOut = new Date(conv.attributes.firstMessageOut.sentAt);
            firstResponseTime = (firstOut.getTime() - created.getTime()) / (1000 * 60 * 60);
          }
          
          // Obtener CSAT - en Kustomer parece estar en satisfaction o satisfactionLevel
          let csat = conv.attributes.satisfaction || 0;
          if (csat === 0 && conv.attributes.satisfactionLevel?.answers?.length > 0) {
            // Intentar obtener de satisfactionLevel si existe
            const lastAnswer = conv.attributes.satisfactionLevel.answers[conv.attributes.satisfactionLevel.answers.length - 1];
            csat = lastAnswer?.rating || 0;
          }
          
          // Obtener equipo - primero intentar con los teams asignados
          let team = 'General';
          let teamId = '';
          
          if (conv.attributes.assignedTeams && conv.attributes.assignedTeams.length > 0) {
            teamId = conv.attributes.assignedTeams[0];
          } else if (conv.attributes.firstDone?.createdByTeams?.length > 0) {
            teamId = conv.attributes.firstDone.createdByTeams[0];
          } else if (conv.attributes.lastDone?.createdByTeams?.length > 0) {
            teamId = conv.attributes.lastDone.createdByTeams[0];
          }
          
          // Buscar el nombre del equipo
          if (teamId && teams.length > 0) {
            const teamObj = teams.find(t => t.id === teamId);
            team = teamObj?.attributes?.displayName || teamObj?.attributes?.name || 'General';
          }
          
          // Obtener agente - similar a equipos
          let agent = 'Sin asignar';
          let userId = '';
          
          if (conv.attributes.assignedUsers && conv.attributes.assignedUsers.length > 0) {
            userId = conv.attributes.assignedUsers[0];
          } else if (conv.attributes.firstDone?.createdBy) {
            userId = conv.attributes.firstDone.createdBy;
          } else if (conv.attributes.lastDone?.createdBy) {
            userId = conv.attributes.lastDone.createdBy;
          }
          
          // Buscar el nombre del usuario
          if (userId && users.length > 0) {
            const userObj = users.find(u => u.id === userId);
            agent = userObj?.attributes?.displayName || userObj?.attributes?.name || userObj?.attributes?.email || 'Sin asignar';
          }
          
          // Canal de la conversación
          const channel = conv.attributes.channels?.[0] || 'email';
          
          return {
            date: conv.attributes.createdAt.split('T')[0],
            team,
            queue: channel.charAt(0).toUpperCase() + channel.slice(1),
            agent,
            firstResponseTime: firstResponseTime || 0,
            csat: csat || 0,
            contactRate: conv.attributes.messageCount || 1
          };
        });
      
      console.log(`✅ Se transformaron ${metrics.length} métricas`);
      
      // Si no hay datos, devolver algunos datos de ejemplo
      if (metrics.length === 0) {
        console.log('⚠️ No hay datos reales, devolviendo datos de ejemplo');
        return this.generateSampleData(startDate, endDate);
      }
      
      return metrics;
    } catch (error) {
      console.error('❌ Error al obtener métricas:', error);
      // En caso de error, devolver datos de ejemplo
      return this.generateSampleData(startDate, endDate);
    }
  }

  generateSampleData(startDate, endDate) {
    const data = [];
    const teams = ['Soporte', 'Ventas', 'Billing'];
    const agents = ['Ana García', 'Carlos López', 'María Rodríguez'];
    
    // Generar datos para cada día en el rango
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      for (let i = 0; i < 3; i++) {
        data.push({
          date: currentDate.toISOString().split('T')[0],
          team: teams[Math.floor(Math.random() * teams.length)],
          queue: 'Email',
          agent: agents[Math.floor(Math.random() * agents.length)],
          firstResponseTime: Math.random() * 5,
          csat: 3 + Math.random() * 2,
          contactRate: Math.floor(Math.random() * 10) + 1
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }

  async testConnection() {
    try {
      const response = await this.fetchFromBackend('/v1/users/current');
      console.log('✅ Conexión exitosa:', response);
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  }
}

export const kustomerService = new KustomerService();
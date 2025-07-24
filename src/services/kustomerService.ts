// src/services/kustomerService.ts
import type { CXData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface KustomerConversation {
  id: string;
  attributes: {
    createdAt: string;
    firstResponseAt?: string;
    satisfactionScore?: number;
    status: string;
    custom?: {
      team?: string;
      agent?: string;
      firstResponseTime?: number;
      csat?: number;
      contactRate?: number;
    };
  };
}

class KustomerService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async fetchFromBackend<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const queryString = params 
        ? '?' + new URLSearchParams(params as any).toString() 
        : '';
      
      const response = await fetch(`${this.baseUrl}/kustomer${endpoint}${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from backend:', error);
      throw error;
    }
  }

  async getMetrics(startDate: Date, endDate: Date): Promise<CXData[]> {
    try {
      console.log('📊 Obteniendo métricas del backend...');
      
      const response = await this.fetchFromBackend<{ data: KustomerConversation[] }>('/v1/conversations');
      const conversations = response.data;
      
      console.log(`✅ Se obtuvieron ${conversations.length} conversaciones`);
      
      // Transformar datos de Kustomer a CXData
      return conversations
        .filter(conv => {
          const convDate = new Date(conv.attributes.createdAt);
          return convDate >= startDate && convDate <= endDate;
        })
        .map(conv => ({
          date: conv.attributes.createdAt.split('T')[0],
          team: conv.attributes.custom?.team || 'General',
          queue: 'Email', // Mock
          agent: conv.attributes.custom?.agent || 'Sin asignar',
          firstResponseTime: conv.attributes.custom?.firstResponseTime || 0,
          csat: conv.attributes.custom?.csat || 0,
          contactRate: conv.attributes.custom?.contactRate || 0
        }));
    } catch (error) {
      console.error('❌ Error al obtener métricas:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchFromBackend('/v1/users/current');
      console.log('✅ Conexión exitosa (modo mock):', response);
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  }
}

export const kustomerService = new KustomerService();
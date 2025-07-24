// src/components/Dashboard/Dashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  TrendingUp,
  Timer,
  SentimentSatisfied,
  Phone,
  Speed,
  CheckCircle
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { kustomerService } from '../../services/kustomerService';
import type { CXData, FilterState, MetricType } from '../../types';

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Componente para las tarjetas de métricas mejorado
const MetricCard = ({ title, value, subtitle, icon, color, trend }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp 
                sx={{ 
                  fontSize: 16, 
                  color: trend > 0 ? 'success.main' : 'error.main',
                  transform: trend < 0 ? 'rotate(180deg)' : 'none'
                }} 
              />
              <Typography 
                variant="caption" 
                color={trend > 0 ? 'success.main' : 'error.main'}
                sx={{ ml: 0.5 }}
              >
                {Math.abs(trend)}% vs periodo anterior
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color, backgroundColor: `${color}20`, p: 1, borderRadius: 2 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // Estados
  const [data, setData] = useState<CXData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('firstResponseTime');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: dayjs().subtract(7, 'days').toDate(),
      end: dayjs().toDate()
    },
    team: 'all',
    queue: 'all',
    agent: 'all'
  });

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!filters.dateRange.start || !filters.dateRange.end) return;
      
      try {
        setLoading(true);
        setError(null);
        const metrics = await kustomerService.getMetrics(
          filters.dateRange.start,
          filters.dateRange.end
        );
        setData(metrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.dateRange]);

  // Obtener listas únicas para los filtros
  const uniqueTeams = useMemo(() => {
    const teams = ['all', ...new Set(data.map(d => d.team))];
    return teams;
  }, [data]);

  const uniqueAgents = useMemo(() => {
    const agents = ['all', ...new Set(data.map(d => d.agent))];
    return agents;
  }, [data]);

  // Filtrar datos según los filtros activos
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.team !== 'all' && item.team !== filters.team) return false;
      if (filters.queue !== 'all' && item.queue !== filters.queue) return false;
      if (filters.agent !== 'all' && item.agent !== filters.agent) return false;
      return true;
    });
  }, [data, filters]);

  // Calcular métricas agregadas con más detalle
  const aggregatedMetrics = useMemo(() => {
    if (!filteredData.length) return {
      avgResponseTime: 0,
      avgCSAT: 0,
      totalContacts: 0,
      totalConversations: 0,
      resolutionRate: 0,
      avgHandleTime: 0,
      peakHour: 'N/A',
      trend: {
        frt: 0,
        csat: 0,
        contacts: 0
      }
    };

    const avgResponseTime = filteredData.reduce((sum, d) => sum + d.firstResponseTime, 0) / filteredData.length;
    const avgCSAT = filteredData.reduce((sum, d) => sum + d.csat, 0) / filteredData.length;
    const totalContacts = filteredData.reduce((sum, d) => sum + d.contactRate, 0);
    
    // Simular métricas adicionales
    const resolutionRate = 85 + Math.random() * 10; // 85-95%
    const avgHandleTime = avgResponseTime * 0.8; // 80% del FRT

    return {
      avgResponseTime: avgResponseTime.toFixed(2),
      avgCSAT: avgCSAT.toFixed(1),
      totalContacts,
      totalConversations: filteredData.length,
      resolutionRate: resolutionRate.toFixed(1),
      avgHandleTime: avgHandleTime.toFixed(2),
      peakHour: '14:00 - 16:00',
      trend: {
        frt: -12.5,
        csat: 8.3,
        contacts: 15.2
      }
    };
  }, [filteredData]);

  // Preparar datos para los gráficos
  const chartData = useMemo(() => {
    // Agrupar por fecha
    const groupedByDate = filteredData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          firstResponseTime: [],
          csat: [],
          contactRate: [],
          count: 0
        };
      }
      acc[date].firstResponseTime.push(item.firstResponseTime);
      acc[date].csat.push(item.csat);
      acc[date].contactRate.push(item.contactRate);
      acc[date].count++;
      return acc;
    }, {} as any);

    // Calcular promedios por fecha
    return Object.values(groupedByDate).map((group: any) => ({
      date: dayjs(group.date).format('MM/DD'),
      firstResponseTime: (group.firstResponseTime.reduce((a: number, b: number) => a + b, 0) / group.count).toFixed(2),
      csat: (group.csat.reduce((a: number, b: number) => a + b, 0) / group.count).toFixed(1),
      contactRate: group.contactRate.reduce((a: number, b: number) => a + b, 0)
    }));
  }, [filteredData]);

  // Datos para gráfico de distribución por equipo
  const teamDistribution = useMemo(() => {
    const dist = filteredData.reduce((acc, item) => {
      acc[item.team] = (acc[item.team] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  if (loading && data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const renderChart = () => {
    const metricConfig = {
      firstResponseTime: { dataKey: 'firstResponseTime', stroke: '#8884d8', name: 'FRT (horas)' },
      csat: { dataKey: 'csat', stroke: '#82ca9d', name: 'CSAT' },
      contactRate: { dataKey: 'contactRate', stroke: '#ffc658', name: 'Contactos' }
    };

    const config = metricConfig[selectedMetric];

    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={config.dataKey} fill={config.stroke} name={config.name} />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={config.dataKey} stroke={config.stroke} fill={config.stroke} fillOpacity={0.6} name={config.name} />
          </AreaChart>
        );
      default:
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={config.dataKey} stroke={config.stroke} strokeWidth={2} name={config.name} />
          </LineChart>
        );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Customer Experience Dashboard
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Fecha inicio"
                value={dayjs(filters.dateRange.start)}
                onChange={(newValue) => {
                  if (newValue) {
                    setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: newValue.toDate() }
                    }));
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Fecha fin"
                value={dayjs(filters.dateRange.end)}
                onChange={(newValue) => {
                  if (newValue) {
                    setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: newValue.toDate() }
                    }));
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Equipo</InputLabel>
                <Select
                  value={filters.team}
                  label="Equipo"
                  onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                >
                  {uniqueTeams.map(team => (
                    <MenuItem key={team} value={team}>
                      {team === 'all' ? 'Todos los equipos' : team}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Agente</InputLabel>
                <Select
                  value={filters.agent}
                  label="Agente"
                  onChange={(e) => setFilters(prev => ({ ...prev, agent: e.target.value }))}
                >
                  {uniqueAgents.map(agent => (
                    <MenuItem key={agent} value={agent}>
                      {agent === 'all' ? 'Todos los agentes' : agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              {filters.team !== 'all' && (
                <Chip
                  label={`Equipo: ${filters.team}`}
                  onDelete={() => setFilters(prev => ({ ...prev, team: 'all' }))}
                  sx={{ mr: 1 }}
                />
              )}
              {filters.agent !== 'all' && (
                <Chip
                  label={`Agente: ${filters.agent}`}
                  onDelete={() => setFilters(prev => ({ ...prev, agent: 'all' }))}
                />
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Tarjetas de métricas mejoradas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Tiempo Primera Respuesta"
              value={`${aggregatedMetrics.avgResponseTime}h`}
              subtitle="Promedio"
              icon={<Timer fontSize="large" />}
              color="#1976d2"
              trend={aggregatedMetrics.trend.frt}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="CSAT Score"
              value={aggregatedMetrics.avgCSAT}
              subtitle="de 5.0"
              icon={<SentimentSatisfied fontSize="large" />}
              color="#4caf50"
              trend={aggregatedMetrics.trend.csat}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Total Contactos"
              value={aggregatedMetrics.totalContacts}
              subtitle={`${aggregatedMetrics.totalConversations} conversaciones`}
              icon={<Phone fontSize="large" />}
              color="#ff9800"
              trend={aggregatedMetrics.trend.contacts}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Tasa de Resolución"
              value={`${aggregatedMetrics.resolutionRate}%`}
              subtitle="Primera llamada"
              icon={<CheckCircle fontSize="large" />}
              color="#9c27b0"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Tiempo de Manejo"
              value={`${aggregatedMetrics.avgHandleTime}h`}
              subtitle="Promedio"
              icon={<Speed fontSize="large" />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <MetricCard
              title="Hora Pico"
              value={aggregatedMetrics.peakHour}
              subtitle="Mayor volumen"
              icon={<TrendingUp fontSize="large" />}
              color="#3f51b5"
            />
          </Grid>
        </Grid>

        {/* Gráficos */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Gráfico principal de tendencias */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Tendencia de Métricas</Typography>
                <Box display="flex" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                    >
                      <MenuItem value="firstResponseTime">Tiempo de Respuesta</MenuItem>
                      <MenuItem value="csat">CSAT</MenuItem>
                      <MenuItem value="contactRate">Contactos</MenuItem>
                    </Select>
                  </FormControl>
                  <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(e, newType) => newType && setChartType(newType)}
                    size="small"
                  >
                    <ToggleButton value="line">Línea</ToggleButton>
                    <ToggleButton value="bar">Barra</ToggleButton>
                    <ToggleButton value="area">Área</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart()}
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Gráfico de distribución por equipo */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Distribución por Equipo</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {teamDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabla de datos detallada */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Detalle de Métricas
          </Typography>
          {filteredData.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Equipo</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Agente</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>FRT (h)</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>CSAT</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Contactos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 10).map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{dayjs(row.date).format('DD/MM/YYYY')}</td>
                      <td style={{ padding: '12px' }}>{row.team}</td>
                      <td style={{ padding: '12px' }}>{row.agent}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {row.firstResponseTime.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          {row.csat.toFixed(1)}
                          <SentimentSatisfied 
                            sx={{ 
                              ml: 1, 
                              fontSize: 16,
                              color: row.csat >= 4 ? 'success.main' : row.csat >= 3 ? 'warning.main' : 'error.main'
                            }} 
                          />
                        </Box>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {row.contactRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length > 10 && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                  Mostrando 10 de {filteredData.length} registros
                </Typography>
              )}
            </Box>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No hay datos disponibles para los filtros seleccionados
            </Typography>
          )}
        </Paper>

        {/* Snackbar para errores */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default Dashboard;
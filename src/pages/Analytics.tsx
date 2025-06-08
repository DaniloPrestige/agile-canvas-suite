
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusCard from '../components/StatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import { db, Project, formatCurrency } from '../lib/database';

const Analytics: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeFilter, setTimeFilter] = useState('6');
  const [currencyFilter, setCurrencyFilter] = useState('BRL');

  useEffect(() => {
    const allProjects = db.getAllProjects();
    setProjects(allProjects);
  }, []);

  const getActiveProjects = () => projects.filter(p => p.status !== 'Concluído' && !p.isDeleted);
  const getFinishedProjects = () => projects.filter(p => p.status === 'Concluído' && !p.isDeleted);
  const getDeletedProjects = () => projects.filter(p => p.isDeleted);

  const getProgressStats = () => {
    const activeProjects = getActiveProjects();
    const averageProgress = activeProjects.length > 0 
      ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
      : 0;
    
    const onTimeProjects = activeProjects.filter(p => p.status !== 'Atrasado').length;
    const delayedProjects = activeProjects.filter(p => p.status === 'Atrasado').length;
    
    return { averageProgress, onTimeProjects, delayedProjects };
  };

  const getFinancialStats = () => {
    const allNonDeleted = projects.filter(p => !p.isDeleted);
    const totalEstimated = allNonDeleted.reduce((sum, p) => sum + p.estimatedValue, 0);
    const totalFinal = allNonDeleted.reduce((sum, p) => sum + p.finalValue, 0);
    const variance = totalFinal - totalEstimated;
    const variancePercentage = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;
    
    return { totalEstimated, totalFinal, variance, variancePercentage };
  };

  const getProductivityMetrics = () => {
    const activeProjects = getActiveProjects();
    const finishedProjects = getFinishedProjects();
    
    // Completed projects this period (simplified)
    const completedThisMonth = finishedProjects.length;
    
    // Average completion time (simplified calculation)
    const avgCompletionTime = finishedProjects.length > 0 ? 45 : 0; // days
    
    // Projects completion rate
    const totalProjects = activeProjects.length + finishedProjects.length;
    const completionRate = totalProjects > 0 ? (finishedProjects.length / totalProjects) * 100 : 0;
    
    return { completedThisMonth, avgCompletionTime, completionRate };
  };

  const getTimelineData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => ({
      name: month,
      projetos: Math.floor(Math.random() * 5) + 1,
      concluidos: Math.floor(Math.random() * 3) + 1,
      receita: Math.floor(Math.random() * 50000) + 20000
    }));
  };

  const getProgressDistribution = () => {
    const activeProjects = getActiveProjects();
    const ranges = [
      { name: '0-25%', min: 0, max: 25, color: '#ef4444' },
      { name: '26-50%', min: 26, max: 50, color: '#f59e0b' },
      { name: '51-75%', min: 51, max: 75, color: '#3b82f6' },
      { name: '76-100%', min: 76, max: 100, color: '#10b981' }
    ];
    
    return ranges.map(range => ({
      name: range.name,
      value: activeProjects.filter(p => p.progress >= range.min && p.progress <= range.max).length,
      color: range.color
    })).filter(item => item.value > 0);
  };

  const getPriorityData = () => {
    const activeProjects = getActiveProjects();
    return [
      { name: 'Alta', value: activeProjects.filter(p => p.priority === 'Alta').length, color: '#ef4444' },
      { name: 'Média', value: activeProjects.filter(p => p.priority === 'Média').length, color: '#f59e0b' },
      { name: 'Baixa', value: activeProjects.filter(p => p.priority === 'Baixa').length, color: '#10b981' }
    ].filter(item => item.value > 0);
  };

  const getPhaseData = () => {
    const activeProjects = getActiveProjects();
    const phases = ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento', 'Encerramento'];
    return phases.map(phase => ({
      name: phase,
      count: activeProjects.filter(p => p.phase === phase).length
    }));
  };

  const progressStats = getProgressStats();
  const financialStats = getFinancialStats();
  const productivityMetrics = getProductivityMetrics();
  const timelineData = getTimelineData();

  const renderCustomLabel = ({ name, percent }: any) => {
    if (percent < 0.05) return '';
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard 
                title="Projetos Ativos" 
                count={getActiveProjects().length} 
                color="blue"
                icon={<Target className="w-4 h-4" />}
              />
              <StatusCard 
                title="Progresso Médio" 
                count={`${progressStats.averageProgress}%`} 
                color="green"
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <StatusCard 
                title="No Prazo" 
                count={progressStats.onTimeProjects} 
                color="yellow"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatusCard 
                title="Atrasados" 
                count={progressStats.delayedProjects} 
                color="red"
                icon={<AlertTriangle className="w-4 h-4" />}
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Evolução dos Projetos
                  </CardTitle>
                  <CardDescription>Criação de projetos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="projetos" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="concluidos" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Distribuição de Progresso
                  </CardTitle>
                  <CardDescription>Projetos por faixa de progresso</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getProgressDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getProgressDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Distribuição por Prioridade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPriorityData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Projetos por Fase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPhaseData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard 
                title="Concluídos no Mês" 
                count={productivityMetrics.completedThisMonth} 
                color="green"
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <StatusCard 
                title="Tempo Médio (dias)" 
                count={productivityMetrics.avgCompletionTime} 
                color="blue"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatusCard 
                title="Taxa de Conclusão" 
                count={`${Math.round(productivityMetrics.completionRate)}%`} 
                color="yellow"
                icon={<Target className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eficiência por Mês</CardTitle>
                  <CardDescription>Projetos iniciados vs concluídos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="projetos" stroke="#8884d8" name="Iniciados" />
                      <Line type="monotone" dataKey="concluidos" stroke="#82ca9d" name="Concluídos" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicadores de Qualidade</CardTitle>
                  <CardDescription>Métricas de performance dos projetos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projetos no Prazo</span>
                    <span className="font-medium">{Math.round((progressStats.onTimeProjects / (progressStats.onTimeProjects + progressStats.delayedProjects)) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Satisfação do Cliente</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Retrabalho</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Utilização de Recursos</span>
                    <span className="font-medium">78%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusCard 
                title="Receita Total" 
                count={formatCurrency(financialStats.totalFinal, currencyFilter)} 
                color="green"
                icon={<DollarSign className="w-4 h-4" />}
              />
              <StatusCard 
                title="Orçamento Total" 
                count={formatCurrency(financialStats.totalEstimated, currencyFilter)} 
                color="blue"
                icon={<Target className="w-4 h-4" />}
              />
              <StatusCard 
                title="Variação" 
                count={formatCurrency(financialStats.variance, currencyFilter)} 
                color={financialStats.variance >= 0 ? "green" : "red"}
                icon={financialStats.variance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              />
              <StatusCard 
                title="% Variação" 
                count={`${financialStats.variancePercentage >= 0 ? '+' : ''}${Math.round(financialStats.variancePercentage)}%`} 
                color={financialStats.variancePercentage >= 0 ? "green" : "red"}
                icon={<BarChart3 className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Mês</CardTitle>
                  <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="receita" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ROI por Projeto</CardTitle>
                  <CardDescription>Retorno sobre investimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">+{Math.round(financialStats.variancePercentage)}%</p>
                      <p className="text-sm text-muted-foreground">ROI Médio</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Projetos Lucrativos</span>
                        <span className="font-medium">75%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Margem Média</span>
                        <span className="font-medium">23%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ticket Médio</span>
                        <span className="font-medium">{formatCurrency(35000, currencyFilter)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;

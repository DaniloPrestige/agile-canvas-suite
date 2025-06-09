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
  Zap,
  Timer,
  Award,
  Gauge,
  Percent,
  FileText,
  MessageSquare,
  ListTodo,
  Briefcase,
  Shield,
  Star,
  TrendingUpIcon,
  Flag
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

  const getAdvancedMetrics = () => {
    const allProjects = projects.filter(p => !p.isDeleted);
    const activeProjects = getActiveProjects();
    const finishedProjects = getFinishedProjects();
    
    // Client satisfaction simulation
    const clientSatisfaction = 87;
    
    // Resource utilization
    const resourceUtilization = 78;
    
    // Budget adherence
    const budgetAdherence = allProjects.length > 0 ? 
      Math.round((allProjects.filter(p => p.finalValue <= p.estimatedValue).length / allProjects.length) * 100) : 0;
    
    // Quality index
    const qualityIndex = 85;
    
    // Team efficiency
    const teamEfficiency = activeProjects.length > 0 ? 
      Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length) : 0;
    
    // Risk factor
    const riskFactor = activeProjects.filter(p => p.priority === 'Alta' && p.progress < 50).length;
    
    // Productivity metrics
    const avgCompletionTime = finishedProjects.length > 0 ? 45 : 0;
    const completedThisMonth = finishedProjects.length;
    const totalProjects = activeProjects.length + finishedProjects.length;
    const completionRate = totalProjects > 0 ? (finishedProjects.length / totalProjects) * 100 : 0;
    
    return {
      clientSatisfaction,
      resourceUtilization,
      budgetAdherence,
      qualityIndex,
      teamEfficiency,
      riskFactor,
      avgCompletionTime,
      completedThisMonth,
      completionRate
    };
  };

  const getTimelineData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => ({
      name: month,
      projetos: Math.floor(Math.random() * 8) + 2,
      concluidos: Math.floor(Math.random() * 5) + 1,
      receita: Math.floor(Math.random() * 80000) + 30000,
      eficiencia: Math.floor(Math.random() * 20) + 75,
      satisfacao: Math.floor(Math.random() * 15) + 82,
      qualidade: Math.floor(Math.random() * 10) + 85,
      produtividade: Math.floor(Math.random() * 25) + 70
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
  const advancedMetrics = getAdvancedMetrics();
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="quality">Qualidade</TabsTrigger>
            <TabsTrigger value="strategic">Estratégico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Primary KPIs */}
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
                icon={<Gauge className="w-4 h-4" />}
              />
              <StatusCard 
                title="No Prazo" 
                count={progressStats.onTimeProjects} 
                color="yellow"
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <StatusCard 
                title="Atrasados" 
                count={progressStats.delayedProjects} 
                color="red"
                icon={<AlertTriangle className="w-4 h-4" />}
              />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <StatusCard 
                title="Taxa de Sucesso" 
                count="92%" 
                color="green"
                icon={<Award className="w-4 h-4" />}
              />
              <StatusCard 
                title="Eficiência da Equipe" 
                count={`${advancedMetrics.teamEfficiency}%`} 
                color="blue"
                icon={<Users className="w-4 h-4" />}
              />
              <StatusCard 
                title="Satisfação Cliente" 
                count={`${advancedMetrics.clientSatisfaction}%`} 
                color="green"
                icon={<Star className="w-4 h-4" />}
              />
              <StatusCard 
                title="Índice Qualidade" 
                count={`${advancedMetrics.qualityIndex}%`} 
                color="purple"
                icon={<Shield className="w-4 h-4" />}
              />
              <StatusCard 
                title="Utilização Recursos" 
                count={`${advancedMetrics.resourceUtilization}%`} 
                color="blue"
                icon={<Timer className="w-4 h-4" />}
              />
              <StatusCard 
                title="Projetos Alto Risco" 
                count={advancedMetrics.riskFactor} 
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
                  <CardDescription>Criação e conclusão de projetos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="projetos" stackId="1" stroke="#8884d8" fill="#8884d8" name="Iniciados" />
                      <Area type="monotone" dataKey="concluidos" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Concluídos" />
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
                  <CardDescription>Projetos ativos por faixa de progresso</CardDescription>
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
                    <Flag className="w-5 h-5" />
                    Análise por Prioridade
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
                    <Briefcase className="w-5 h-5" />
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
            {/* Performance Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusCard 
                title="Projetos Concluídos" 
                count={advancedMetrics.completedThisMonth} 
                color="green"
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <StatusCard 
                title="Tempo Médio (dias)" 
                count={advancedMetrics.avgCompletionTime} 
                color="blue"
                icon={<Timer className="w-4 h-4" />}
              />
              <StatusCard 
                title="Taxa de Conclusão" 
                count={`${Math.round(advancedMetrics.completionRate)}%`} 
                color="yellow"
                icon={<Percent className="w-4 h-4" />}
              />
              <StatusCard 
                title="Velocity Score" 
                count="8.2/10" 
                color="purple"
                icon={<TrendingUpIcon className="w-4 h-4" />}
              />
            </div>

            {/* Performance Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard 
                title="Burn Rate" 
                count="1.2x" 
                color="yellow"
                icon={<Activity className="w-4 h-4" />}
              />
              <StatusCard 
                title="Sprint Completion" 
                count="94%" 
                color="green"
                icon={<Target className="w-4 h-4" />}
              />
              <StatusCard 
                title="Story Points/Dia" 
                count="12.5" 
                color="blue"
                icon={<BarChart3 className="w-4 h-4" />}
              />
              <StatusCard 
                title="Lead Time" 
                count="8.5 dias" 
                color="purple"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatusCard 
                title="Throughput" 
                count="15/mês" 
                color="green"
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Performance</CardTitle>
                  <CardDescription>Métricas de eficiência ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="eficiencia" stroke="#8884d8" name="Eficiência %" />
                      <Line type="monotone" dataKey="produtividade" stroke="#82ca9d" name="Produtividade %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas Ágeis</CardTitle>
                  <CardDescription>Indicadores de metodologia ágil</CardDescription>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusCard 
                title="Receita Total" 
                count={formatCurrency(financialStats.totalFinal, currencyFilter as "BRL" | "USD" | "EUR")} 
                color="green"
                icon={<DollarSign className="w-4 h-4" />}
              />
              <StatusCard 
                title="Orçamento Total" 
                count={formatCurrency(financialStats.totalEstimated, currencyFilter as "BRL" | "USD" | "EUR")} 
                color="blue"
                icon={<Target className="w-4 h-4" />}
              />
              <StatusCard 
                title="Variação" 
                count={formatCurrency(financialStats.variance, currencyFilter as "BRL" | "USD" | "EUR")} 
                color={financialStats.variance >= 0 ? "green" : "red"}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <StatusCard 
                title="% Variação" 
                count={`${financialStats.variancePercentage >= 0 ? '+' : ''}${Math.round(financialStats.variancePercentage)}%`} 
                color={financialStats.variancePercentage >= 0 ? "green" : "red"}
                icon={<Percent className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <StatusCard 
                title="EBITDA" 
                count="28%" 
                color="green"
                icon={<DollarSign className="w-4 h-4" />}
              />
              <StatusCard 
                title="Margem Líquida" 
                count="15%" 
                color="blue"
                icon={<Percent className="w-4 h-4" />}
              />
              <StatusCard 
                title="Fluxo de Caixa" 
                count={formatCurrency(125000, currencyFilter as "BRL" | "USD" | "EUR")} 
                color="green"
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <StatusCard 
                title="ROI Médio" 
                count="+24%" 
                color="green"
                icon={<Award className="w-4 h-4" />}
              />
              <StatusCard 
                title="Payback" 
                count="18 meses" 
                color="yellow"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatusCard 
                title="NPV" 
                count={formatCurrency(89000, currencyFilter as "BRL" | "USD" | "EUR")} 
                color="purple"
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Receita</CardTitle>
                  <CardDescription>Receita e lucratividade ao longo do tempo</CardDescription>
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
                  <CardTitle>Análise de Lucratividade</CardTitle>
                  <CardDescription>Indicadores financeiros chave</CardDescription>
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
                        <span className="text-sm">Margem Bruta</span>
                        <span className="font-medium">38%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ticket Médio</span>
                        <span className="font-medium">{formatCurrency(35000, currencyFilter as "BRL" | "USD" | "EUR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Break-even</span>
                        <span className="font-medium">18 meses</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusCard 
                title="Índice de Qualidade" 
                count={`${advancedMetrics.qualityIndex}%`} 
                color="green"
                icon={<Award className="w-4 h-4" />}
              />
              <StatusCard 
                title="Satisfação do Cliente" 
                count={`${advancedMetrics.clientSatisfaction}%`} 
                color="blue"
                icon={<Star className="w-4 h-4" />}
              />
              <StatusCard 
                title="Taxa de Defeitos" 
                count="2.1%" 
                color="yellow"
                icon={<AlertTriangle className="w-4 h-4" />}
              />
              <StatusCard 
                title="Conformidade" 
                count="97%" 
                color="green"
                icon={<Shield className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <StatusCard 
                title="Code Coverage" 
                count="89%" 
                color="green"
                icon={<FileText className="w-4 h-4" />}
              />
              <StatusCard 
                title="Bugs/Sprint" 
                count="3.2" 
                color="yellow"
                icon={<AlertTriangle className="w-4 h-4" />}
              />
              <StatusCard 
                title="Testes Automáticos" 
                count="94%" 
                color="green"
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <StatusCard 
                title="First Time Right" 
                count="87%" 
                color="blue"
                icon={<Target className="w-4 h-4" />}
              />
              <StatusCard 
                title="SLA Compliance" 
                count="99.2%" 
                color="green"
                icon={<Shield className="w-4 h-4" />}
              />
              <StatusCard 
                title="Customer Effort" 
                count="4.2/5" 
                color="purple"
                icon={<Star className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Qualidade</CardTitle>
                  <CardDescription>Métricas de qualidade ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="satisfacao" stroke="#82ca9d" name="Satisfação %" />
                      <Line type="monotone" dataKey="qualidade" stroke="#8884d8" name="Qualidade %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas Detalhadas</CardTitle>
                  <CardDescription>Indicadores específicos de qualidade</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net Promoter Score</span>
                    <span className="font-medium">72</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Resolution Time</span>
                    <span className="font-medium">4.5h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="font-medium">0.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Documentation Coverage</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Technical Debt Ratio</span>
                    <span className="font-medium">12%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strategic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusCard 
                title="Market Share" 
                count="12.5%" 
                color="blue"
                icon={<BarChart3 className="w-4 h-4" />}
              />
              <StatusCard 
                title="Innovation Index" 
                count="78%" 
                color="purple"
                icon={<Zap className="w-4 h-4" />}
              />
              <StatusCard 
                title="Competitive Advantage" 
                count="High" 
                color="green"
                icon={<Award className="w-4 h-4" />}
              />
              <StatusCard 
                title="Strategic Alignment" 
                count="92%" 
                color="green"
                icon={<Target className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Balanced Scorecard</CardTitle>
                  <CardDescription>Perspectivas estratégicas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Financeira</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Clientes</span>
                    <span className="font-medium text-blue-600">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Processos Internos</span>
                    <span className="font-medium text-yellow-600">82%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aprendizado</span>
                    <span className="font-medium text-purple-600">76%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>KPIs Estratégicos</CardTitle>
                  <CardDescription>Indicadores de longo prazo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Growth Rate</span>
                    <span className="font-medium">+23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Customer Retention</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Employee Satisfaction</span>
                    <span className="font-medium">86%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Digital Transformation</span>
                    <span className="font-medium">72%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                  <CardDescription>Gestão de riscos estratégicos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Risk Score</span>
                    <span className="font-medium text-yellow-600">Medium</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Compliance Rate</span>
                    <span className="font-medium">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Incident Response</span>
                    <span className="font-medium">2.5h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Business Continuity</span>
                    <span className="font-medium">95%</span>
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

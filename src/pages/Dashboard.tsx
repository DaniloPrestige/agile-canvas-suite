import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusCard from '../components/StatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { db, Project, formatCurrency } from '../lib/database';

const Dashboard: React.FC = () => {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [finishedProjects, setFinishedProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const all = db.getAllProjects();
    const active = all.filter(p => p.status !== 'Concluída' && !p.isDeleted);
    const finished = all.filter(p => p.status === 'Concluída' && !p.isDeleted);
    const deleted = all.filter(p => p.isDeleted);

    setActiveProjects(active);
    setFinishedProjects(finished);
    setDeletedProjects(deleted);
    setAllProjects(all);
  }, []);

  const getStats = (projects: Project[]) => {
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === 'Em Progresso').length;
    const pending = projects.filter(p => p.status === 'Pendente').length;
    const delayed = projects.filter(p => p.status === 'Atrasado').length;
    const completed = projects.filter(p => p.status === 'Concluída').length;

    return { total, inProgress, pending, delayed, completed };
  };

  const getFinancialData = (projects: Project[]) => {
    const totalEstimated = projects.reduce((sum, p) => sum + p.estimatedValue, 0);
    const totalFinal = projects.reduce((sum, p) => sum + p.finalValue, 0);
    return { totalEstimated, totalFinal };
  };

  const getKPIs = () => {
    const totalProjects = activeProjects.length + finishedProjects.length;
    const completionRate = totalProjects > 0 ? (finishedProjects.length / totalProjects) * 100 : 0;
    const averageProgress = activeProjects.length > 0 
      ? activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length 
      : 0;
    const onTimeProjects = activeProjects.filter(p => p.status !== 'Atrasado').length;
    const delayedProjects = activeProjects.filter(p => p.status === 'Atrasado').length;
    const onTimeRate = activeProjects.length > 0 ? (onTimeProjects / activeProjects.length) * 100 : 0;

    return {
      completionRate,
      averageProgress,
      onTimeProjects,
      delayedProjects,
      onTimeRate
    };
  };

  const getResourceUtilization = () => {
    const totalCapacity = 100;
    const utilized = activeProjects.length * 20;
    const utilization = Math.min((utilized / totalCapacity) * 100, 100);
    
    return {
      utilization,
      activeResources: activeProjects.length,
      totalCapacity: 5
    };
  };

  const getPriorityData = (projects: Project[]) => {
    const alta = projects.filter(p => p.priority === 'Alta').length;
    const media = projects.filter(p => p.priority === 'Média').length;
    const baixa = projects.filter(p => p.priority === 'Baixa').length;
    
    return [
      { name: 'Alta', value: alta, color: '#ef4444' },
      { name: 'Média', value: media, color: '#f59e0b' },
      { name: 'Baixa', value: baixa, color: '#10b981' }
    ].filter(item => item.value > 0);
  };

  const getPhaseData = (projects: Project[]) => {
    const phases = ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento', 'Encerramento'];
    return phases.map(phase => ({
      name: phase,
      count: projects.filter(p => p.phase === phase).length
    }));
  };

  // Check if we have enough data for timeline charts
  const hasEnoughDataForTimeline = () => {
    if (allProjects.length < 5) return false;
    
    const projectDates = allProjects.map(p => new Date(p.createdAt));
    const uniqueMonths = new Set(projectDates.map(date => `${date.getFullYear()}-${date.getMonth()}`));
    return uniqueMonths.size >= 3;
  };

  const hasEnoughDataForWeeklyTrend = () => {
    if (allProjects.length < 10) return false;
    
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
    const recentProjects = allProjects.filter(p => new Date(p.createdAt) >= fourWeeksAgo);
    return recentProjects.length >= 8;
  };

  const activeStats = getStats(activeProjects);
  const finishedStats = getStats(finishedProjects);
  const deletedStats = getStats(deletedProjects);

  const activeFinancial = getFinancialData(activeProjects);
  const finishedFinancial = getFinancialData(finishedProjects);

  const kpis = getKPIs();
  const resourceUtilization = getResourceUtilization();

  const renderCustomLabel = ({ name, percent }: any) => {
    if (percent < 0.05) return '';
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              Projetos Ativos
            </TabsTrigger>
            <TabsTrigger value="finished" className="flex items-center gap-2">
              Projetos Finalizados
            </TabsTrigger>
            <TabsTrigger value="deleted" className="flex items-center gap-2">
              Projetos Excluídos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <StatusCard 
                title="Total" 
                count={activeProjects.length} 
                color="blue"
              />
              <StatusCard 
                title="Em Progresso" 
                count={activeStats.inProgress} 
                color="yellow"
              />
              <StatusCard 
                title="Pendentes" 
                count={activeStats.pending} 
                color="gray"
              />
              <StatusCard 
                title="Atrasados" 
                count={activeStats.delayed} 
                color="red"
              />
              <StatusCard 
                title="No Prazo" 
                count={`${Math.round(kpis.onTimeRate)}%`} 
                color="green"
              />
              <StatusCard 
                title="Utilização" 
                count={`${Math.round(resourceUtilization.utilization)}%`} 
                color="purple"
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(kpis.completionRate)}%</div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowUpRight className="inline h-3 w-3" />
                    +2.5% desde o mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(kpis.averageProgress)}%</div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowUpRight className="inline h-3 w-3" />
                    +5.2% desde a semana passada
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Velocidade</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4</div>
                  <p className="text-xs text-muted-foreground">projetos/mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Qualidade</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowDownRight className="inline h-3 w-3" />
                    -1.2% retrabalho
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Distribuição por Prioridade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getPriorityData(activeProjects).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPriorityData(activeProjects)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPriorityData(activeProjects).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum projeto ativo para exibir</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Projetos por Fase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeProjects.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getPhaseData(activeProjects)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum projeto ativo para exibir</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conditional Timeline Charts - Only show if we have enough data */}
            {!hasEnoughDataForTimeline() && !hasEnoughDataForWeeklyTrend() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Análises Temporais
                  </CardTitle>
                  <CardDescription>Gráficos de tendência e produtividade</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Dados insuficientes para análise temporal</p>
                      <p className="text-sm">
                        Para ver gráficos de tendência e produtividade, você precisa de:
                      </p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>• Pelo menos 5 projetos para análise mensal</li>
                        <li>• Pelo menos 10 projetos para análise semanal</li>
                        <li>• Projetos distribuídos em diferentes períodos</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial and Resource Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Resumo Financeiro
                  </CardTitle>
                  <CardDescription>Valores dos projetos ativos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
                    <p className="text-2xl font-bold">{formatCurrency(activeFinancial.totalEstimated, 'BRL')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total Final</p>
                    <p className="text-2xl font-bold">{formatCurrency(activeFinancial.totalFinal, 'BRL')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margem Estimada</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(activeFinancial.totalFinal - activeFinancial.totalEstimated, 'BRL')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Utilização de Recursos
                  </CardTitle>
                  <CardDescription>Status da capacidade da equipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Recursos Ativos</p>
                    <p className="text-2xl font-bold">{resourceUtilization.activeResources}/{resourceUtilization.totalCapacity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Utilização</p>
                    <p className="text-2xl font-bold">{Math.round(resourceUtilization.utilization)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidade Disponível</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {Math.max(0, 100 - resourceUtilization.utilization).toFixed(0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finished" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard title="Total Finalizados" count={finishedProjects.length} color="green" />
              <StatusCard title="Em Progresso" count={finishedStats.inProgress} color="yellow" />
              <StatusCard title="Pendentes" count={finishedStats.pending} color="gray" />
              <StatusCard title="Atrasados" count={finishedStats.delayed} color="red" />
              <StatusCard title="Concluídos" count={finishedStats.completed} color="green" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Distribuição por Prioridade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getPriorityData(finishedProjects).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPriorityData(finishedProjects)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPriorityData(finishedProjects).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum projeto finalizado para exibir</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Resumo Financeiro
                  </CardTitle>
                  <CardDescription>Valores dos projetos finalizados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
                    <p className="text-2xl font-bold">{formatCurrency(finishedFinancial.totalEstimated, 'BRL')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total Final</p>
                    <p className="text-2xl font-bold">{formatCurrency(finishedFinancial.totalFinal, 'BRL')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deleted" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard title="Total Excluídos" count={deletedProjects.length} color="red" />
              <StatusCard title="Em Progresso" count={deletedStats.inProgress} color="yellow" />
              <StatusCard title="Pendentes" count={deletedStats.pending} color="gray" />
              <StatusCard title="Atrasados" count={deletedStats.delayed} color="red" />
              <StatusCard title="Concluídos" count={deletedStats.completed} color="green" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Projetos Excluídos
                </CardTitle>
                <CardDescription>Análise dos projetos que foram excluídos</CardDescription>
              </CardHeader>
              <CardContent>
                {deletedProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum projeto excluído</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPriorityData(deletedProjects)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPriorityData(deletedProjects).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;

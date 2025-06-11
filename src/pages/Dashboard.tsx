
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusCard from '../components/StatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Award
} from 'lucide-react';
import { db, Project, formatCurrency } from '../lib/database';
import { Progress } from '@/components/ui/progress';

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

  const calculateOverallProgress = () => {
    if (activeProjects.length === 0) return 0;
    
    const totalProgress = activeProjects.reduce((sum, project) => {
      const tasks = db.getProjectTasks(project.id);
      const completedTasks = tasks.filter(task => task.status === 'Concluída').length;
      const projectProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      return sum + projectProgress;
    }, 0);
    
    return Math.round(totalProgress / activeProjects.length);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'from-red-400 via-red-500 to-red-600';
    if (progress < 70) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    return 'from-green-400 via-green-500 to-green-600';
  };

  // Métricas calculadas
  const totalValue = allProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
  const completedValue = finishedProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
  const avgProjectDuration = () => {
    const projectsWithDates = finishedProjects.filter(p => p.startDate && p.endDate);
    if (projectsWithDates.length === 0) return 0;
    
    const totalDays = projectsWithDates.reduce((sum, p) => {
      const start = new Date(p.startDate!);
      const end = new Date(p.endDate!);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / projectsWithDates.length);
  };

  const overdueProjects = activeProjects.filter(p => {
    if (!p.endDate) return false;
    const endDate = new Date(p.endDate);
    const today = new Date();
    return endDate < today;
  }).length;

  const tasksData = activeProjects.map(project => {
    const tasks = db.getProjectTasks(project.id);
    const completed = tasks.filter(t => t.status === 'Concluída').length;
    return {
      name: project.name.substring(0, 10) + '...',
      completed,
      pending: tasks.length - completed,
      total: tasks.length
    };
  });

  const statusData = [
    { name: 'Em Progresso', value: allProjects.filter(p => p.status === 'Em Progresso').length, color: '#3B82F6' },
    { name: 'Pendente', value: allProjects.filter(p => p.status === 'Pendente').length, color: '#F59E0B' },
    { name: 'Concluída', value: allProjects.filter(p => p.status === 'Concluída').length, color: '#10B981' },
    { name: 'Atrasado', value: allProjects.filter(p => p.status === 'Atrasado').length, color: '#EF4444' }
  ];

  const projectsPerMonth = Array.from({length: 6}, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthProjects = allProjects.filter(p => {
      if (!p.startDate) return false;
      const projectDate = new Date(p.startDate);
      return projectDate.getMonth() === date.getMonth() && projectDate.getFullYear() === date.getFullYear();
    }).length;
    
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      projects: monthProjects
    };
  }).reverse();

  const overallProgress = calculateOverallProgress();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Projetos Ativos"
            value={activeProjects.length.toString()}
            icon={<Activity className="h-6 w-6" />}
            trend={activeProjects.length > finishedProjects.length ? "up" : "down"}
            trendValue={`${Math.round((activeProjects.length / Math.max(allProjects.length, 1)) * 100)}%`}
          />
          
          <StatusCard
            title="Taxa de Conclusão"
            value={`${Math.round((finishedProjects.length / Math.max(allProjects.length, 1)) * 100)}%`}
            icon={<CheckCircle className="h-6 w-6" />}
            trend="up"
            trendValue={`${finishedProjects.length} concluídos`}
          />
          
          <StatusCard
            title="Valor Total"
            value={formatCurrency(totalValue, 'BRL')}
            icon={<DollarSign className="h-6 w-6" />}
            trend="up"
            trendValue={`${formatCurrency(completedValue, 'BRL')} entregue`}
          />
          
          <StatusCard
            title="Projetos Atrasados"
            value={overdueProjects.toString()}
            icon={<AlertTriangle className="h-6 w-6" />}
            trend={overdueProjects > 0 ? "down" : "up"}
            trendValue={overdueProjects > 0 ? "Requer atenção" : "Em dia"}
          />
        </div>

        {/* Cards de Métricas Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgProjectDuration()} dias</div>
              <p className="text-xs text-muted-foreground">
                Tempo médio de projeto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectsPerMonth[projectsPerMonth.length - 1]?.projects || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Novos projetos iniciados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allProjects.length > 0 ? Math.round((finishedProjects.length / allProjects.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de entrega no prazo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue / Math.max(allProjects.length, 1), 'BRL')}
              </div>
              <p className="text-xs text-muted-foreground">
                Por projeto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Overall Progress Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">Progresso Geral dos Projetos Ativos</CardTitle>
                <CardDescription className="text-blue-700">
                  Média de progresso de todos os projetos ativos ({activeProjects.length} projetos)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">{overallProgress}%</span>
                  <span className="text-sm text-gray-600 font-medium">concluído</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600 block">
                    {activeProjects.filter(p => {
                      const tasks = db.getProjectTasks(p.id);
                      const completedTasks = tasks.filter(task => task.status === 'Concluída').length;
                      return tasks.length > 0 ? (completedTasks / tasks.length) * 100 >= 70 : false;
                    }).length} de {activeProjects.length}
                  </span>
                  <span className="text-xs text-gray-500">projetos com bom progresso</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-300 rounded-full h-5 shadow-inner border">
                  <div 
                    className={`h-5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getProgressColor(overallProgress)} shadow-lg`}
                    style={{ width: `${overallProgress}%` }}
                  >
                    <div className="h-full rounded-full bg-white bg-opacity-30 shadow-inner">
                      <div className="h-full rounded-full bg-gradient-to-t from-transparent to-white bg-opacity-20"></div>
                    </div>
                  </div>
                </div>
                <div 
                  className="absolute top-0 h-5 w-1 bg-white shadow-md rounded-full transition-all duration-1000"
                  style={{ left: `${Math.max(overallProgress - 1, 0)}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  {overallProgress < 30 && (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">⚠️ Atenção: Considere revisar os prazos e recursos dos projetos.</span>
                    </>
                  )}
                  {overallProgress >= 30 && overallProgress < 70 && (
                    <>
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">📈 Progresso moderado. Continue acompanhando o desenvolvimento.</span>
                    </>
                  )}
                  {overallProgress >= 70 && (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">🎯 Excelente progresso! Projetos estão avançando bem.</span>
                    </>
                  )}
                </p>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Atualizado agora
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Status dos Projetos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Status dos Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Tarefas por Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tarefas por Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tasksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" stackId="a" fill="#10B981" name="Concluídas" />
                  <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pendentes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Projetos por Mês */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projetos Iniciados por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projectsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="projects" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

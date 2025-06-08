
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusCard from '../components/StatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Calendar, Users, DollarSign } from 'lucide-react';
import { db, Project, formatCurrency } from '../lib/database';

const Dashboard: React.FC = () => {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [finishedProjects, setFinishedProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const all = db.getAllProjects();
    const active = all.filter(p => p.status !== 'Concluído' && !p.isDeleted);
    const finished = all.filter(p => p.status === 'Concluído' && !p.isDeleted);
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
    const completed = projects.filter(p => p.status === 'Concluído').length;

    return { total, inProgress, pending, delayed, completed };
  };

  const getFinancialData = (projects: Project[]) => {
    const totalEstimated = projects.reduce((sum, p) => sum + p.estimatedValue, 0);
    const totalFinal = projects.reduce((sum, p) => sum + p.finalValue, 0);
    return { totalEstimated, totalFinal };
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

  const activeStats = getStats(activeProjects);
  const finishedStats = getStats(finishedProjects);
  const deletedStats = getStats(deletedProjects);

  const activeFinancial = getFinancialData(activeProjects);
  const finishedFinancial = getFinancialData(finishedProjects);

  const renderCustomLabel = ({ name, percent }: any) => {
    if (percent < 0.05) return ''; // Hide labels for very small slices
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
              <TrendingUp className="w-4 h-4" />
              Projetos Ativos
            </TabsTrigger>
            <TabsTrigger value="finished" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Projetos Finalizados
            </TabsTrigger>
            <TabsTrigger value="deleted" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Projetos Excluídos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard title="Total" count={activeProjects.length} color="blue" />
              <StatusCard title="Em Progresso" count={activeStats.inProgress} color="yellow" />
              <StatusCard title="Pendentes" count={activeStats.pending} color="gray" />
              <StatusCard title="Atrasados" count={activeStats.delayed} color="red" />
              <StatusCard title="Concluídos" count={activeStats.completed} color="green" />
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPhaseData(activeProjects)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Média de Progresso
                  </CardTitle>
                  <CardDescription>Progresso médio dos projetos ativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {activeProjects.length > 0 
                        ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
                        : 0}%
                    </p>
                    <p className="text-muted-foreground">Progresso médio</p>
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

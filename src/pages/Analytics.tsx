
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, Users } from 'lucide-react';
import { db, Project, formatCurrency } from '../lib/database';

const Analytics: React.FC = () => {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [finishedProjects, setFinishedProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [timeRange, setTimeRange] = useState('6m');
  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');

  useEffect(() => {
    setActiveProjects(db.getActiveProjects());
    setFinishedProjects(db.getFinishedProjects());
    setDeletedProjects(db.getDeletedProjects());
  }, []);

  const getProjectsOverTime = (projects: Project[]) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map((month, index) => ({
      month,
      projetos: projects.filter(p => new Date(p.createdAt).getMonth() === index).length,
      concluidos: projects.filter(p => new Date(p.createdAt).getMonth() === index && p.isFinished).length
    }));
    return data;
  };

  const getValueAnalysis = (projects: Project[]) => {
    return projects.map(p => ({
      name: p.name.substring(0, 20) + '...',
      estimado: p.estimatedValue,
      final: p.finalValue,
      diferenca: p.finalValue - p.estimatedValue
    }));
  };

  const getProgressAnalysis = (projects: Project[]) => {
    const ranges = [
      { name: '0-20%', count: projects.filter(p => p.progress >= 0 && p.progress <= 20).length },
      { name: '21-40%', count: projects.filter(p => p.progress >= 21 && p.progress <= 40).length },
      { name: '41-60%', count: projects.filter(p => p.progress >= 41 && p.progress <= 60).length },
      { name: '61-80%', count: projects.filter(p => p.progress >= 61 && p.progress <= 80).length },
      { name: '81-100%', count: projects.filter(p => p.progress >= 81 && p.progress <= 100).length }
    ];
    return ranges;
  };

  const getPerformanceMetrics = (projects: Project[]) => {
    const totalProjects = projects.length;
    const onTimeProjects = projects.filter(p => new Date(p.endDate) >= new Date()).length;
    const delayedProjects = projects.filter(p => p.status === 'Atrasado').length;
    const avgProgress = totalProjects > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects : 0;
    
    return { totalProjects, onTimeProjects, delayedProjects, avgProgress };
  };

  const allProjects = [...activeProjects, ...finishedProjects];
  const performanceMetrics = getPerformanceMetrics(allProjects);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCurrency} onValueChange={(value: 'BRL' | 'USD' | 'EUR') => setSelectedCurrency(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Projetos Ativos</TabsTrigger>
            <TabsTrigger value="finished">Projetos Finalizados</TabsTrigger>
            <TabsTrigger value="deleted">Projetos Excluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                      <p className="text-2xl font-bold">{activeProjects.length}</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Progresso Médio</p>
                      <p className="text-2xl font-bold">{Math.round(performanceMetrics.avgProgress)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">No Prazo</p>
                      <p className="text-2xl font-bold">{performanceMetrics.onTimeProjects}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Atrasados</p>
                      <p className="text-2xl font-bold">{performanceMetrics.delayedProjects}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução dos Projetos</CardTitle>
                  <CardDescription>Criação de projetos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getProjectsOverTime(activeProjects)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="projetos" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Progresso</CardTitle>
                  <CardDescription>Projetos por faixa de progresso</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getProgressAnalysis(activeProjects)}>
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

            <Card>
              <CardHeader>
                <CardTitle>Análise de Valores</CardTitle>
                <CardDescription>Comparação entre valores estimados e finais</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={getValueAnalysis(activeProjects)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), selectedCurrency)} />
                    <Area type="monotone" dataKey="estimado" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="final" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finished" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Projetos Finalizados</p>
                      <p className="text-2xl font-bold">{finishedProjects.length}</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                      <p className="text-2xl font-bold">
                        {allProjects.length > 0 
                          ? Math.round((finishedProjects.length / allProjects.length) * 100)
                          : 0}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          finishedProjects.reduce((sum, p) => sum + p.finalValue, 0),
                          selectedCurrency
                        )}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Progresso Médio</p>
                      <p className="text-2xl font-bold">
                        {finishedProjects.length > 0 
                          ? Math.round(finishedProjects.reduce((sum, p) => sum + p.progress, 0) / finishedProjects.length)
                          : 0}%
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projetos Concluídos por Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getProjectsOverTime(finishedProjects)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="concluidos" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análise de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getValueAnalysis(finishedProjects)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), selectedCurrency)} />
                      <Bar dataKey="diferenca" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deleted" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Projetos Excluídos</p>
                      <p className="text-2xl font-bold">{deletedProjects.length}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Exclusão</p>
                      <p className="text-2xl font-bold">
                        {allProjects.length > 0 
                          ? Math.round((deletedProjects.length / (allProjects.length + deletedProjects.length)) * 100)
                          : 0}%
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Perdido</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          deletedProjects.reduce((sum, p) => sum + p.estimatedValue, 0),
                          selectedCurrency
                        )}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Progresso Médio</p>
                      <p className="text-2xl font-bold">
                        {deletedProjects.length > 0 
                          ? Math.round(deletedProjects.reduce((sum, p) => sum + p.progress, 0) / deletedProjects.length)
                          : 0}%
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {deletedProjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Projetos Excluídos</CardTitle>
                  <CardDescription>Entendendo os motivos das exclusões</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getProgressAnalysis(deletedProjects)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;

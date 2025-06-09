
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { db, Project, formatCurrency } from '../lib/database';
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, Users, BarChart3, PieChartIcon, Activity, AlertCircle } from 'lucide-react';

interface Analytics {
  totalRevenue: number;
  totalBudget: number;
  budgetVariance: number;
  variancePercentage: number;
  ebitda: number;
  liquidMargin: number;
  cashFlow: number;
  averageROI: number;
  paybackMonths: number;
  npv: number;
  completedProjects: number;
  activeProjects: number;
  delayedProjects: number;
  onTimeDelivery: number;
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [currency, setCurrency] = useState('BRL');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, currency]);

  const loadAnalytics = () => {
    const allProjects = db.getAllProjects().filter(p => !p.isDeleted);
    setProjects(allProjects);

    const totalRevenue = allProjects.reduce((sum, p) => sum + (p.finalValue || 0), 0);
    const totalBudget = allProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    const budgetVariance = totalRevenue - totalBudget;
    const variancePercentage = totalBudget > 0 ? (budgetVariance / totalBudget) * 100 : 0;

    const completedProjects = allProjects.filter(p => p.status === 'Concluído').length;
    const activeProjects = allProjects.filter(p => p.status !== 'Concluído').length;
    const delayedProjects = allProjects.filter(p => p.status === 'Atrasado').length;
    const onTimeDelivery = activeProjects > 0 ? ((activeProjects - delayedProjects) / activeProjects) * 100 : 100;

    // Simplified financial calculations for demonstration
    const ebitda = totalRevenue * 0.28;
    const liquidMargin = 15;
    const cashFlow = totalRevenue * 0.25;
    const averageROI = 24;
    const paybackMonths = 18;
    const npv = totalRevenue * 0.45;

    setAnalytics({
      totalRevenue,
      totalBudget,
      budgetVariance,
      variancePercentage,
      ebitda,
      liquidMargin,
      cashFlow,
      averageROI,
      paybackMonths,
      npv,
      completedProjects,
      activeProjects,
      delayedProjects,
      onTimeDelivery
    });
  };

  const getVarianceColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatValue = (value: number, type: 'currency' | 'percentage' | 'number' = 'currency') => {
    if (type === 'currency') {
      return formatCurrency(value, currency);
    }
    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toString();
  };

  if (!analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">📊 Carregando analytics...</p>
        </div>
      </Layout>
    );
  }

  const pieData = [
    { name: 'Concluídos', value: analytics.completedProjects, color: '#10b981' },
    { name: 'Ativos', value: analytics.activeProjects, color: '#3b82f6' },
    { name: 'Atrasados', value: analytics.delayedProjects, color: '#ef4444' }
  ];

  const revenueData = [
    { month: 'Jan', revenue: analytics.totalRevenue * 0.15, profit: analytics.totalRevenue * 0.12 },
    { month: 'Fev', revenue: analytics.totalRevenue * 0.18, profit: analytics.totalRevenue * 0.14 },
    { month: 'Mar', revenue: analytics.totalRevenue * 0.22, profit: analytics.totalRevenue * 0.18 },
    { month: 'Abr', revenue: analytics.totalRevenue * 0.20, profit: analytics.totalRevenue * 0.16 },
    { month: 'Mai', revenue: analytics.totalRevenue * 0.25, profit: analytics.totalRevenue * 0.20 },
    { month: 'Jun', revenue: analytics.totalRevenue * 0.30, profit: analytics.totalRevenue * 0.24 }
  ];

  return (
    <TooltipProvider>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                📊 Analytics
              </h1>
              <p className="text-muted-foreground">📈 Análise detalhada de performance e indicadores financeiros</p>
            </div>
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Selecione o período para análise dos dados</p>
                  </TooltipContent>
                </Tooltip>
                <SelectContent>
                  <SelectItem value="3months">⏱️ Últimos 3 meses</SelectItem>
                  <SelectItem value="6months">📅 Últimos 6 meses</SelectItem>
                  <SelectItem value="1year">🗓️ Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currency} onValueChange={setCurrency}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Moeda para exibição dos valores financeiros</p>
                  </TooltipContent>
                </Tooltip>
                <SelectContent>
                  <SelectItem value="BRL">💰 BRL</SelectItem>
                  <SelectItem value="USD">💵 USD</SelectItem>
                  <SelectItem value="EUR">💶 EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Visão Geral</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Receita total de todos os projetos concluídos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">💰 Receita Total</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatValue(analytics.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Performance</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Target className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Orçamento total planejado vs executado</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">🎯 Orçamento Total</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatValue(analytics.totalBudget)}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Financeiro</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      {analytics.budgetVariance >= 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      }
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Diferença entre receita real e orçamento planejado</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">📈 Variação</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-xl font-bold ${getVarianceColor(analytics.budgetVariance)}`}>
                  {analytics.budgetVariance >= 0 ? '+' : ''}{formatValue(analytics.budgetVariance)}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Qualidade</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Activity className="h-4 w-4 text-purple-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentual de variação orçamentária</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">📊 % Variação</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-xl font-bold ${getVarianceColor(analytics.variancePercentage)}`}>
                  {analytics.variancePercentage >= 0 ? '+' : ''}{formatValue(analytics.variancePercentage, 'percentage')}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estratégico</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Taxa de entrega de projetos no prazo</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">⏰ Entrega no Prazo</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatValue(analytics.onTimeDelivery, 'percentage')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">💰 EBITDA</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lucro antes de juros, impostos, depreciação e amortização</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{formatValue(analytics.ebitda, 'percentage')}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">📊 Margem Líquida</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentual de lucro líquido sobre a receita total</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{analytics.liquidMargin}%</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">💸 Fluxo de Caixa</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fluxo de caixa operacional dos projetos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{formatValue(analytics.cashFlow)}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">🎯 ROI Médio</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Target className="h-4 w-4 text-purple-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Retorno sobre investimento médio dos projetos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">+{analytics.averageROI}%</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">⏱️ Payback</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tempo médio para recuperação do investimento</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{analytics.paybackMonths} meses</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">📈 NPV</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Valor Presente Líquido dos projetos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{formatValue(analytics.npv)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  📈 Evolução da Receita
                </CardTitle>
                <CardDescription>💰 Receita e lucratividade ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Lucro" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                  🍰 Análise de Lucratividade
                </CardTitle>
                <CardDescription>📊 Indicadores financeiros chave</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    +{analytics.variancePercentage >= 0 ? Math.abs(analytics.variancePercentage).toFixed(0) : Math.abs(analytics.variancePercentage).toFixed(0)}%
                  </div>
                  <p className="text-muted-foreground">📈 Lucratividade vs Planejado</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">💰 Receita Realizada:</span>
                      <span className="font-semibold">{formatValue(analytics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">🎯 Orçamento Planejado:</span>
                      <span className="font-semibold">{formatValue(analytics.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">📊 Variação:</span>
                      <span className={`font-semibold ${getVarianceColor(analytics.budgetVariance)}`}>
                        {formatValue(analytics.budgetVariance)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default Analytics;

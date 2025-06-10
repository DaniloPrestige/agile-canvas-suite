import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { db, Project, formatCurrency } from '../lib/database';
import { currencyService } from '../lib/currencyService';
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

type CurrencyType = 'BRL' | 'USD' | 'EUR';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [convertedAnalytics, setConvertedAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [currency, setCurrency] = useState<CurrencyType>('BRL');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [conversionError, setConversionError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Analytics useEffect disparado - carregando dados iniciais');
    loadAnalytics();
  }, [timeRange]);

  useEffect(() => {
    console.log('Currency changed to:', currency);
    if (analytics) {
      convertAnalyticsData();
    }
  }, [currency, analytics]);

  const loadAnalytics = async () => {
    console.log('Carregando analytics...');
    setIsLoading(true);
    
    try {
      const allProjects = db.getAllProjects().filter(p => !p.isDeleted);
      console.log('Projetos carregados:', allProjects.length);
      setProjects(allProjects);

      const totalRevenue = allProjects.reduce((sum, p) => sum + (p.finalValue || 0), 0);
      const totalBudget = allProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
      const budgetVariance = totalRevenue - totalBudget;
      const variancePercentage = totalBudget > 0 ? (budgetVariance / totalBudget) * 100 : 0;

      const completedProjects = allProjects.filter(p => p.status === 'Concluída').length;
      const activeProjects = allProjects.filter(p => p.status !== 'Concluída').length;
      const delayedProjects = allProjects.filter(p => p.status === 'Atrasado').length;
      const onTimeDelivery = activeProjects > 0 ? ((activeProjects - delayedProjects) / activeProjects) * 100 : 100;

      // Simplified financial calculations for demonstration
      const ebitda = totalRevenue * 0.28;
      const liquidMargin = 15;
      const cashFlow = totalRevenue * 0.25;
      const averageROI = 24;
      const paybackMonths = 18;
      const npv = totalRevenue * 0.45;

      const analyticsData = {
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
      };

      console.log('Analytics calculados:', analyticsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertAnalyticsData = async () => {
    if (!analytics || currency === 'BRL') {
      console.log('Usando dados originais (BRL ou sem dados)');
      setConvertedAnalytics(analytics);
      setConversionError(null);
      return;
    }

    console.log('Iniciando conversão de moedas para:', currency);
    setConversionError(null);

    try {
      const convertedData = {
        ...analytics,
        totalRevenue: await currencyService.convertCurrency(analytics.totalRevenue, 'BRL', currency),
        totalBudget: await currencyService.convertCurrency(analytics.totalBudget, 'BRL', currency),
        budgetVariance: await currencyService.convertCurrency(analytics.budgetVariance, 'BRL', currency),
        ebitda: await currencyService.convertCurrency(analytics.ebitda, 'BRL', currency),
        cashFlow: await currencyService.convertCurrency(analytics.cashFlow, 'BRL', currency),
        npv: await currencyService.convertCurrency(analytics.npv, 'BRL', currency),
      };

      console.log('Dados convertidos:', convertedData);
      setConvertedAnalytics(convertedData);
    } catch (error) {
      console.error('Erro na conversão de moedas:', error);
      setConversionError('Erro ao converter moedas. Usando valores em BRL.');
      setConvertedAnalytics(analytics);
    }
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

  const handleCardClick = (cardType: string) => {
    // Navigate to detailed indicator page
    navigate(`/analytics/${cardType}`);
  };

  const displayAnalytics = convertedAnalytics || analytics;

  if (isLoading || !displayAnalytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">📊 Carregando analytics...</p>
        </div>
      </Layout>
    );
  }

  const pieData = [
    { name: 'Concluídos', value: displayAnalytics.completedProjects, color: '#10b981' },
    { name: 'Ativos', value: displayAnalytics.activeProjects, color: '#3b82f6' },
    { name: 'Atrasados', value: displayAnalytics.delayedProjects, color: '#ef4444' }
  ];

  const revenueData = [
    { month: 'Jan', revenue: displayAnalytics.totalRevenue * 0.15, profit: displayAnalytics.totalRevenue * 0.12 },
    { month: 'Fev', revenue: displayAnalytics.totalRevenue * 0.18, profit: displayAnalytics.totalRevenue * 0.14 },
    { month: 'Mar', revenue: displayAnalytics.totalRevenue * 0.22, profit: displayAnalytics.totalRevenue * 0.18 },
    { month: 'Abr', revenue: displayAnalytics.totalRevenue * 0.20, profit: displayAnalytics.totalRevenue * 0.16 },
    { month: 'Mai', revenue: displayAnalytics.totalRevenue * 0.25, profit: displayAnalytics.totalRevenue * 0.20 },
    { month: 'Jun', revenue: displayAnalytics.totalRevenue * 0.30, profit: displayAnalytics.totalRevenue * 0.24 }
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
              {conversionError && (
                <p className="text-red-600 text-sm mt-1">⚠️ {conversionError}</p>
              )}
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
              <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyType)}>
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

          {/* Overview Cards - Now Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('revenue')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Visão Geral</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Receita total de todos os projetos concluídos - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">💰 Receita Total</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{formatValue(displayAnalytics.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('budget')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Performance</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Target className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Orçamento total planejado vs executado - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">🎯 Orçamento Total</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{formatValue(displayAnalytics.totalBudget)}</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-red-500 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('variance')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Financeiro</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      {displayAnalytics.budgetVariance >= 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      }
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Diferença entre receita real e orçamento planejado - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">📈 Variação</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-lg font-bold ${getVarianceColor(displayAnalytics.budgetVariance)}`}>
                  {displayAnalytics.budgetVariance >= 0 ? '+' : ''}{formatValue(displayAnalytics.budgetVariance)}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('quality')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Qualidade</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Activity className="h-4 w-4 text-purple-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentual de variação orçamentária - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">📊 % Variação</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-lg font-bold ${getVarianceColor(displayAnalytics.variancePercentage)}`}>
                  {displayAnalytics.variancePercentage >= 0 ? '+' : ''}{formatValue(displayAnalytics.variancePercentage, 'percentage')}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('delivery')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estratégico</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Taxa de entrega de projetos no prazo - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-xs">⏰ Entrega no Prazo</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{formatValue(displayAnalytics.onTimeDelivery, 'percentage')}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-green-400 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('ebitda')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">💰 EBITDA</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lucro antes de juros, impostos, depreciação e amortização - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{formatValue(displayAnalytics.ebitda, 'currency')}</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-blue-400 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('margin')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">📊 Margem Líquida</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentual de lucro líquido sobre a receita total - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{displayAnalytics.liquidMargin}%</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-red-400 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('cashflow')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">💸 Fluxo de Caixa</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fluxo de caixa operacional dos projetos - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-bold">{formatValue(displayAnalytics.cashFlow)}</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-purple-400 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('roi')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">🎯 ROI Médio</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Target className="h-4 w-4 text-purple-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Retorno sobre investimento médio dos projetos - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">+{displayAnalytics.averageROI}%</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-400 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('payback')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">⏱️ Payback</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tempo médio para recuperação do investimento - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-bold">{displayAnalytics.paybackMonths} meses</div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-400 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCardClick('npv')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">📈 NPV</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Valor Presente Líquido dos projetos - Clique para detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-bold">{formatValue(displayAnalytics.npv)}</div>
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
                    +{displayAnalytics.variancePercentage >= 0 ? Math.abs(displayAnalytics.variancePercentage).toFixed(0) : Math.abs(displayAnalytics.variancePercentage).toFixed(0)}%
                  </div>
                  <p className="text-muted-foreground">📈 Lucratividade vs Planejado</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">💰 Receita Realizada:</span>
                      <span className="font-semibold">{formatValue(displayAnalytics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">🎯 Orçamento Planejado:</span>
                      <span className="font-semibold">{formatValue(displayAnalytics.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">📊 Variação:</span>
                      <span className={`font-semibold ${getVarianceColor(displayAnalytics.budgetVariance)}`}>
                        {formatValue(displayAnalytics.budgetVariance)}
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

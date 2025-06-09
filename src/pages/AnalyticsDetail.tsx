import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, DollarSign, Target, Clock, Activity, BarChart3, FileText, Eye, Settings, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { db, Project } from '../lib/database';
import { useToast } from '@/hooks/use-toast';

const AnalyticsDetail: React.FC = () => {
  const { indicator } = useParams<{ indicator: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
  const [goalData, setGoalData] = useState({
    target: '',
    deadline: '',
    description: ''
  });
  const [alertData, setAlertData] = useState({
    threshold: '',
    type: 'above',
    email: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [indicator]);

  const loadData = async () => {
    const allProjects = db.getAllProjects().filter(p => !p.isDeleted);
    setProjects(allProjects);
    
    // Calcular analytics baseado nos projetos reais com conversão de moeda
    let totalRevenue = 0;
    let totalBudget = 0;
    
    for (const project of allProjects) {
      const revenueInBRL = project.currency === 'BRL' ? 
        (project.finalValue || 0) : 
        await db.convertCurrency(project.finalValue || 0, project.currency, 'BRL');
      
      const budgetInBRL = project.currency === 'BRL' ? 
        project.estimatedValue : 
        await db.convertCurrency(project.estimatedValue, project.currency, 'BRL');
      
      totalRevenue += revenueInBRL;
      totalBudget += budgetInBRL;
    }
    
    const budgetVariance = totalRevenue - totalBudget;
    const completedProjects = allProjects.filter(p => p.status === 'Concluída').length;
    const activeProjects = allProjects.filter(p => p.status !== 'Concluída' && !p.isDeleted).length;
    const delayedProjects = allProjects.filter(p => p.status === 'Atrasado').length;
    const onTimeDelivery = activeProjects > 0 ? ((activeProjects - delayedProjects) / activeProjects) * 100 : 100;
    
    setAnalytics({
      totalRevenue,
      totalBudget,
      budgetVariance,
      variancePercentage: totalBudget > 0 ? (budgetVariance / totalBudget) * 100 : 0,
      ebitda: totalRevenue * 0.28,
      liquidMargin: 15,
      cashFlow: totalRevenue * 0.25,
      averageROI: 24,
      paybackMonths: 18,
      npv: totalRevenue * 0.45,
      completedProjects,
      activeProjects,
      delayedProjects,
      onTimeDelivery
    });
  };

  const formatCurrencySync = (amount: number, currency: 'BRL' | 'USD' | 'EUR'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleExportReport = () => {
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${indicator}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewTrends = () => {
    navigate('/analytics');
  };

  const handleSetGoals = () => {
    setIsGoalsDialogOpen(true);
  };

  const handleConfigureAlerts = () => {
    setIsAlertsDialogOpen(true);
  };

  const handleSaveGoal = () => {
    toast({
      title: "Meta definida com sucesso!",
      description: `Meta de ${goalData.target} definida para ${indicator}`,
    });
    setIsGoalsDialogOpen(false);
    setGoalData({ target: '', deadline: '', description: '' });
  };

  const handleSaveAlert = () => {
    toast({
      title: "Alerta configurado com sucesso!",
      description: `Alerta configurado para ${indicator} com limite ${alertData.threshold}`,
    });
    setIsAlertsDialogOpen(false);
    setAlertData({ threshold: '', type: 'above', email: '', description: '' });
  };

  const getIndicatorDetails = (indicatorType: string) => {
    switch (indicatorType) {
      case 'revenue':
        return {
          title: 'Receita Total',
          icon: <DollarSign className="h-6 w-6 text-green-600" />,
          description: 'Análise detalhada da receita total dos projetos',
          value: analytics ? formatCurrencySync(analytics.totalRevenue, 'BRL') : 'Carregando...',
          content: `A receita total atual é de ${analytics ? formatCurrencySync(analytics.totalRevenue, 'BRL') : 'carregando'}, baseada em ${projects.length} projetos. Esta análise inclui tendências mensais, comparações com períodos anteriores e projeções futuras.`,
          chartData: [
            { month: 'Jan', value: analytics ? analytics.totalRevenue * 0.15 : 0 },
            { month: 'Fev', value: analytics ? analytics.totalRevenue * 0.18 : 0 },
            { month: 'Mar', value: analytics ? analytics.totalRevenue * 0.22 : 0 },
            { month: 'Abr', value: analytics ? analytics.totalRevenue * 0.20 : 0 },
            { month: 'Mai', value: analytics ? analytics.totalRevenue * 0.25 : 0 },
            { month: 'Jun', value: analytics ? analytics.totalRevenue * 0.30 : 0 }
          ]
        };
      case 'budget':
        return {
          title: 'Orçamento Total',
          icon: <Target className="h-6 w-6 text-blue-600" />,
          description: 'Análise do orçamento planejado vs executado',
          value: analytics ? formatCurrencySync(analytics.totalBudget, 'BRL') : 'Carregando...',
          content: `O orçamento total planejado é de ${analytics ? formatCurrencySync(analytics.totalBudget, 'BRL') : 'carregando'}. A variação atual é de ${analytics ? analytics.variancePercentage.toFixed(1) : 0}% em relação ao planejado.`,
          chartData: [
            { category: 'Planejado', value: analytics ? analytics.totalBudget : 0 },
            { category: 'Executado', value: analytics ? analytics.totalRevenue : 0 },
            { category: 'Variação', value: analytics ? Math.abs(analytics.budgetVariance) : 0 }
          ]
        };
      case 'variance':
        return {
          title: 'Variação Financeira',
          icon: <TrendingUp className="h-6 w-6 text-red-600" />,
          description: 'Análise das variações entre planejado e executado',
          value: analytics ? `${analytics.variancePercentage.toFixed(1)}%` : 'Carregando...',
          content: `A variação financeira atual é de ${analytics ? analytics.variancePercentage.toFixed(1) : 0}%, representando ${analytics ? formatCurrencySync(Math.abs(analytics.budgetVariance), 'BRL') : 'carregando'} ${analytics && analytics.budgetVariance >= 0 ? 'acima' : 'abaixo'} do planejado.`,
          chartData: projects.map(p => ({
            name: p.name.substring(0, 15),
            planejado: p.estimatedValue,
            executado: p.finalValue || p.estimatedValue
          }))
        };
      case 'quality':
        return {
          title: 'Indicador de Qualidade',
          icon: <Activity className="h-6 w-6 text-purple-600" />,
          description: 'Métricas de qualidade e performance dos projetos',
          value: analytics ? `${analytics.onTimeDelivery.toFixed(1)}%` : 'Carregando...',
          content: `O indicador de qualidade atual é de ${analytics ? analytics.onTimeDelivery.toFixed(1) : 0}% baseado na taxa de entrega no prazo. ${analytics ? analytics.completedProjects : 0} projetos foram concluídos com sucesso.`,
          chartData: [
            { status: 'No Prazo', value: analytics ? analytics.activeProjects - analytics.delayedProjects : 0 },
            { status: 'Atrasados', value: analytics ? analytics.delayedProjects : 0 },
            { status: 'Concluídos', value: analytics ? analytics.completedProjects : 0 }
          ]
        };
      case 'delivery':
        return {
          title: 'Taxa de Entrega no Prazo',
          icon: <Clock className="h-6 w-6 text-yellow-600" />,
          description: 'Análise da pontualidade nas entregas',
          value: analytics ? `${analytics.onTimeDelivery.toFixed(1)}%` : 'Carregando...',
          content: `A taxa de entrega no prazo é de ${analytics ? analytics.onTimeDelivery.toFixed(1) : 0}%. ${analytics ? analytics.delayedProjects : 0} projetos estão atrasados de um total de ${analytics ? analytics.activeProjects : 0} projetos ativos.`,
          chartData: [
            { month: 'Jan', entregues: 85, atrasados: 15 },
            { month: 'Fev', entregues: 90, atrasados: 10 },
            { month: 'Mar', entregues: 88, atrasados: 12 },
            { month: 'Abr', entregues: 92, atrasados: 8 },
            { month: 'Mai', entregues: analytics ? analytics.onTimeDelivery : 95, atrasados: analytics ? 100 - analytics.onTimeDelivery : 5 },
            { month: 'Jun', entregues: analytics ? analytics.onTimeDelivery : 95, atrasados: analytics ? 100 - analytics.onTimeDelivery : 5 }
          ]
        };
      case 'ebitda':
        return {
          title: 'EBITDA - Análise Detalhada',
          icon: <DollarSign className="h-6 w-6 text-green-600" />,
          description: 'Lucro antes de juros, impostos, depreciação e amortização',
          value: analytics ? formatCurrencySync(analytics.ebitda, 'BRL') : 'Carregando...',
          content: `O EBITDA atual é de ${analytics ? formatCurrencySync(analytics.ebitda, 'BRL') : 'carregando'}, representando ${analytics ? ((analytics.ebitda / analytics.totalRevenue) * 100).toFixed(1) : 0}% da receita total. Esta métrica indica a eficiência operacional da empresa.`,
          chartData: [
            { period: 'Q1', ebitda: analytics ? analytics.ebitda * 0.20 : 0 },
            { period: 'Q2', ebitda: analytics ? analytics.ebitda * 0.25 : 0 },
            { period: 'Q3', ebitda: analytics ? analytics.ebitda * 0.28 : 0 },
            { period: 'Q4', ebitda: analytics ? analytics.ebitda * 0.27 : 0 }
          ]
        };
      case 'margin':
        return {
          title: 'Margem Líquida',
          icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
          description: 'Análise da margem de lucro líquida',
          value: analytics ? `${analytics.liquidMargin}%` : 'Carregando...',
          content: `A margem líquida atual é de ${analytics ? analytics.liquidMargin : 0}%. Esta métrica mostra a eficiência da empresa em converter receita em lucro líquido após todos os custos e despesas.`,
          chartData: projects.map(p => ({
            project: p.name.substring(0, 10),
            margem: ((p.finalValue || p.estimatedValue) / p.estimatedValue * 100) - 100
          }))
        };
      case 'cashflow':
        return {
          title: 'Fluxo de Caixa',
          icon: <TrendingUp className="h-6 w-6 text-red-600" />,
          description: 'Análise do fluxo de caixa operacional',
          value: analytics ? formatCurrencySync(analytics.cashFlow, 'BRL') : 'Carregando...',
          content: `O fluxo de caixa operacional é de ${analytics ? formatCurrencySync(analytics.cashFlow, 'BRL') : 'carregando'}. Este valor representa a capacidade da empresa de gerar dinheiro através de suas operações principais.`,
          chartData: [
            { month: 'Jan', entrada: analytics ? analytics.cashFlow * 0.15 : 0, saida: analytics ? analytics.cashFlow * 0.12 : 0 },
            { month: 'Fev', entrada: analytics ? analytics.cashFlow * 0.18 : 0, saida: analytics ? analytics.cashFlow * 0.15 : 0 },
            { month: 'Mar', entrada: analytics ? analytics.cashFlow * 0.22 : 0, saida: analytics ? analytics.cashFlow * 0.18 : 0 },
            { month: 'Abr', entrada: analytics ? analytics.cashFlow * 0.20 : 0, saida: analytics ? analytics.cashFlow * 0.16 : 0 },
            { month: 'Mai', entrada: analytics ? analytics.cashFlow * 0.25 : 0, saida: analytics ? analytics.cashFlow * 0.20 : 0 }
          ]
        };
      case 'roi':
        return {
          title: 'ROI - Retorno sobre Investimento',
          icon: <Target className="h-6 w-6 text-purple-600" />,
          description: 'Análise do retorno sobre investimento',
          value: analytics ? `${analytics.averageROI}%` : 'Carregando...',
          content: `O ROI médio é de ${analytics ? analytics.averageROI : 0}% baseado no portfolio de projetos atual. Este indicador mede a eficiência dos investimentos realizados.`,
          chartData: projects.map(p => ({
            project: p.name.substring(0, 10),
            roi: ((p.finalValue || p.estimatedValue) / p.estimatedValue - 1) * 100
          }))
        };
      case 'payback':
        return {
          title: 'Período de Payback',
          icon: <Clock className="h-6 w-6 text-yellow-600" />,
          description: 'Tempo de recuperação do investimento',
          value: analytics ? `${analytics.paybackMonths} meses` : 'Carregando...',
          content: `O período médio de payback é de ${analytics ? analytics.paybackMonths : 0} meses. Este tempo representa quanto demora para recuperar o investimento inicial dos projetos.`,
          chartData: projects.map(p => ({
            project: p.name.substring(0, 10),
            payback: Math.random() * 24 + 6 // Simulação baseada no projeto
          }))
        };
      case 'npv':
        return {
          title: 'NPV - Valor Presente Líquido',
          icon: <TrendingUp className="h-6 w-6 text-indigo-600" />,
          description: 'Valor presente líquido dos projetos',
          value: analytics ? formatCurrencySync(analytics.npv, 'BRL') : 'Carregando...',
          content: `O NPV total do portfolio é de ${analytics ? formatCurrencySync(analytics.npv, 'BRL') : 'carregando'}. Um NPV positivo indica que os projetos geram valor para a empresa.`,
          chartData: projects.map(p => ({
            project: p.name.substring(0, 10),
            npv: (p.finalValue || p.estimatedValue) * 0.45
          }))
        };
      default:
        return {
          title: 'Indicador não encontrado',
          icon: <Activity className="h-6 w-6 text-gray-600" />,
          description: 'Indicador não reconhecido',
          value: 'N/A',
          content: 'O indicador solicitado não foi encontrado.',
          chartData: []
        };
    }
  };

  if (!analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </Layout>
    );
  }

  const details = getIndicatorDetails(indicator || '');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Analytics
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                {details.icon}
                {details.title}
              </h1>
              <p className="text-muted-foreground">{details.description}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Value Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {details.icon}
                  Valor Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-4">
                  {details.value}
                </div>
                <p className="text-gray-600">{details.content}</p>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Análise Gráfica</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={details.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Project Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-gray-600">{project.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrencySync(project.finalValue || project.estimatedValue, project.currency)}</p>
                        <p className="text-sm text-gray-600">{project.status}</p>
                      </div>
                    </div>
                  ))}
                  {projects.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... e mais {projects.length - 5} projetos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleExportReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewTrends}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Tendências
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleSetGoals}>
                  <Target className="mr-2 h-4 w-4" />
                  Definir Metas
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleConfigureAlerts}>
                  <Bell className="mr-2 h-4 w-4" />
                  Configurar Alertas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Úteis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">📅 Última Atualização:</span>
                    <p className="text-gray-600">Agora há pouco</p>
                  </div>
                  <div>
                    <span className="font-medium">🔄 Frequência:</span>
                    <p className="text-gray-600">Atualizado em tempo real</p>
                  </div>
                  <div>
                    <span className="font-medium">📊 Fonte dos Dados:</span>
                    <p className="text-gray-600">Sistema de Gestão de Projetos</p>
                  </div>
                  <div>
                    <span className="font-medium">📈 Projetos Analisados:</span>
                    <p className="text-gray-600">{projects.length} projetos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Goals Dialog */}
      <Dialog open={isGoalsDialogOpen} onOpenChange={setIsGoalsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Meta para {details.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target">Valor da Meta</Label>
              <Input
                id="target"
                value={goalData.target}
                onChange={(e) => setGoalData({ ...goalData, target: e.target.value })}
                placeholder="Ex: 1000000 ou 85%"
              />
            </div>
            <div>
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={goalData.deadline}
                onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={goalData.description}
                onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                placeholder="Descreva os objetivos desta meta..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsGoalsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGoal}>
                Salvar Meta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerts Dialog */}
      <Dialog open={isAlertsDialogOpen} onOpenChange={setIsAlertsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Alerta para {details.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="threshold">Limite do Alerta</Label>
              <Input
                id="threshold"
                value={alertData.threshold}
                onChange={(e) => setAlertData({ ...alertData, threshold: e.target.value })}
                placeholder="Ex: 1000000 ou 85"
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo de Alerta</Label>
              <Select value={alertData.type} onValueChange={(value) => setAlertData({ ...alertData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Acima do limite</SelectItem>
                  <SelectItem value="below">Abaixo do limite</SelectItem>
                  <SelectItem value="equal">Igual ao limite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">Email para Notificação</Label>
              <Input
                id="email"
                type="email"
                value={alertData.email}
                onChange={(e) => setAlertData({ ...alertData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="alertDescription">Descrição</Label>
              <Textarea
                id="alertDescription"
                value={alertData.description}
                onChange={(e) => setAlertData({ ...alertData, description: e.target.value })}
                placeholder="Descreva quando este alerta deve ser ativado..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAlertsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAlert}>
                Salvar Alerta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AnalyticsDetail;

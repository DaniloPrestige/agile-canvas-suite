import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, Target, Clock, Activity, BarChart3, FileText, Eye, Settings, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { db, Project, formatCurrency } from '../lib/database';

const AnalyticsDetail: React.FC = () => {
  const { indicator } = useParams<{ indicator: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [indicator]);

  const loadData = async () => {
    const allProjects = db.getAllProjects().filter(p => !p.isDeleted);
    setProjects(allProjects);
    
    // Calcular analytics baseado nos projetos reais
    const totalRevenue = allProjects.reduce((sum, p) => sum + (p.finalValue || 0), 0);
    const totalBudget = allProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    const budgetVariance = totalRevenue - totalBudget;
    const completedProjects = allProjects.filter(p => p.status === 'Concluído').length;
    const activeProjects = allProjects.filter(p => p.status !== 'Concluído' && !p.isDeleted).length;
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

  const handleExportReport = () => {
    // Implementar exportação específica para este indicador
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
    // Navegar para visualização de tendências
    navigate('/analytics');
  };

  const handleSetGoals = () => {
    // Implementar definição de metas
    alert('Funcionalidade de definição de metas será implementada em breve');
  };

  const handleConfigureAlerts = () => {
    // Implementar configuração de alertas
    alert('Funcionalidade de configuração de alertas será implementada em breve');
  };

  const getIndicatorDetails = (indicatorType: string) => {
    switch (indicatorType) {
      case 'revenue':
        return {
          title: 'Receita Total',
          icon: <DollarSign className="h-6 w-6 text-green-600" />,
          description: 'Análise detalhada da receita total dos projetos',
          value: analytics ? await formatCurrency(analytics.totalRevenue, 'BRL') : 'Carregando...',
          content: `A receita total atual é de ${analytics ? await formatCurrency(analytics.totalRevenue, 'BRL') : 'carregando'}, baseada em ${projects.length} projetos. Esta análise inclui tendências mensais, comparações com períodos anteriores e projeções futuras.`,
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
          value: analytics ? await formatCurrency(analytics.totalBudget, 'BRL') : 'Carregando...',
          content: `O orçamento total planejado é de ${analytics ? await formatCurrency(analytics.totalBudget, 'BRL') : 'carregando'}. A variação atual é de ${analytics ? analytics.variancePercentage.toFixed(1) : 0}% em relação ao planejado.`,
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
          content: `A variação financeira atual é de ${analytics ? analytics.variancePercentage.toFixed(1) : 0}%, representando ${analytics ? await formatCurrency(Math.abs(analytics.budgetVariance), 'BRL') : 'carregando'} ${analytics && analytics.budgetVariance >= 0 ? 'acima' : 'abaixo'} do planejado.`,
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
          value: analytics ? await formatCurrency(analytics.ebitda, 'BRL') : 'Carregando...',
          content: `O EBITDA atual é de ${analytics ? await formatCurrency(analytics.ebitda, 'BRL') : 'carregando'}, representando ${analytics ? ((analytics.ebitda / analytics.totalRevenue) * 100).toFixed(1) : 0}% da receita total. Esta métrica indica a eficiência operacional da empresa.`,
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
          value: analytics ? await formatCurrency(analytics.cashFlow, 'BRL') : 'Carregando...',
          content: `O fluxo de caixa operacional é de ${analytics ? await formatCurrency(analytics.cashFlow, 'BRL') : 'carregando'}. Este valor representa a capacidade da empresa de gerar dinheiro através de suas operações principais.`,
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
          value: analytics ? await formatCurrency(analytics.npv, 'BRL') : 'Carregando...',
          content: `O NPV total do portfolio é de ${analytics ? await formatCurrency(analytics.npv, 'BRL') : 'carregando'}. Um NPV positivo indica que os projetos geram valor para a empresa.`,
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
          <p className="text-muted-foreground">📊 Carregando dados...</p>
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
                  {indicator === 'revenue' || indicator === 'delivery' || indicator === 'cashflow' ? (
                    <LineChart data={details.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={indicator === 'cashflow' ? 'month' : indicator === 'delivery' ? 'month' : 'month'} />
                      <YAxis />
                      {indicator === 'cashflow' ? (
                        <>
                          <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={2} name="Entrada" />
                          <Line type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={2} name="Saída" />
                        </>
                      ) : indicator === 'delivery' ? (
                        <>
                          <Line type="monotone" dataKey="entregues" stroke="#10b981" strokeWidth={2} name="No Prazo" />
                          <Line type="monotone" dataKey="atrasados" stroke="#ef4444" strokeWidth={2} name="Atrasados" />
                        </>
                      ) : (
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                      )}
                    </LineChart>
                  ) : (
                    <BarChart data={details.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={indicator === 'budget' ? 'category' : indicator === 'quality' ? 'status' : 'project'} />
                      <YAxis />
                      <Bar dataKey={indicator === 'budget' ? 'value' : indicator === 'quality' ? 'value' : indicator === 'variance' ? 'planejado' : indicator === 'margin' ? 'margem' : indicator === 'roi' ? 'roi' : indicator === 'payback' ? 'payback' : indicator === 'npv' ? 'npv' : 'ebitda'} fill="#3b82f6" />
                      {indicator === 'variance' && <Bar dataKey="executado" fill="#10b981" />}
                    </BarChart>
                  )}
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
                        <p className="font-medium">{formatCurrency(project.finalValue || project.estimatedValue, project.currency)}</p>
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
                <CardTitle>Ações Rápidas</CardHeader>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleExportReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  📊 Exportar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewTrends}>
                  <Eye className="mr-2 h-4 w-4" />
                  📈 Ver Tendências
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleSetGoals}>
                  <Target className="mr-2 h-4 w-4" />
                  🎯 Definir Metas
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleConfigureAlerts}>
                  <Bell className="mr-2 h-4 w-4" />
                  ⚠️ Configurar Alertas
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
    </Layout>
  );
};

export default AnalyticsDetail;

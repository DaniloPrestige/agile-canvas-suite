
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, Target, Clock, Activity, BarChart3 } from 'lucide-react';

const AnalyticsDetail: React.FC = () => {
  const { indicator } = useParams<{ indicator: string }>();
  const navigate = useNavigate();

  const getIndicatorDetails = (indicatorType: string) => {
    switch (indicatorType) {
      case 'revenue':
        return {
          title: 'Receita Total',
          icon: <DollarSign className="h-6 w-6 text-green-600" />,
          description: 'Análise detalhada da receita total dos projetos',
          content: 'Esta página mostra informações detalhadas sobre a receita total, incluindo tendências, comparações mensais e projeções.'
        };
      case 'budget':
        return {
          title: 'Orçamento Total',
          icon: <Target className="h-6 w-6 text-blue-600" />,
          description: 'Análise do orçamento planejado vs executado',
          content: 'Aqui você encontra detalhes sobre o orçamento planejado, variações e eficiência de execução.'
        };
      case 'variance':
        return {
          title: 'Variação Financeira',
          icon: <TrendingUp className="h-6 w-6 text-red-600" />,
          description: 'Análise das variações entre planejado e executado',
          content: 'Esta seção apresenta análises detalhadas das variações financeiras e seus impactos.'
        };
      case 'quality':
        return {
          title: 'Indicador de Qualidade',
          icon: <Activity className="h-6 w-6 text-purple-600" />,
          description: 'Métricas de qualidade e performance dos projetos',
          content: 'Análise detalhada dos indicadores de qualidade, incluindo satisfação do cliente e entrega dentro do escopo.'
        };
      case 'delivery':
        return {
          title: 'Taxa de Entrega no Prazo',
          icon: <Clock className="h-6 w-6 text-yellow-600" />,
          description: 'Análise da pontualidade nas entregas',
          content: 'Detalhes sobre a performance de entrega, incluindo fatores que impactam os prazos.'
        };
      case 'ebitda':
        return {
          title: 'EBITDA - Análise Detalhada',
          icon: <DollarSign className="h-6 w-6 text-green-600" />,
          description: 'Lucro antes de juros, impostos, depreciação e amortização',
          content: 'Análise completa do EBITDA, incluindo composição, tendências e comparações setoriais.'
        };
      case 'margin':
        return {
          title: 'Margem Líquida',
          icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
          description: 'Análise da margem de lucro líquida',
          content: 'Detalhes sobre a margem líquida, fatores que a influenciam e estratégias de otimização.'
        };
      case 'cashflow':
        return {
          title: 'Fluxo de Caixa',
          icon: <TrendingUp className="h-6 w-6 text-red-600" />,
          description: 'Análise do fluxo de caixa operacional',
          content: 'Informações detalhadas sobre o fluxo de caixa, incluindo projeções e cenários.'
        };
      case 'roi':
        return {
          title: 'ROI - Retorno sobre Investimento',
          icon: <Target className="h-6 w-6 text-purple-600" />,
          description: 'Análise do retorno sobre investimento',
          content: 'Análise detalhada do ROI por projeto, tendências e benchmark do mercado.'
        };
      case 'payback':
        return {
          title: 'Período de Payback',
          icon: <Clock className="h-6 w-6 text-yellow-600" />,
          description: 'Tempo de recuperação do investimento',
          content: 'Análise do tempo médio de recuperação de investimentos e fatores que o influenciam.'
        };
      case 'npv':
        return {
          title: 'NPV - Valor Presente Líquido',
          icon: <TrendingUp className="h-6 w-6 text-indigo-600" />,
          description: 'Valor presente líquido dos projetos',
          content: 'Análise detalhada do NPV, incluindo metodologia de cálculo e interpretação dos resultados.'
        };
      default:
        return {
          title: 'Indicador não encontrado',
          icon: <Activity className="h-6 w-6 text-gray-600" />,
          description: 'Indicador não reconhecido',
          content: 'O indicador solicitado não foi encontrado.'
        };
    }
  };

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

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{details.content}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">🚧 Em Desenvolvimento</h3>
                  <p className="text-blue-700 text-sm">
                    Esta página está sendo desenvolvida. Em breve teremos gráficos interativos, 
                    relatórios detalhados e análises aprofundadas para este indicador.
                  </p>
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
                <Button variant="outline" className="w-full justify-start">
                  📊 Exportar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📈 Ver Tendências
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🎯 Definir Metas
                </Button>
                <Button variant="outline" className="w-full justify-start">
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
                    <p className="text-gray-600">Hoje, {new Date().toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">🔄 Frequência:</span>
                    <p className="text-gray-600">Atualizado em tempo real</p>
                  </div>
                  <div>
                    <span className="font-medium">📊 Fonte dos Dados:</span>
                    <p className="text-gray-600">Sistema de Gestão de Projetos</p>
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

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
  ArrowDownRight
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
              
              {/* Enhanced Progress Bar */}
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
                {/* Progress indicator */}
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
      </div>
    </Layout>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  Target,
  Download,
  Edit,
  Trash2,
  CheckSquare,
  Building,
  AlertTriangle,
  Shield,
  TrendingDown
} from 'lucide-react';
import { db, Project, Task, Comment, ProjectFile, formatCurrency } from '../lib/database';
import { historyService } from '../lib/historyService';
import TaskManager from '../components/TaskManager';
import CommentManager from '../components/CommentManager';
import FileManager from '../components/FileManager';
import ProjectForm from '../components/ProjectForm';
import RiskManager from '../components/RiskManager';
import ProjectHistory from '../components/ProjectHistory';
import jsPDF from 'jspdf';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = () => {
    if (id) {
      const projectData = db.getProject(id);
      setProject(projectData);
      
      if (projectData) {
        setTasks(db.getProjectTasks(id));
        setComments(db.getProjectComments(id));
        setFiles(db.getProjectFiles(id));
      }
    }
  };

  const calculateProjectProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'Concluída').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleEditProject = () => {
    setIsEditDialogOpen(true);
  };

  const handleProjectUpdate = () => {
    const oldProject = project;
    loadProjectData();
    setIsEditDialogOpen(false);
    
    if (id && oldProject) {
      historyService.addEntry(
        id,
        'Projeto editado e atualizado',
        'Usuário do Sistema',
        { 
          previousData: oldProject,
          timestamp: new Date().toISOString()
        }
      );
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
  };

  const generateProjectPDF = () => {
    if (!project) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 20;
    const lineHeight = 5;
    const margin = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTIGE COSMÉTICOS', margin, currentY);
    currentY += 10;
    
    doc.setFontSize(14);
    doc.text('RELATÓRIO EXECUTIVO DE PROJETO', margin, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Criado por: Danilo Araujo', margin, currentY);
    currentY += 15;

    // Project Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(project.name, margin, currentY);
    currentY += 12;

    // Project Details in two columns
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const leftColumn = pageWidth / 2 - 10;
    const rightColumn = pageWidth / 2 + 10;
    
    // Left column
    let leftY = currentY;
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.client, margin + 25, leftY);
    leftY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Responsável:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.responsible, margin + 30, leftY);
    leftY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.status, margin + 25, leftY);
    leftY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Prioridade:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.priority, margin + 30, leftY);
    leftY += lineHeight;

    // Right column
    let rightY = currentY;
    doc.setFont('helvetica', 'bold');
    doc.text('Fase:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.phase, rightColumn + 20, rightY);
    rightY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Progresso:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${calculateProjectProgress()}%`, rightColumn + 30, rightY);
    rightY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Data Início:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.startDate || 'N/A', rightColumn + 30, rightY);
    rightY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Previsão Fim:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.endDate || 'N/A', rightColumn + 35, rightY);
    rightY += lineHeight;

    currentY = Math.max(leftY, rightY) + 8;

    // Financial Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RESUMO FINANCEIRO', margin, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    leftY = currentY;
    doc.setFont('helvetica', 'bold');
    doc.text('Valor Estimado:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(project.estimatedValue, project.currency), margin + 35, leftY);
    leftY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Margem:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    const margin_value = project.estimatedValue - project.finalValue;
    doc.text(formatCurrency(margin_value, project.currency), margin + 25, leftY);
    leftY += lineHeight;

    rightY = currentY;
    doc.setFont('helvetica', 'bold');
    doc.text('Valor Final:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(project.finalValue, project.currency), rightColumn + 25, rightY);
    rightY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Moeda:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.currency, rightColumn + 20, rightY);
    rightY += lineHeight;

    currentY = Math.max(leftY, rightY) + 8;

    // Performance Metrics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MÉTRICAS DE PERFORMANCE', margin, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const completedTasks = tasks.filter(t => t.status === 'Concluída').length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    leftY = currentY;
    doc.setFont('helvetica', 'bold');
    doc.text('Taxa de Conclusão:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${completionRate}%`, margin + 45, leftY);
    leftY += lineHeight;
    
    const daysInProgress = project.startDate ? 
      Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    doc.setFont('helvetica', 'bold');
    doc.text('Dias em Execução:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${daysInProgress}`, margin + 45, leftY);
    leftY += lineHeight;
    
    rightY = currentY;
    doc.setFont('helvetica', 'bold');
    doc.text('Tarefas:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${completedTasks}/${tasks.length}`, rightColumn + 25, rightY);
    rightY += lineHeight;
    
    const progressPerDay = daysInProgress > 0 ? (calculateProjectProgress() / daysInProgress).toFixed(1) : '0';
    doc.setFont('helvetica', 'bold');
    doc.text('Velocidade:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${progressPerDay}%/dia`, rightColumn + 25, rightY);
    rightY += lineHeight;

    currentY = Math.max(leftY, rightY) + 8;

    // Description
    if (project.description && currentY < pageHeight - 50) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Descrição:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const descriptionLines = doc.splitTextToSize(project.description, pageWidth - 2 * margin);
      doc.text(descriptionLines.slice(0, 4), margin, currentY);
      currentY += Math.min(descriptionLines.length, 4) * lineHeight + 5;
    }

    // Tasks with completion status
    if (tasks.length > 0 && currentY < pageHeight - 40) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Tarefas:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      const completedTasksList = tasks.filter(t => t.status === 'Concluída').slice(0, 3);
      const pendingTasksList = tasks.filter(t => t.status !== 'Concluída').slice(0, 3);
      
      if (completedTasksList.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Concluídas:', margin, currentY);
        currentY += 3;
        doc.setFont('helvetica', 'normal');
        
        completedTasksList.forEach(task => {
          if (currentY > pageHeight - 25) return;
          doc.text(`✓ ${task.name}`, margin + 5, currentY);
          currentY += 3;
        });
        currentY += 2;
      }
      
      if (pendingTasksList.length > 0 && currentY < pageHeight - 20) {
        doc.setFont('helvetica', 'bold');
        doc.text('Pendentes:', margin, currentY);
        currentY += 3;
        doc.setFont('helvetica', 'normal');
        
        pendingTasksList.forEach(task => {
          if (currentY > pageHeight - 15) return;
          doc.text(`○ ${task.name}`, margin + 5, currentY);
          currentY += 3;
        });
      }
    }

    doc.save(`projeto-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
    
    if (id) {
      historyService.addEntry(
        id,
        'Relatório PDF gerado e baixado',
        'Usuário do Sistema'
      );
    }
  };

  const handleFinishProject = () => {
    if (project) {
      db.updateProject(project.id, { status: 'Concluída' });
      setProject({ ...project, status: 'Concluída' });
      
      historyService.addEntry(
        project.id,
        'Projeto finalizado com sucesso',
        'Usuário do Sistema',
        { 
          previousStatus: project.status,
          newStatus: 'Concluída',
          finishedAt: new Date().toISOString()
        }
      );
    }
  };

  const handleDeleteProject = () => {
    if (project && window.confirm('Tem certeza que deseja excluir este projeto?')) {
      historyService.addEntry(
        project.id,
        'Projeto marcado para exclusão',
        'Usuário do Sistema',
        { deletedProject: project }
      );
      
      db.deleteProject(project.id);
      window.location.href = '/';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Progresso':
        return 'bg-blue-100 text-blue-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Concluída':
        return 'bg-green-100 text-green-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'text-red-600';
      case 'Média':
        return 'text-yellow-600';
      case 'Baixa':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Mock data para riscos - em produção viria do banco de dados
  const getMockRisks = () => {
    return [
      {
        id: '1',
        name: 'Atraso na entrega',
        impact: 'Alto',
        probability: 'Média',
        status: 'Ativo'
      },
      {
        id: '2', 
        name: 'Mudança de escopo',
        impact: 'Médio',
        probability: 'Alta',
        status: 'Mitigado'
      }
    ];
  };

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-red-100 text-red-800';
      case 'Mitigado': return 'bg-green-100 text-green-800';
      case 'Ocorrido': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskImpactColor = (impact: string) => {
    switch (impact) {
      case 'Alto': return 'text-red-600';
      case 'Médio': return 'text-yellow-600';
      case 'Baixo': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Projeto não encontrado</p>
        </div>
      </Layout>
    );
  }

  const currentProgress = calculateProjectProgress();
  const mockRisks = getMockRisks();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-1">Detalhes completos do projeto</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={generateProjectPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleEditProject} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            {project.status !== 'Concluída' && (
              <Button onClick={handleFinishProject} variant="outline">
                <CheckSquare className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            )}
            <Button onClick={handleDeleteProject} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cliente</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.client}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responsável</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.responsible}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{currentProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(currentProgress)} shadow-sm`}
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Informações do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descrição</h4>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Prioridade
                    </h4>
                    <span className={`font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Fase</h4>
                    <span className="text-muted-foreground">{project.phase}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Início
                    </h4>
                    <span className="text-muted-foreground">{project.startDate || 'Não definida'}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Previsão de Conclusão
                    </h4>
                    <span className="text-muted-foreground">{project.endDate || 'Não definida'}</span>
                  </div>
                </div>

                {/* Nova Seção de Riscos */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Riscos do Projeto
                  </h4>
                  {mockRisks.length > 0 ? (
                    <div className="space-y-2">
                      {mockRisks.map((risk) => (
                        <div key={risk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {risk.status === 'Ativo' ? (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              ) : risk.status === 'Mitigado' ? (
                                <Shield className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-orange-500" />
                              )}
                              <span className="font-medium text-sm">{risk.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <span className={getRiskImpactColor(risk.impact)}>
                                {risk.impact}
                              </span>
                            </Badge>
                            <Badge className={getRiskStatusColor(risk.status)} variant="secondary">
                              {risk.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          {mockRisks.filter(r => r.status === 'Ativo').length} risco(s) ativo(s) • 
                          {mockRisks.filter(r => r.status === 'Mitigado').length} mitigado(s)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">Nenhum risco identificado</p>
                    </div>
                  )}
                </div>

                {project.teamMembers && (
                  <div>
                    <h4 className="font-semibold mb-2">Envolvidos no Projeto</h4>
                    <p className="text-muted-foreground">{project.teamMembers}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Valor Estimado</h4>
                  <p className="text-2xl font-bold">{formatCurrency(project.estimatedValue, project.currency)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Valor Final</h4>
                  <p className="text-2xl font-bold">{formatCurrency(project.finalValue, project.currency)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Moeda</h4>
                  <p className="text-muted-foreground">{project.currency}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for Tasks, Comments, Files, Risks, History */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
            <TabsTrigger value="comments">Comentários ({comments.length})</TabsTrigger>
            <TabsTrigger value="files">Arquivos ({files.length})</TabsTrigger>
            <TabsTrigger value="risks">Riscos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <TaskManager projectId={project.id} />
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <CommentManager projectId={project.id} />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <FileManager projectId={project.id} />
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <RiskManager projectId={project.id} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ProjectHistory projectId={project.id} />
          </TabsContent>
        </Tabs>

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
            </DialogHeader>
            {project && (
              <ProjectForm 
                initialData={project}
                onSubmit={handleProjectUpdate}
                onCancel={handleCancelEdit}
                isEditing={true}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProjectDetails;

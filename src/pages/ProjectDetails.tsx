
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, User, Flag, Clock, Target, Download, Edit, Trash2, CheckSquare, Building, AlertTriangle, Shield, TrendingDown } from 'lucide-react';
import { db, formatCurrency } from '../lib/database';
import { historyService } from '../lib/historyService';
import TaskManager from '../components/TaskManager';
import CommentManager from '../components/CommentManager';
import FileManager from '../components/FileManager';
import ProjectForm from '../components/ProjectForm';
import RiskManager from '../components/RiskManager';
import ProjectHistory from '../components/ProjectHistory';
import ConfirmationDialog from '../components/ConfirmationDialog';
import ProgressBar from '../components/ProgressBar';
import jsPDF from 'jspdf';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  
  // Contadores das abas
  const [taskCount, setTaskCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [riskCount, setRiskCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = () => {
    if (id) {
      const projectData = db.getProject(id);
      setProject(projectData);
      if (projectData) {
        const projectTasks = db.getProjectTasks(id);
        setTasks(projectTasks);
        setTaskCount(projectTasks.length);
        setCommentCount(db.getProjectComments(id).length);
        setFileCount(db.getProjectFiles(id).length);
        setHistoryCount(historyService.getProjectHistory(id).length);
      }
    }
  };

  const calculateProjectProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((task) => task.status === 'Concluída').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'from-red-400 via-red-500 to-red-600';
    if (progress < 70) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    return 'from-green-400 via-green-500 to-green-600';
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
    let currentY = 20;
    const lineHeight = 6;
    const margin = 20;

    // Header com fundo azul
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título em branco
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO EXECUTIVO DE PROJETO', margin, 25);
    
    // Reset cor do texto para preto
    doc.setTextColor(0, 0, 0);
    currentY = 50;

    // Nome do projeto
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(project.name, margin, currentY);
    currentY += 15;

    // Informações do projeto em tabela
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const projectInfo = [
      ['Cliente:', project.client || 'N/A'],
      ['Responsável:', project.responsible || 'N/A'],
      ['Status:', project.status || 'N/A'],
      ['Prioridade:', project.priority || 'N/A'],
      ['Data Início:', project.startDate || 'N/A'],
      ['Previsão Fim:', project.endDate || 'N/A'],
      ['Fase:', project.phase || 'N/A'],
    ];

    // Desenhar tabela de informações
    const startY = currentY;
    const rowHeight = 8;
    const col1Width = 50;
    const col2Width = 80;

    projectInfo.forEach((row, index) => {
      const y = startY + (index * rowHeight);
      
      // Background alternado
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, y - 2, col1Width + col2Width, rowHeight, 'F');
      }
      
      // Label em negrito
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], margin + 2, y + 4);
      
      // Valor normal
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], margin + col1Width + 2, y + 4);
    });

    currentY = startY + (projectInfo.length * rowHeight) + 15;

    // Adicionar barra de progresso menor e estilizada após 'fase'
    const progress = calculateProjectProgress();
    doc.setFont('helvetica', 'bold');
    doc.text(`Progresso: ${progress}%`, margin, currentY);
    currentY += 8;

    // Desenhar barra de progresso menor
    const progressBarWidth = 80; // Reduzido de 120 para 80
    const progressBarHeight = 8; // Reduzido de 12 para 8
    
    // Background da barra com sombra
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, currentY, progressBarWidth, progressBarHeight, 'F');
    
    // Preenchimento da barra baseado no progresso
    if (progress > 0) {
      const fillWidth = (progressBarWidth * progress) / 100;
      if (progress < 30) {
        doc.setFillColor(239, 68, 68); // Vermelho
      } else if (progress < 70) {
        doc.setFillColor(245, 158, 11); // Amarelo
      } else {
        doc.setFillColor(34, 197, 94); // Verde
      }
      doc.rect(margin, currentY, fillWidth, progressBarHeight, 'F');
      
      // Adicionar efeito de brilho simulado
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, currentY, fillWidth, progressBarHeight / 3, 'F');
    }
    
    // Borda da barra
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, currentY, progressBarWidth, progressBarHeight);
    
    currentY += progressBarHeight + 15;

    // Resumo financeiro
    if (project.estimatedValue || project.finalValue) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('RESUMO FINANCEIRO', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const financialInfo = [
        ['Valor Estimado:', formatCurrency(project.estimatedValue || 0, project.currency || 'BRL')],
        ['Valor Final:', formatCurrency(project.finalValue || 0, project.currency || 'BRL')],
        ['Margem:', formatCurrency((project.estimatedValue || 0) - (project.finalValue || 0), project.currency || 'BRL')],
        ['Moeda:', project.currency || 'BRL']
      ];

      financialInfo.forEach((row, index) => {
        const y = currentY + (index * rowHeight);
        
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(margin, y - 2, col1Width + col2Width, rowHeight, 'F');
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], margin + 2, y + 4);
        
        doc.setFont('helvetica', 'normal');
        doc.text(row[1], margin + col1Width + 2, y + 4);
      });

      currentY += (financialInfo.length * rowHeight) + 15;
    }

    // Métricas de performance
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MÉTRICAS DE PERFORMANCE', margin, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const metricsInfo = [
      ['Taxa de Conclusão:', `${progress}%`],
      ['Tarefas:', `${tasks.filter(task => task.status === 'Concluída').length}/${tasks.length}`],
    ];

    metricsInfo.forEach((row, index) => {
      const y = currentY + (index * rowHeight);
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, y - 2, col1Width + col2Width, rowHeight, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], margin + 2, y + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], margin + col1Width + 2, y + 4);
    });

    currentY += (metricsInfo.length * rowHeight) + 15;

    // Descrição
    if (project.description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DESCRIÇÃO', margin, currentY);
      currentY += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const descriptionLines = doc.splitTextToSize(project.description, pageWidth - 2 * margin);
      doc.text(descriptionLines, margin, currentY);
      currentY += descriptionLines.length * 5 + 10;
    }

    // Salvar PDF
    doc.save(`projeto-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
    
    if (id) {
      historyService.addEntry(id, 'Relatório PDF gerado e baixado', 'Usuário do Sistema');
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
    if (project) {
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
      case 'Em Progresso': return 'bg-blue-100 text-blue-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Concluída': return 'bg-green-100 text-green-800';
      case 'Atrasado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">Detalhes completos do projeto</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateProjectPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleEditProject}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFinishDialogOpen(true)}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Barra de Progresso Estilizada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm font-bold">{currentProgress}%</span>
              </div>
              <ProgressBar 
                progress={currentProgress} 
                showPercentage={false}
                size="lg"
                animated={true}
              />
              <p className="text-xs text-muted-foreground">
                {tasks.filter(task => task.status === 'Concluída').length} de {tasks.length} tarefas concluídas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Project Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{project.client || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(project.status)}>{project.status || 'N/A'}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getPriorityColor(project.priority)}>{project.priority || 'N/A'}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prazo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} -{' '}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{project.phase || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{project.company || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{project.risk || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Tendência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{project.trend || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com contadores atualizados */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tasks">Tarefas ({taskCount})</TabsTrigger>
            <TabsTrigger value="comments">Comentários ({commentCount})</TabsTrigger>
            <TabsTrigger value="files">Arquivos ({fileCount})</TabsTrigger>
            <TabsTrigger value="risks">Riscos ({riskCount})</TabsTrigger>
            <TabsTrigger value="history">Histórico ({historyCount})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <TaskManager 
              projectId={id!} 
              onTaskUpdate={() => {
                setTaskCount(db.getProjectTasks(id!).length);
                loadProjectData(); // Recarregar para atualizar o progresso
              }}
            />
          </TabsContent>
          
          <TabsContent value="comments">
            <CommentManager 
              projectId={id!} 
              onCommentCountChange={setCommentCount}
            />
          </TabsContent>
          
          <TabsContent value="files">
            <FileManager 
              projectId={id!} 
              onFileCountChange={setFileCount}
            />
          </TabsContent>
          
          <TabsContent value="risks">
            <RiskManager 
              projectId={id!} 
              onRiskCountChange={setRiskCount}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <ProjectHistory 
              projectId={id!} 
              onHistoryCountChange={setHistoryCount}
            />
          </TabsContent>
        </Tabs>

        {/* Diálogos */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
            </DialogHeader>
            <ProjectForm
              initialData={project}
              onSubmit={handleProjectUpdate}
              onCancel={handleCancelEdit}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteProject}
          title="Excluir Projeto"
          description={`Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
        />

        <ConfirmationDialog
          isOpen={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
          onConfirm={handleFinishProject}
          title="Finalizar Projeto"
          description={`Tem certeza que deseja finalizar o projeto "${project.name}"?`}
          confirmText="Finalizar"
          cancelText="Cancelar"
        />
      </div>
    </Layout>
  );
};

export default ProjectDetails;

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
  Building
} from 'lucide-react';
import { db, Project, Task, Comment, ProjectFile, formatCurrency } from '../lib/database';
import TaskManager from '../components/TaskManager';
import CommentManager from '../components/CommentManager';
import FileManager from '../components/FileManager';
import ProjectForm from '../components/ProjectForm';
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

  const handleEditProject = () => {
    setIsEditDialogOpen(true);
  };

  const handleProjectUpdate = () => {
    loadProjectData();
    setIsEditDialogOpen(false);
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
    doc.text('Relatório do Projeto', margin, currentY);
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
    doc.text(`${project.progress}%`, rightColumn + 30, rightY);
    rightY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Início:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.startDate || 'N/A', rightColumn + 20, rightY);
    rightY += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.text('Fim:', rightColumn, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(project.endDate || 'N/A', rightColumn + 20, rightY);
    rightY += lineHeight;

    currentY = Math.max(leftY, rightY) + 8;

    // Financial Information
    if (project.estimatedValue > 0 || project.finalValue > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Informações Financeiras:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Valor Estimado: ${formatCurrency(project.estimatedValue, project.currency)}`, margin + 5, currentY);
      currentY += lineHeight;
      doc.text(`Valor Final: ${formatCurrency(project.finalValue, project.currency)}`, margin + 5, currentY);
      currentY += 8;
    }

    // Project Performance Metrics
    const allProjects = db.getAllProjects().filter(p => !p.isDeleted);
    const activeProjects = allProjects.filter(p => p.status !== 'Concluído');
    const onTimeProjects = activeProjects.filter(p => p.status !== 'Atrasado').length;
    const totalActiveProjects = activeProjects.length;
    const onTimeRate = totalActiveProjects > 0 ? Math.round((onTimeProjects / totalActiveProjects) * 100) : 0;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores de Performance:', margin, currentY);
    currentY += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Taxa de Atendimento do Prazo: ${onTimeRate}%`, margin + 5, currentY);
    currentY += lineHeight;
    
    const daysInProgress = project.startDate ? 
      Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    doc.text(`Dias em Execução: ${daysInProgress} dias`, margin + 5, currentY);
    currentY += lineHeight;
    
    const progressPerDay = daysInProgress > 0 ? (project.progress / daysInProgress).toFixed(2) : '0';
    doc.text(`Progresso Médio/Dia: ${progressPerDay}%`, margin + 5, currentY);
    currentY += 8;

    // Description
    if (project.description) {
      doc.setFont('helvetica', 'bold');
      doc.text('Descrição:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      const descriptionLines = doc.splitTextToSize(project.description, pageWidth - 2 * margin);
      doc.text(descriptionLines.slice(0, 3), margin + 5, currentY);
      currentY += Math.min(descriptionLines.length, 3) * lineHeight + 8;
    }

    // Tasks
    if (tasks.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Tarefas:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      const completedTasks = tasks.filter(t => t.status === 'Concluída').length;
      doc.text(`Total: ${tasks.length} | Concluídas: ${completedTasks} | Pendentes: ${tasks.length - completedTasks}`, margin + 5, currentY);
      currentY += lineHeight + 2;
      
      tasks.slice(0, 6).forEach(task => {
        const status = task.status === 'Concluída' ? '[X]' : '[ ]';
        const taskText = `${status} ${task.name}`;
        const taskLines = doc.splitTextToSize(taskText, pageWidth - 2 * margin - 10);
        
        if (currentY + taskLines.length * lineHeight > pageHeight - 40) {
          return;
        }
        
        doc.text(taskLines, margin + 5, currentY);
        currentY += taskLines.length * lineHeight;
      });
      
      if (tasks.length > 6) {
        doc.text(`... e mais ${tasks.length - 6} tarefas`, margin + 5, currentY);
        currentY += lineHeight;
      }
      currentY += 5;
    }

    // Comments Summary
    if (comments.length > 0 && currentY < pageHeight - 35) {
      doc.setFont('helvetica', 'bold');
      doc.text('Comentários:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de comentários: ${comments.length}`, margin + 5, currentY);
      currentY += lineHeight;
      
      comments.slice(0, 2).forEach(comment => {
        if (currentY > pageHeight - 30) return;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${comment.author}:`, margin + 5, currentY);
        doc.setFont('helvetica', 'normal');
        
        const commentLines = doc.splitTextToSize(comment.text, pageWidth - 2 * margin - 10);
        doc.text(commentLines.slice(0, 1), margin + 5, currentY + lineHeight);
        currentY += lineHeight + 3;
      });
      currentY += 3;
    }

    // Files
    if (files.length > 0 && currentY < pageHeight - 25) {
      doc.setFont('helvetica', 'bold');
      doc.text('Arquivos:', margin, currentY);
      currentY += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de arquivos: ${files.length}`, margin + 5, currentY);
      currentY += lineHeight;
      
      files.slice(0, 3).forEach(file => {
        if (currentY > pageHeight - 20) return;
        doc.text(`• ${file.name}`, margin + 5, currentY);
        currentY += lineHeight;
      });
      
      if (files.length > 3) {
        doc.text(`... e mais ${files.length - 3} arquivos`, margin + 5, currentY);
      }
    }

    doc.save(`projeto-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
  };

  const handleFinishProject = () => {
    if (project) {
      db.updateProject(project.id, { status: 'Concluído' });
      setProject({ ...project, status: 'Concluído' });
    }
  };

  const handleDeleteProject = () => {
    if (project && window.confirm('Tem certeza que deseja excluir este projeto?')) {
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
      case 'Concluído':
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

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Projeto não encontrado</p>
        </div>
      </Layout>
    );
  }

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
            {project.status !== 'Concluído' && (
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
              <div className="text-2xl font-bold">{project.progress}%</div>
              <Progress value={project.progress} className="mt-2" />
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
                      Data de Fim
                    </h4>
                    <span className="text-muted-foreground">{project.endDate || 'Não definida'}</span>
                  </div>
                </div>
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

        {/* Tabs for Tasks, Comments, Files */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
            <TabsTrigger value="comments">Comentários ({comments.length})</TabsTrigger>
            <TabsTrigger value="files">Arquivos ({files.length})</TabsTrigger>
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

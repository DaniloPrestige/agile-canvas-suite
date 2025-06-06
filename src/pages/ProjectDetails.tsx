
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Flag, Clock, User, DollarSign } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProgressBar from '../components/ProgressBar';
import ProjectForm from '../components/ProjectForm';
import TaskManager from '../components/TaskManager';
import CommentManager from '../components/CommentManager';
import FileManager from '../components/FileManager';
import { db, Project, formatCurrency, Task, HistoryEntry } from '../lib/database';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (id) {
      loadProject();
      loadHistory();
    }
  }, [id]);

  const loadProject = () => {
    if (id) {
      const projectData = db.getProject(id);
      if (projectData) {
        setProject(projectData);
        updateProjectProgress();
      }
    }
  };

  const loadHistory = () => {
    if (id) {
      setHistory(db.getProjectHistory(id));
    }
  };

  const updateProjectProgress = () => {
    if (!id) return;
    
    const tasks = db.getProjectTasks(id);
    const completedTasks = tasks.filter(task => task.status === 'Concluída');
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    db.updateProject(id, { progress });
    db.addHistoryEntry(id, 'system', `Progresso atualizado para ${progress}%`);
    
    loadProject();
    loadHistory();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'destructive';
      case 'Média': return 'secondary';
      case 'Baixa': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Progresso': return 'default';
      case 'Pendente': return 'secondary';
      case 'Concluído': return 'outline';
      case 'Atrasado': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground">{project.client}</p>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Projeto
            </Button>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Projeto</DialogTitle>
              </DialogHeader>
              <ProjectForm 
                project={project}
                onSubmit={() => {
                  setIsEditDialogOpen(false);
                  loadProject();
                  db.addHistoryEntry(project.id, 'user', 'Projeto editado');
                  loadHistory();
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  <Badge variant={getPriorityColor(project.priority)}>{project.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{project.responsible}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Estimado</p>
                  <p className="font-medium">{formatCurrency(project.estimatedValue, project.currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Progresso do Projeto</h3>
                <span className="text-sm text-muted-foreground">{project.progress}%</span>
              </div>
              <ProgressBar progress={project.progress} showPercentage={false} />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fase</p>
                    <p className="font-medium">{project.phase}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="font-medium">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(project.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    <p className="font-medium">{formatCurrency(project.estimatedValue, project.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Final</p>
                    <p className="font-medium">{formatCurrency(project.finalValue, project.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moeda</p>
                    <p className="font-medium">{project.currency}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description || 'Nenhuma descrição fornecida'}</p>
              </CardContent>
            </Card>

            {project.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Tarefas</CardTitle>
                <CardDescription>Gerencie as tarefas relacionadas a este projeto</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskManager projectId={project.id} onTaskUpdate={updateProjectProgress} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comentários do Projeto</CardTitle>
                <CardDescription>Histórico de comentários e discussões</CardDescription>
              </CardHeader>
              <CardContent>
                <CommentManager projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Arquivos do Projeto</CardTitle>
                <CardDescription>Documentos e arquivos relacionados ao projeto</CardDescription>
              </CardHeader>
              <CardContent>
                <FileManager projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico do Projeto</CardTitle>
                <CardDescription>Registro completo de todas as atividades</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum histórico encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProjectDetails;

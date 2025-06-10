import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, Project, formatCurrency } from '../lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectForm from '../components/ProjectForm';
import StatusCard from '../components/StatusCard';
import { Search, Eye, Edit, Trash2, Download, Plus, Filter, Flag, CheckSquare, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'finished' | 'deleted'>('active');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = db.getAllProjects();
    setProjects(allProjects);
  };

  const calculateProjectProgress = (projectId: string): number => {
    const tasks = db.getProjectTasks(projectId);
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === 'Concluída').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    if (activeTab === 'active') {
      filtered = filtered.filter(p => p.status !== 'Concluída' && !p.isDeleted);
    } else if (activeTab === 'finished') {
      filtered = filtered.filter(p => p.status === 'Concluída' && !p.isDeleted);
    } else if (activeTab === 'deleted') {
      filtered = filtered.filter(p => p.isDeleted);
    }

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all' && activeTab === 'active') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (priorityFilter !== 'all' && activeTab === 'active') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    return filtered.map(project => ({
      ...project,
      progress: calculateProjectProgress(project.id)
    }));
  };

  const getTabCounts = () => {
    const activeProjects = projects.filter(p => p.status !== 'Concluída' && !p.isDeleted);
    const finishedProjects = projects.filter(p => p.status === 'Concluída' && !p.isDeleted);
    const deletedProjects = projects.filter(p => p.isDeleted);

    return {
      active: activeProjects.length,
      finished: finishedProjects.length,
      deleted: deletedProjects.length
    };
  };

  const getStatusCards = () => {
    const currentTabProjects = getFilteredProjects();
    
    if (activeTab === 'active') {
      const totalProjects = currentTabProjects.length;
      const inProgress = currentTabProjects.filter(p => p.status === 'Em Progresso').length;
      const pending = currentTabProjects.filter(p => p.status === 'Pendente').length;
      const delayed = currentTabProjects.filter(p => p.status === 'Atrasado').length;

      return [
        { title: 'Total de Projetos', count: totalProjects, color: 'blue' as const },
        { title: 'Em Progresso', count: inProgress, color: 'yellow' as const },
        { title: 'Pendentes', count: pending, color: 'gray' as const },
        { title: 'Atrasados', count: delayed, color: 'red' as const }
      ];
    } else if (activeTab === 'finished') {
      const totalFinished = currentTabProjects.length;
      return [
        { title: 'Concluídos', count: totalFinished, color: 'green' as const }
      ];
    } else if (activeTab === 'deleted') {
      const totalDeleted = currentTabProjects.length;
      return [
        { title: 'Excluídos', count: totalDeleted, color: 'red' as const }
      ];
    }

    return [];
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

  const handleFinishProject = (project: Project) => {
    db.updateProject(project.id, { status: 'Concluída' });
    loadProjects();
    setActiveTab('finished');
  };

  const handleDeleteProject = (project: Project) => {
    db.deleteProject(project.id);
    loadProjects();
    setActiveTab('deleted');
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (project: Project, newStatus: string) => {
    if (newStatus === 'active') {
      db.restoreProject(project.id);
      db.updateProject(project.id, { status: 'Em Progresso' });
      setActiveTab('active');
    } else if (newStatus === 'finished') {
      db.updateProject(project.id, { status: 'Concluída' });
      setActiveTab('finished');
    } else if (newStatus === 'deleted') {
      db.deleteProject(project.id);
      setActiveTab('deleted');
    }
    loadProjects();
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects([...selectedProjects, projectId]);
    } else {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProjectIds = getFilteredProjects().map(p => p.id);
      setSelectedProjects(allProjectIds);
    } else {
      setSelectedProjects([]);
    }
  };

  const clearSelection = () => {
    setSelectedProjects([]);
  };

  const bulkChangeStatus = (newStatus: string) => {
    selectedProjects.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        handleStatusChange(project, newStatus);
      }
    });
    clearSelection();
  };

  const bulkDeleteProjects = () => {
    selectedProjects.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        db.deleteProject(project.id);
      }
    });
    loadProjects();
    clearSelection();
    setActiveTab('deleted');
  };

  const exportSelectedProjects = () => {
    if (selectedProjects.length === 0) {
      alert('Selecione pelo menos um projeto para exportar');
      return;
    }

    const selectedProjectsData = projects.filter(p => selectedProjects.includes(p.id));
    generateExecutiveReport(selectedProjectsData);
  };

  const generateExecutiveReport = (projectsData: Project[]) => {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFillColor(52, 144, 220);
    pdf.rect(0, 0, 210, 30, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('PRESTIGE COSMETICOS', 20, 15);
    
    pdf.setFontSize(14);
    pdf.text('RELATÓRIO EXECUTIVO DE PROJETOS', 20, 25);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${dateStr}, ${timeStr} | Responsável: Sistema`, 20, 35);

    // Executive Summary
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text('RESUMO EXECUTIVO', 20, 55);
    
    pdf.rect(15, 60, 180, 40);
    
    const totalProjects = projectsData.length;
    const completedProjects = projectsData.filter(p => p.status === 'Concluída').length;
    const activeProjects = projectsData.filter(p => p.status !== 'Concluída' && !p.isDeleted).length;
    const delayedProjects = projectsData.filter(p => p.status === 'Atrasado').length;
    const totalValue = projectsData.reduce((sum, p) => sum + (p.finalValue || p.estimatedValue), 0);
    const avgProgress = activeProjects > 0 ? 
      Math.round(projectsData.reduce((sum, p) => sum + calculateProjectProgress(p.id), 0) / totalProjects) : 0;
    const onTimeRate = activeProjects > 0 ? Math.round(((activeProjects - delayedProjects) / activeProjects) * 100) : 100;

    pdf.setFontSize(10);
    let yPos = 70;
    
    pdf.text(`Total de Projetos: ${totalProjects}`, 20, yPos);
    pdf.text(`Valor Total do Portfolio: R$ ${totalValue.toFixed(2)}`, 120, yPos);
    
    yPos += 8;
    pdf.text(`Projetos Concluídos: ${completedProjects} (${Math.round((completedProjects/totalProjects)*100)}%)`, 20, yPos);
    pdf.text(`Progresso Médio: ${avgProgress}%`, 120, yPos);
    
    yPos += 8;
    pdf.text(`Projetos Ativos: ${activeProjects}`, 20, yPos);
    pdf.text(`Projetos Atrasados: ${delayedProjects}`, 120, yPos);
    
    yPos += 8;
    pdf.text(`Taxa de Entrega no Prazo: ${onTimeRate}%`, 20, yPos);

    // Project Details
    yPos = 120;
    
    projectsData.forEach((project, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(12);
      pdf.text(`${index + 1}. ${project.name}`, 20, yPos);
      
      pdf.rect(15, yPos + 5, 180, 35);
      
      pdf.setFontSize(10);
      pdf.text(`Cliente: ${project.client} | Responsável: ${project.responsible}`, 20, yPos + 15);
      pdf.text(`Status: ${project.status} | Prioridade: ${project.priority} | Progresso: ${calculateProjectProgress(project.id)}%`, 20, yPos + 25);
      
      if (project.teamMembers) {
        pdf.text(`Equipe: ${project.teamMembers}`, 20, yPos + 35);
      }
      
      yPos += 50;
    });

    pdf.save('relatorio-executivo-projetos.pdf');
  };

  const tabCounts = getTabCounts();
  const filteredProjects = getFilteredProjects();
  const statusCards = getStatusCards();

  return (
    <TooltipProvider>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">🚀 Gerencie todos os seus projetos em um só lugar</h1>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="bg-white text-foreground border border-border hover:bg-accent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Criar um novo projeto</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusCards.map((card, index) => (
              <StatusCard key={index} {...card} />
            ))}
          </div>

          {/* Filter Section */}
          {activeTab === 'active' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos por nome, cliente, responsável ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Flag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedProjects.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedProjects.length} projeto(s) selecionado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={exportSelectedProjects}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
                {activeTab === 'active' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => bulkChangeStatus('finished')}>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Finalizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={bulkDeleteProjects}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </>
                )}
                {activeTab === 'finished' && (
                  <Button size="sm" variant="outline" onClick={() => bulkChangeStatus('active')}>
                    Reativar
                  </Button>
                )}
                {activeTab === 'deleted' && (
                  <Button size="sm" variant="outline" onClick={() => bulkChangeStatus('active')}>
                    Restaurar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tabs with extended width */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'finished' | 'deleted')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="active" className="flex items-center gap-2 flex-1 justify-center">
                Ativos ({tabCounts.active})
              </TabsTrigger>
              <TabsTrigger value="finished" className="flex items-center gap-2 flex-1 justify-center">
                Finalizados ({tabCounts.finished})
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex items-center gap-2 flex-1 justify-center">
                Lixeira ({tabCounts.deleted})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nenhum projeto encontrado</p>
                  <p className="text-gray-400 mt-2">
                    {activeTab === 'active' && 'Comece criando um novo projeto!'}
                    {activeTab === 'finished' && 'Nenhum projeto foi finalizado ainda.'}
                    {activeTab === 'deleted' && 'Nenhum projeto foi excluído.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600">Selecionar todos ({filteredProjects.length})</span>
                  </div>

                  {/* Projects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={selectedProjects.includes(project.id)}
                              onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Link 
                                  to={`/project/${project.id}`}
                                  className="font-semibold text-lg text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                                >
                                  {project.name}
                                </Link>
                                
                                {/* Action Buttons next to project name */}
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => window.location.href = `/project/${project.id}`}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver Detalhes</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditProject(project)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  {activeTab === 'active' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleFinishProject(project)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <CheckSquare className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Finalizar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteProject(project)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Excluir</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-1">{project.client}</p>
                              
                              {/* Tags */}
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {project.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                      +{project.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                            <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                              {project.priority}
                            </span>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-gray-600">Valor:</span>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(project.finalValue || project.estimatedValue, project.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={() => {
              setIsCreateDialogOpen(false);
              loadProjects();
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingProject(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              initialData={editingProject}
              onSubmit={() => {
                setIsEditDialogOpen(false);
                setEditingProject(null);
                loadProjects();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingProject(null);
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ProjectList;

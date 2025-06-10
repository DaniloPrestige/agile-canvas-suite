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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProjectForm from '../components/ProjectForm';
import StatusCard from '../components/StatusCard';
import { Search, Eye, Edit, Download, Plus, Filter, Flag, CheckSquare, X, MoreHorizontal, Archive, Trash2, RotateCcw, Bell } from 'lucide-react';
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
  const [showDeadlineAlert, setShowDeadlineAlert] = useState(false);

  useEffect(() => {
    loadProjects();
    checkDeadlines();
  }, []);

  const loadProjects = () => {
    const allProjects = db.getAllProjects();
    setProjects(allProjects);
  };

  const checkDeadlines = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const activeProjects = db.getActiveProjects();
    const projectsDueToday = activeProjects.filter(p => p.endDate === todayStr);
    const overDueProjects = activeProjects.filter(p => p.endDate && p.endDate < todayStr);
    
    if (projectsDueToday.length > 0 || overDueProjects.length > 0) {
      setShowDeadlineAlert(true);
    }
  };

  const getProjectsDueToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return db.getActiveProjects().filter(p => p.endDate === today);
  };

  const getOverdueProjects = () => {
    const today = new Date().toISOString().split('T')[0];
    return db.getActiveProjects().filter(p => p.endDate && p.endDate < today);
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
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.teamMembers && project.teamMembers.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleStatusChange = (project: Project, newStatus: string) => {
    if (newStatus === 'active') {
      db.restoreProject(project.id);
      db.updateProject(project.id, { status: 'Em Progresso' });
      db.addHistoryEntry(project.id, 'Usuário', 'Projeto restaurado e movido para ativo');
      setActiveTab('active');
    } else if (newStatus === 'finished') {
      db.updateProject(project.id, { status: 'Concluída' });
      db.addHistoryEntry(project.id, 'Usuário', 'Projeto finalizado');
      setActiveTab('finished');
    } else if (newStatus === 'deleted') {
      db.deleteProject(project.id);
      db.addHistoryEntry(project.id, 'Usuário', 'Projeto movido para lixeira');
      setActiveTab('deleted');
    }
    loadProjects();
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
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
        db.addHistoryEntry(project.id, 'Usuário', 'Projeto excluído em lote');
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
    generateEnhancedPDF(selectedProjectsData);
  };

  const generateEnhancedPDF = (projectsData: Project[]) => {
    const pdf = new jsPDF();
    
    projectsData.forEach((project, projectIndex) => {
      if (projectIndex > 0) {
        pdf.addPage();
      }

      // Header with company branding
      pdf.setFillColor(52, 144, 220);
      pdf.rect(0, 0, 210, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('PRESTIGE COSMÉTICOS', 20, 15);
      
      pdf.setFontSize(14);
      pdf.text('RELATÓRIO EXECUTIVO DE PROJETO', 20, 25);
      
      // Date and responsible
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${dateStr}, ${timeStr} | Responsável: Danilo Araujo`, 20, 35);

      // Project Title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.text(project.name, 20, 50);
      
      // Project Details Section
      pdf.rect(15, 55, 180, 45);
      
      pdf.setFontSize(10);
      let yPos = 65;
      
      pdf.text(`Cliente: ${project.client}`, 20, yPos);
      pdf.text(`Status: ${project.status}`, 120, yPos);
      
      yPos += 8;
      pdf.text(`Responsável: ${project.responsible}`, 20, yPos);
      pdf.text(`Prioridade: ${project.priority}`, 120, yPos);
      
      yPos += 8;
      pdf.text(`Data Início: ${project.startDate || 'N/A'}`, 20, yPos);
      pdf.text(`Previsão Fim: ${project.endDate || 'N/A'}`, 120, yPos);
      
      yPos += 8;
      const progress = calculateProjectProgress(project.id);
      pdf.text(`Progresso: ${progress}%`, 20, yPos);
      pdf.text(`Fase: ${project.phase}`, 120, yPos);

      if (project.teamMembers) {
        yPos += 8;
        pdf.text(`Envolvidos: ${project.teamMembers}`, 20, yPos);
      }

      // Financial Section
      yPos = 110;
      pdf.setFontSize(12);
      pdf.text('RESUMO FINANCEIRO', 20, yPos);
      
      pdf.rect(15, yPos + 5, 180, 25);
      
      pdf.setFontSize(10);
      yPos += 15;
      pdf.text(`Valor Estimado: ${formatCurrency(project.estimatedValue, project.currency)}`, 20, yPos);
      pdf.text(`Valor Final: ${formatCurrency(project.finalValue, project.currency)}`, 120, yPos);
      
      yPos += 8;
      const margin = project.finalValue - project.estimatedValue;
      pdf.text(`Margem: ${formatCurrency(margin, project.currency)}`, 20, yPos);
      pdf.text(`Moeda: ${project.currency}`, 120, yPos);

      // Performance Metrics
      yPos = 150;
      pdf.setFontSize(12);
      pdf.text('MÉTRICAS DE PERFORMANCE', 20, yPos);
      
      pdf.rect(15, yPos + 5, 180, 25);
      
      pdf.setFontSize(10);
      yPos += 15;
      
      const tasks = db.getProjectTasks(project.id);
      const completedTasks = tasks.filter(t => t.status === 'Concluída').length;
      const totalTasks = tasks.length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      pdf.text(`Taxa de Conclusão: ${taskCompletionRate}%`, 20, yPos);
      pdf.text(`Tarefas: ${completedTasks}/${totalTasks}`, 120, yPos);
      
      yPos += 8;
      const daysInProgress = project.startDate ? 
        Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      pdf.text(`Dias em Execução: ${daysInProgress}`, 20, yPos);
      
      const progressPerDay = daysInProgress > 0 ? (progress / daysInProgress).toFixed(2) : '0';
      pdf.text(`Velocidade: ${progressPerDay}%/dia`, 120, yPos);

      // Description
      if (project.description) {
        yPos = 185;
        pdf.setFontSize(12);
        pdf.text('DESCRIÇÃO', 20, yPos);
        
        pdf.setFontSize(9);
        const descriptionLines = pdf.splitTextToSize(project.description, 170);
        pdf.text(descriptionLines.slice(0, 4), 20, yPos + 10);
        yPos += Math.min(descriptionLines.length, 4) * 4 + 15;
      }

      // Tags
      if (project.tags.length > 0) {
        if (yPos > 240) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(12);
        pdf.text('TAGS', 20, yPos);
        
        pdf.setFontSize(9);
        pdf.text(project.tags.join(', '), 20, yPos + 10);
      }
    });

    pdf.save(`relatorio-projetos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const tabCounts = getTabCounts();
  const filteredProjects = getFilteredProjects();
  const statusCards = getStatusCards();

  return (
    <TooltipProvider>
      <Layout>
        <div className="space-y-6">
          {/* Deadline Alert */}
          {showDeadlineAlert && (
            <AlertDialog open={showDeadlineAlert} onOpenChange={setShowDeadlineAlert}>
              <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <Bell className="h-5 w-5" />
                    Alertas de Prazo
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4">
                      {getProjectsDueToday().length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 font-medium text-orange-600 mb-2">
                            📅 Vencem Hoje ({getProjectsDueToday().length})
                          </div>
                          {getProjectsDueToday().map(project => (
                            <div key={project.id} className="bg-orange-50 p-3 rounded border">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-gray-600">Cliente: {project.client}</div>
                              <div className="text-xs text-orange-600 mt-1">Hoje</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {getOverdueProjects().length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 font-medium text-red-600 mb-2">
                            ⚠️ Atrasados ({getOverdueProjects().length})
                          </div>
                          {getOverdueProjects().map(project => (
                            <div key={project.id} className="bg-red-50 p-3 rounded border">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-gray-600">Cliente: {project.client}</div>
                              <div className="text-xs text-red-600 mt-1">
                                Venceu em: {new Date(project.endDate).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowDeadlineAlert(false)}>
                    Entendi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl text-foreground">🚀 Gerencie todos os seus projetos em um só lugar</p>
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
                  placeholder="Buscar projetos por nome, cliente, responsável, tags ou envolvidos..."
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <CheckSquare className="h-4 w-4 mr-1" />
                          Finalizar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja finalizar {selectedProjects.length} projeto(s)? Esta ação moverá os projetos para a aba de finalizados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => bulkChangeStatus('finished')}>
                            Finalizar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir {selectedProjects.length} projeto(s)? Os projetos serão movidos para a lixeira.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={bulkDeleteProjects} className="bg-red-600 hover:bg-red-700">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {activeTab === 'finished' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reativar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Reativação</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja reativar {selectedProjects.length} projeto(s)?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkChangeStatus('active')}>
                          Reativar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {activeTab === 'deleted' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restaurar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja restaurar {selectedProjects.length} projeto(s)?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => bulkChangeStatus('active')}>
                          Restaurar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
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
                                
                                {/* Action Buttons */}
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

                                  {/* Status Dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {activeTab === 'active' && (
                                        <>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <CheckSquare className="mr-2 h-4 w-4" />
                                                Finalizar
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Finalizar Projeto</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Tem certeza que deseja finalizar o projeto "{project.name}"?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleStatusChange(project, 'finished')}>
                                                  Finalizar
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}
                                      
                                      {activeTab === 'finished' && (
                                        <>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Reativar
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Reativar Projeto</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Tem certeza que deseja reativar o projeto "{project.name}"?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleStatusChange(project, 'active')}>
                                                  Reativar
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}

                                      {activeTab === 'deleted' && (
                                        <>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Restaurar
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Restaurar Projeto</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Tem certeza que deseja restaurar o projeto "{project.name}"?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleStatusChange(project, 'active')}>
                                                  Restaurar
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {activeTab === 'deleted' ? 'Excluir Permanentemente' : 'Mover para Lixeira'}
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Tem certeza que deseja {activeTab === 'deleted' ? 'excluir permanentemente' : 'mover para a lixeira'} o projeto "{project.name}"?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleStatusChange(project, 'deleted')}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Excluir
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-1">{project.client}</p>
                              
                              {/* Tags */}
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {project.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
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

                              {/* Involved People */}
                              {project.teamMembers && (
                                <p className="text-xs text-gray-500 mb-2">
                                  Envolvidos: {project.teamMembers}
                                </p>
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
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium">Progresso</span>
                              <span className="font-bold">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(project.progress)} shadow-sm`}
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-gray-600 font-medium">Valor:</span>
                            <p className="font-bold text-gray-900">
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

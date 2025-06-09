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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import ProjectForm from '../components/ProjectForm';
import StatusCard from '../components/StatusCard';
import { Search, Eye, Edit, Trash2, Download, MoreVertical, CheckSquare, X, Plus, Filter, FolderOpen, Users, Clock, Flag } from 'lucide-react';
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
        project.responsible.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all' && activeTab === 'active') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (priorityFilter !== 'all' && activeTab === 'active') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    return filtered;
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
    generatePDF(selectedProjectsData);
  };

  const generatePDF = (projectsToExport: Project[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 15;
    const lineHeight = 6;
    const margin = 20;
    let pageNumber = 1;

    // Company Header with styling
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTIGE COSMETICOS', margin, 18);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('RELATORIO EXECUTIVO DE PROJETOS', margin, 28);

    // Date and author info
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} | Responsavel: Danilo Araujo`, margin, 33);

    currentY = 50;

    // Executive Summary Box
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 35, 'F');
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 35);

    currentY += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', margin + 5, currentY);

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Calculate portfolio metrics
    const totalProjects = projectsToExport.length;
    const completedProjects = projectsToExport.filter(p => p.status === 'Concluída').length;
    const activeProjects = projectsToExport.filter(p => p.status !== 'Concluída' && !p.isDeleted).length;
    const delayedProjects = projectsToExport.filter(p => p.status === 'Atrasado').length;
    const totalValue = projectsToExport.reduce((sum, p) => sum + (p.finalValue || p.estimatedValue || 0), 0);
    const avgProgress = totalProjects > 0 ? Math.round(projectsToExport.reduce((sum, p) => sum + p.progress, 0) / totalProjects) : 0;

    const col1X = margin + 10;
    const col2X = pageWidth / 2 + 10;

    doc.text(`Total de Projetos: ${totalProjects}`, col1X, currentY);
    doc.text(`Valor Total do Portfolio: ${formatCurrency(totalValue, 'BRL')}`, col2X, currentY);
    currentY += lineHeight;

    doc.text(`Projetos Concluidos: ${completedProjects} (${totalProjects > 0 ? Math.round((completedProjects/totalProjects)*100) : 0}%)`, col1X, currentY);
    doc.text(`Progresso Medio: ${avgProgress}%`, col2X, currentY);
    currentY += lineHeight;

    doc.text(`Projetos Ativos: ${activeProjects}`, col1X, currentY);
    doc.text(`Projetos Atrasados: ${delayedProjects}`, col2X, currentY);
    currentY += lineHeight;

    const onTimeRate = activeProjects > 0 ? Math.round(((activeProjects - delayedProjects) / activeProjects) * 100) : 100;
    doc.text(`Taxa de Entrega no Prazo: ${onTimeRate}%`, col1X, currentY);
    
    currentY += 15;

    // Individual Project Details
    projectsToExport.forEach((project, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 80) {
        doc.addPage();
        pageNumber++;
        currentY = 20;
      }

      // Project Header Box
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 20, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.3);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 20);

      currentY += 6;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${project.name}`, margin + 5, currentY);

      currentY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${project.client} | Responsavel: ${project.responsible}`, margin + 5, currentY);

      currentY += 6;
      doc.text(`Status: ${project.status} | Prioridade: ${project.priority} | Progresso: ${project.progress}%`, margin + 5, currentY);

      currentY += 8;

      // Project Details Section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHES DO PROJETO', margin + 5, currentY);
      currentY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Timeline and Financial Info
      doc.text(`Inicio: ${project.startDate || 'Nao definido'}`, col1X, currentY);
      doc.text(`Fim Previsto: ${project.endDate || 'Nao definido'}`, col2X, currentY);
      currentY += lineHeight;

      doc.text(`Fase: ${project.phase}`, col1X, currentY);
      doc.text(`Valor: ${formatCurrency(project.finalValue || project.estimatedValue || 0, project.currency)}`, col2X, currentY);
      currentY += lineHeight;

      // Progress Bar Visualization
      const progressBarWidth = 60;
      const progressFilled = (project.progress / 100) * progressBarWidth;
      
      doc.text('Progresso:', col1X, currentY);
      // Progress bar background
      doc.setFillColor(229, 231, 235);
      doc.rect(col1X + 25, currentY - 2, progressBarWidth, 3, 'F');
      // Progress bar fill
      doc.setFillColor(59, 130, 246);
      doc.rect(col1X + 25, currentY - 2, progressFilled, 3, 'F');
      doc.text(`${project.progress}%`, col1X + 25 + progressBarWidth + 5, currentY);
      currentY += lineHeight + 2;

      // Description
      if (project.description) {
        doc.text('Descricao:', col1X, currentY);
        currentY += lineHeight;
        const descLines = doc.splitTextToSize(project.description, pageWidth - 2 * margin - 20);
        doc.text(descLines.slice(0, 2), col1X + 5, currentY);
        currentY += Math.min(descLines.length, 2) * lineHeight + 2;
      }

      // Tasks Section
      const tasks = db.getProjectTasks(project.id);
      if (tasks.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('TAREFAS:', col1X, currentY);
        currentY += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        const completedTasks = tasks.filter(t => t.status === 'Concluída').length;
        doc.text(`Total: ${tasks.length} | Concluidas: ${completedTasks} | Taxa: ${Math.round((completedTasks/tasks.length)*100)}%`, col1X + 5, currentY);
        currentY += lineHeight;

        tasks.slice(0, 5).forEach(task => {
          if (currentY > pageHeight - 25) return;
          const status = task.status === 'Concluída' ? '[x]' : '[  ]';
          doc.text(`${status} ${task.name}`, col1X + 10, currentY);
          currentY += lineHeight - 1;
        });
        
        if (tasks.length > 5) {
          doc.text(`... e mais ${tasks.length - 5} tarefas`, col1X + 10, currentY);
          currentY += lineHeight;
        }
      }

      // Communication Summary
      const comments = db.getProjectComments(project.id);
      const files = db.getProjectFiles(project.id);
      
      if (comments.length > 0 || files.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('COMUNICACAO:', col1X, currentY);
        currentY += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Comentarios: ${comments.length}`, col1X + 5, currentY);
        doc.text(`Arquivos: ${files.length}`, col2X, currentY);
        currentY += lineHeight;

        // Recent comments
        if (comments.length > 0) {
          const recentComment = comments[comments.length - 1];
          const commentText = `"${recentComment.text.substring(0, 80)}${recentComment.text.length > 80 ? '...' : ''}" - ${recentComment.author}`;
          doc.text(`Ultimo: ${commentText}`, col1X + 5, currentY);
          currentY += lineHeight;
        }
      }

      // Risk Assessment (if project is delayed)
      if (project.status === 'Atrasado') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('PROJETO EM ATRASO - ATENCAO REQUERIDA', col1X, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += lineHeight;
      }

      currentY += 10; // Space between projects
    });

    doc.save(`relatorio-projetos-${new Date().toISOString().split('T')[0]}.pdf`);
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
              <h1 className="text-3xl font-bold text-foreground">📋 Projetos</h1>
              <p className="text-muted-foreground mt-1">Gerencie seus projetos</p>
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
                  placeholder="Buscar projetos..."
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

          {/* Tabs */}
          <div className="border-b">
            <div className="flex space-x-8">
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'active' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('active')}
              >
                <Clock className="w-4 h-4" />
                📊 Ativos ({tabCounts.active})
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'finished' 
                    ? 'border-green-500 text-green-600' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('finished')}
              >
                <CheckSquare className="w-4 h-4" />
                ✅ Finalizados ({tabCounts.finished})
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'deleted' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('deleted')}
              >
                <Trash2 className="w-4 h-4" />
                🗑️ Lixeira ({tabCounts.deleted})
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedProjects.length} projeto(s) selecionado(s)
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={exportSelectedProjects}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  {activeTab === 'active' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          Alterar Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => bulkChangeStatus('finished')}>
                          Marcar como Finalizado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bulkChangeStatus('deleted')}>
                          Mover para Lixeira
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {activeTab === 'deleted' && (
                    <Button size="sm" variant="outline" onClick={() => bulkChangeStatus('active')}>
                      Restaurar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Project List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div key={project.id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                      />
                      <h3 className="font-semibold text-lg text-foreground line-clamp-1">{project.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/project/${project.id}`} className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingProject(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {activeTab === 'active' && project.status !== 'Concluída' && (
                          <DropdownMenuItem onClick={() => handleFinishProject(project)}>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Finalizar
                          </DropdownMenuItem>
                        )}
                        {activeTab !== 'deleted' && (
                          <DropdownMenuItem onClick={() => handleDeleteProject(project)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                        {activeTab === 'deleted' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(project, 'active')}>
                            Restaurar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{project.client}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
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
                    
                    <div className="text-sm text-muted-foreground">
                      <strong>Valor:</strong> {formatCurrency(project.finalValue || project.estimatedValue, project.currency)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum projeto encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeTab === 'active' && 'Comece criando um novo projeto.'}
                  {activeTab === 'finished' && 'Nenhum projeto foi finalizado ainda.'}
                  {activeTab === 'deleted' && 'A lixeira está vazia.'}
                </p>
                {activeTab === 'active' && (
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Projeto
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bulk select all */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                checked={selectedProjects.length === filteredProjects.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Selecionar todos ({filteredProjects.length})
              </span>
            </div>
          )}
        </div>

        {/* Create Project Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <ProjectForm 
              onSubmit={() => {
                loadProjects();
                setIsCreateDialogOpen(false);
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
            </DialogHeader>
            {editingProject && (
              <ProjectForm 
                initialData={editingProject}
                onSubmit={() => {
                  loadProjects();
                  setEditingProject(null);
                }}
                onCancel={() => setEditingProject(null)}
                isEditing={true}
              />
            )}
          </DialogContent>
        </Dialog>
      </Layout>
    </TooltipProvider>
  );
};

export default ProjectList;

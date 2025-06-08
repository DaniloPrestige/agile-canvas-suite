
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, Project } from '../lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(p => p.status !== 'Concluído' && !p.isDeleted);
    } else if (activeTab === 'finished') {
      filtered = filtered.filter(p => p.status === 'Concluído' && !p.isDeleted);
    } else if (activeTab === 'deleted') {
      filtered = filtered.filter(p => p.isDeleted);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.responsible.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status (only for active tab)
    if (statusFilter !== 'all' && activeTab === 'active') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filter by priority (only for active tab)
    if (priorityFilter !== 'all' && activeTab === 'active') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    return filtered;
  };

  const getTabCounts = () => {
    const activeProjects = projects.filter(p => p.status !== 'Concluído' && !p.isDeleted);
    const finishedProjects = projects.filter(p => p.status === 'Concluído' && !p.isDeleted);
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

  const handleFinishProject = (project: Project) => {
    db.updateProject(project.id, { status: 'Concluído' });
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
      db.updateProject(project.id, { status: 'Concluído' });
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
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Gerência de Projetos - Prestige Cosméticos', 20, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} - Criado por Danilo Araujo`, 20, currentY);
    currentY += 20;

    projectsToExport.forEach((project, index) => {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }

      // Project title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${project.name}`, 20, currentY);
      currentY += 10;

      // Project details in compact format
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const details = [
        `Cliente: ${project.client}`,
        `Responsável: ${project.responsible}`,
        `Status: ${project.status}`,
        `Prioridade: ${project.priority}`,
        `Fase: ${project.phase}`,
        `Progresso: ${project.progress}%`,
        `Início: ${project.startDate || 'N/A'}`,
        `Fim: ${project.endDate || 'N/A'}`
      ];

      details.forEach(detail => {
        doc.text(detail, 25, currentY);
        currentY += 5;
      });

      if (project.description) {
        currentY += 2;
        doc.text(`Descrição: ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}`, 25, currentY);
        currentY += 5;
      }

      // Tasks
      const tasks = db.getProjectTasks(project.id);
      if (tasks.length > 0) {
        currentY += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Tarefas:', 25, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        
        tasks.slice(0, 3).forEach(task => {
          const status = task.status === 'Concluída' ? '[✓]' : '[ ]';
          doc.text(`${status} ${task.name}`, 30, currentY);
          currentY += 4;
        });
        
        if (tasks.length > 3) {
          doc.text(`... e mais ${tasks.length - 3} tarefas`, 30, currentY);
          currentY += 4;
        }
      }

      // Comments count
      const comments = db.getProjectComments(project.id);
      if (comments.length > 0) {
        currentY += 2;
        doc.text(`Comentários: ${comments.length}`, 25, currentY);
        currentY += 5;
      }

      // Files count
      const files = db.getProjectFiles(project.id);
      if (files.length > 0) {
        currentY += 2;
        doc.text(`Arquivos: ${files.length}`, 25, currentY);
        currentY += 5;
      }

      currentY += 10; // Space between projects
    });

    doc.save('projetos-selecionados.pdf');
  };

  const tabCounts = getTabCounts();
  const filteredProjects = getFilteredProjects();
  const statusCards = getStatusCards();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Gerencie todos os seus projetos em um só lugar</p>
          </div>
          <div className="flex gap-2">
            {selectedProjects.length > 0 && (
              <Button onClick={exportSelectedProjects} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Projetos ({selectedProjects.length})
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Projeto
              </Button>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                  <DialogTitle>Adicionar Novo Projeto</DialogTitle>
                </DialogHeader>
                <div className="overflow-hidden">
                  <ProjectForm 
                    onSubmit={() => {
                      setIsCreateDialogOpen(false);
                      loadProjects();
                    }}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statusCards.map((card, index) => (
            <StatusCard 
              key={index}
              title={card.title} 
              count={card.count} 
              color={card.color}
            />
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Projetos Ativos ({tabCounts.active})
          </button>
          <button
            onClick={() => setActiveTab('finished')}
            className={`px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'finished'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Finalizados ({tabCounts.finished})
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={`px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'deleted'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Excluídos ({tabCounts.deleted})
          </button>
        </div>

        {/* Filters - only show for active tab */}
        {activeTab === 'active' && (
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Nome, responsável ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search for other tabs */}
        {activeTab !== 'active' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Nome, responsável ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Selection controls */}
        {filteredProjects.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedProjects.length === filteredProjects.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Selecionar todos ({filteredProjects.length})
                </label>
              </div>
              {selectedProjects.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedProjects.length} projeto(s) selecionado(s)
                </span>
              )}
            </div>
            
            {selectedProjects.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar seleção
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ações em lote
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => bulkChangeStatus('active')}>
                      Mover para Ativos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkChangeStatus('finished')}>
                      Mover para Finalizados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkChangeStatus('deleted')}>
                      Mover para Excluídos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={bulkDeleteProjects} className="text-red-600">
                      Excluir permanentemente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum projeto encontrado</p>
            <p className="text-gray-400 text-sm mt-2">
              {projects.length === 0 
                ? "Comece criando seu primeiro projeto!" 
                : "Tente ajustar os filtros de busca"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Link 
                          to={`/project/${project.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          <h3 className="font-semibold text-lg text-gray-900 mb-1 hover:text-blue-600 cursor-pointer">
                            {project.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Users className="w-3 h-3" />
                          {project.client}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Link to={`/project/${project.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingProject(project);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {activeTab === 'active' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleFinishProject(project)}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(activeTab === 'finished' || activeTab === 'deleted') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStatusChange(project, 'active')}>
                              Mover para Ativos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project, 'finished')}>
                              Mover para Finalizados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project, 'deleted')}>
                              Mover para Excluídos
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-3 h-3" />
                        Responsável:
                      </div>
                      <span className="text-sm font-medium">{project.responsible}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Flag className="w-3 h-3" />
                        Prioridade:
                      </div>
                      <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        Status:
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fase:</span>
                      <span className="text-sm font-medium">{project.phase}</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progresso:</span>
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Editar Projeto</DialogTitle>
            </DialogHeader>
            <div className="overflow-hidden">
              {editingProject && (
                <ProjectForm 
                  project={editingProject}
                  onSubmit={() => {
                    setIsEditDialogOpen(false);
                    setEditingProject(null);
                    loadProjects();
                  }}
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    setEditingProject(null);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProjectList;

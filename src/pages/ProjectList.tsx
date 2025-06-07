import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, CheckCircle, Eye, Edit, ArrowUpDown } from 'lucide-react';
import Layout from '../components/Layout';
import StatusCard from '../components/StatusCard';
import ProgressBar from '../components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, Project, formatCurrency } from '../lib/database';
import ProjectForm from '../components/ProjectForm';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [finishedProjects, setFinishedProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');
  const [priorityFilter, setPriorityFilter] = useState('Todas as prioridades');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const active = db.getActiveProjects();
    const deleted = db.getDeletedProjects();
    const finished = db.getFinishedProjects();
    const all = [...active, ...finished, ...deleted];
    
    setProjects(active);
    setDeletedProjects(deleted);
    setFinishedProjects(finished);
    setAllProjects(all);
  };

  const handleDeleteProject = (id: string) => {
    db.deleteProject(id);
    loadProjects();
  };

  const handleFinishProject = (id: string) => {
    db.finishProject(id);
    loadProjects();
  };

  const handleRestoreProject = (id: string) => {
    db.restoreProject(id);
    loadProjects();
  };

  const handleMoveToDeleted = (id: string) => {
    db.moveToDeleted(id);
    loadProjects();
  };

  const handlePermanentDelete = (id: string) => {
    db.permanentDeleteProject(id);
    loadProjects();
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'Todos os status' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'Todas as prioridades' || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusStats = (projectList: Project[]) => {
    const total = projectList.length;
    const inProgress = projectList.filter(p => p.status === 'Em Progresso').length;
    const pending = projectList.filter(p => p.status === 'Pendente').length;
    const completed = projectList.filter(p => p.status === 'Concluído').length;
    const delayed = projectList.filter(p => p.status === 'Atrasado').length;

    return { total, inProgress, pending, completed, delayed };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'text-red-600';
      case 'Média': return 'text-yellow-600';
      case 'Baixa': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Progresso': return 'bg-blue-100 text-blue-800';
      case 'Pendente': return 'bg-gray-100 text-gray-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Atrasado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatusDropdown = ({ project, type }: { project: Project; type: 'finished' | 'deleted' }) => (
    <Select onValueChange={(value) => {
      if (value === 'active') {
        handleRestoreProject(project.id);
      } else if (value === 'finished') {
        handleFinishProject(project.id);
      } else if (value === 'deleted') {
        handleMoveToDeleted(project.id);
      } else if (value === 'permanent') {
        handlePermanentDelete(project.id);
      }
    }}>
      <SelectTrigger className="w-8 h-8 p-0">
        <ArrowUpDown className="w-4 h-4" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Mover para Ativos</SelectItem>
        {type === 'finished' && <SelectItem value="deleted">Mover para Excluídos</SelectItem>}
        {type === 'deleted' && (
          <>
            <SelectItem value="finished">Mover para Finalizados</SelectItem>
            <SelectItem value="permanent">Excluir Permanentemente</SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );

  const ProjectCard = ({ project, showActions = true, type = 'active' }: { 
    project: Project; 
    showActions?: boolean; 
    type?: 'active' | 'finished' | 'deleted'
  }) => (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link to={`/project/${project.id}`} className="block">
            <h3 className="text-lg font-semibold text-foreground hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">{project.client}</p>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Link to={`/project/${project.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            {type === 'active' ? (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Finalizar Projeto</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja finalizar este projeto? Esta ação marcará o projeto como concluído.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleFinishProject(project.id)}>
                        Finalizar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este projeto? O projeto será movido para a lista de excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <StatusDropdown project={project} type={type as 'finished' | 'deleted'} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir permanentemente este projeto? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handlePermanentDelete(project.id)}>
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Responsável</p>
          <p className="text-sm font-medium">{project.responsible}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prioridade</p>
          <p className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
            {project.priority}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fase</p>
          <p className="text-sm font-medium">{project.phase}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs text-muted-foreground">{project.progress}%</span>
        </div>
        <ProgressBar progress={project.progress} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Valor Estimado</p>
          <p className="text-sm font-medium">{formatCurrency(project.estimatedValue, project.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Valor Final</p>
          <p className="text-sm font-medium">{formatCurrency(project.finalValue, project.currency)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1">Período</p>
        <p className="text-sm">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
      </div>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Projeto</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 px-1">
                <ProjectForm 
                  onSubmit={() => {
                    setIsFormOpen(false);
                    loadProjects();
                  }}
                  onCancel={() => setIsFormOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for different project views */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Projetos Ativos</TabsTrigger>
            <TabsTrigger value="finished">Finalizados</TabsTrigger>
            <TabsTrigger value="deleted">Excluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {/* Stats Cards for Active Projects */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard title="Total de Projetos" count={projects.length} color="blue" />
              <StatusCard title="Em Progresso" count={getStatusStats(projects).inProgress} color="yellow" />
              <StatusCard title="Pendentes" count={getStatusStats(projects).pending} color="gray" />
              <StatusCard title="Concluídos" count={getStatusStats(projects).completed} color="green" />
              <StatusCard title="Atrasados" count={getStatusStats(projects).delayed} color="red" />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, responsável ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos os status">Todos os status</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas as prioridades">Todas as prioridades</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} type="active" />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum projeto encontrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="finished" className="space-y-4">
            {/* Stats Cards for Finished Projects */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard title="Total Finalizados" count={finishedProjects.length} color="green" />
              <StatusCard title="Em Progresso" count={getStatusStats(finishedProjects).inProgress} color="yellow" />
              <StatusCard title="Pendentes" count={getStatusStats(finishedProjects).pending} color="gray" />
              <StatusCard title="Concluídos" count={getStatusStats(finishedProjects).completed} color="green" />
              <StatusCard title="Atrasados" count={getStatusStats(finishedProjects).delayed} color="red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finishedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} type="finished" />
              ))}
            </div>
            {finishedProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum projeto finalizado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deleted" className="space-y-4">
            {/* Stats Cards for Deleted Projects */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatusCard title="Total Excluídos" count={deletedProjects.length} color="red" />
              <StatusCard title="Em Progresso" count={getStatusStats(deletedProjects).inProgress} color="yellow" />
              <StatusCard title="Pendentes" count={getStatusStats(deletedProjects).pending} color="gray" />
              <StatusCard title="Concluídos" count={getStatusStats(deletedProjects).completed} color="green" />
              <StatusCard title="Atrasados" count={getStatusStats(deletedProjects).delayed} color="red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deletedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} type="deleted" />
              ))}
            </div>
            {deletedProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum projeto excluído</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProjectList;

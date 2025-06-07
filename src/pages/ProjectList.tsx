
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, Project } from '../lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm from '../components/ProjectForm';
import StatusCard from '../components/StatusCard';
import { Search, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = db.getAllProjects();
    setProjects(allProjects);
  };

  const getFilteredProjects = () => {
    let filtered = projects.filter(p => !p.isDeleted);

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.responsible.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusCounts = () => {
    const activeProjects = projects.filter(p => !p.isDeleted);
    const totalProjects = activeProjects.length;
    const inProgress = activeProjects.filter(p => p.status === 'Em Progresso').length;
    const pending = activeProjects.filter(p => p.status === 'Pendente').length;
    const completed = activeProjects.filter(p => p.status === 'Concluído').length;

    return { totalProjects, inProgress, pending, completed };
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

  const statusCounts = getStatusCounts();
  const filteredProjects = getFilteredProjects();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Projetos</h1>
            <p className="text-muted-foreground">Gerencie todos os seus projetos em um só lugar</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Adicionar Projeto
            </Button>
            <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
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

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard 
            title="Total de Projetos" 
            count={statusCounts.totalProjects} 
            color="blue"
          />
          <StatusCard 
            title="Em Progresso" 
            count={statusCounts.inProgress} 
            color="yellow"
          />
          <StatusCard 
            title="Pendentes" 
            count={statusCounts.pending} 
            color="gray"
          />
          <StatusCard 
            title="Concluídos" 
            count={statusCounts.completed} 
            color="green"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
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
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{project.name}</h3>
                      <p className="text-gray-600 text-sm">{project.client}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Link to={`/project/${project.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Responsável:</span>
                      <span className="text-sm font-medium">{project.responsible}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Prioridade:</span>
                      <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
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
      </div>
    </Layout>
  );
};

export default ProjectList;

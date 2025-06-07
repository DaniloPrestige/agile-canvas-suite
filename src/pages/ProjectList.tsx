import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { db, Project } from '../lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm from '../components/ProjectForm';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = db.getAllProjects();
    setProjects(allProjects);
  };

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
            <DialogContent className="max-w-4xl h-[90vh] p-0">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>Adicionar Novo Projeto</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
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

        {/* Table */}
        <Table>
          <TableCaption>Uma lista de seus projetos.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nome</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium"><Link to={`/project/${project.id}`}>{project.name}</Link></TableCell>
                <TableCell>{project.client}</TableCell>
                <TableCell>{project.responsible}</TableCell>
                <TableCell>{project.progress}%</TableCell>
                <TableCell className="text-right">
                  <Link to={`/project/${project.id}`}>
                    <Button variant="secondary" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
};

export default ProjectList;

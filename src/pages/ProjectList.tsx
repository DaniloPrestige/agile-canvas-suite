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
      filtered = filtered.filter(p => p.status !== 'Concluído' && !p.isDeleted);
    } else if (activeTab === 'finished') {
      filtered = filtered.filter(p => p.status === 'Concluído' && !p.isDeleted);
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
    db.updateProject(project.id, { status: 'Concluído', progress: 100 });
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
      db.updateProject(project.id, { status: 'Concluído', progress: 100 });
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

  const generatePDF = async (projectsToExport: Project[]) => {
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
    const completedProjects = projectsToExport.filter(p => p.status === 'Concluído').length;
    const activeProjects = projectsToExport.filter(p => p.status !== 'Concluído' && !p.isDeleted).length;
    const delayedProjects = projectsToExport.filter(p => p.status === 'Atrasado').length;
    const totalValue = projectsToExport.reduce((sum, p) => sum + (p.finalValue || p.estimatedValue || 0), 0);
    const avgProgress = totalProjects > 0 ? Math.round(projectsToExport.reduce((sum, p) => sum + p.progress, 0) / totalProjects) : 0;

    const col1X = margin + 10;
    const col2X = pageWidth / 2 + 10;

    doc.text(`Total de Projetos: ${totalProjects}`, col1X, currentY);
    doc.text(`Valor Total do Portfolio: ${await formatCurrency(totalValue, 'BRL')}`, col2X, currentY);
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
    for (const [index, project] of projectsToExport.entries()) {
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
      doc.text(`Valor: ${await formatCurrency(project.finalValue || project.estimatedValue || 0, project.currency)}`, col2X, currentY);
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
    }

    // Performance Analysis Page (if more than 3 projects)
    if (projectsToExport.length > 3) {
      doc.addPage();
      pageNumber++;
      currentY = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALISE DE PERFORMANCE DO PORTFOLIO', margin, currentY);
      currentY += 15;

      // Portfolio Performance Metrics
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 60, 'F');
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 60);

      currentY += 10;
      doc.setFontSize(12);
      doc.text('METRICAS DO PORTFOLIO', margin + 10, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const highPriorityProjects = projectsToExport.filter(p => p.priority === 'Alta').length;
      const avgProjectDuration = projectsToExport.reduce((sum, p) => {
        if (p.startDate && p.endDate) {
          const days = Math.floor((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }
        return sum;
      }, 0) / projectsToExport.filter(p => p.startDate && p.endDate).length || 0;

      doc.text(`Projetos de Alta Prioridade: ${highPriorityProjects} (${Math.round((highPriorityProjects/totalProjects)*100)}%)`, margin + 15, currentY);
      currentY += lineHeight;
      doc.text(`Duracao Media dos Projetos: ${Math.round(avgProjectDuration)} dias`, margin + 15, currentY);
      currentY += lineHeight;
      doc.text(`Valor Medio por Projeto: ${await formatCurrency(totalValue/totalProjects, 'BRL')}`, margin + 15, currentY);
      currentY += lineHeight;

      // Status Distribution
      const statusDistribution = {
        'Em Progresso': projectsToExport.filter(p => p.status === 'Em Progresso').length,
        'Pendente': projectsToExport.filter(p => p.status === 'Pendente').length,
        'Concluído': projectsToExport.filter(p => p.status === 'Concluído').length,
        'Atrasado': projectsToExport.filter(p => p.status === 'Atrasado').length
      };

      currentY += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('DISTRIBUICAO POR STATUS:', margin + 15, currentY);
      currentY += lineHeight;

      doc.setFont('helvetica', 'normal');
      Object.entries(statusDistribution).forEach(([status, count]) => {
        if (count > 0) {
          const percentage = Math.round((count/totalProjects)*100);
          doc.text(`${status}: ${count} projetos (${percentage}%)`, margin + 20, currentY);
          currentY += lineHeight;
        }
      });
    }

    // Professional Footer (sem data)
    const footerY = pageHeight - 20;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY - 5, pageWidth, 25, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Relatorio gerado automaticamente pelo Sistema de Gerenciamento de Projetos - Prestige Cosmeticos', margin, footerY);
    doc.text('Este documento contem informacoes confidenciais e e destinado exclusivamente a diretoria da empresa.', margin, footerY + 5);
    doc.text(`Pagina ${pageNumber} | Gerado por: Danilo Araujo`, margin, footerY + 10);

    const fileName = projectsToExport.length === 1 
      ? `relatorio-${projectsToExport[0].name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      : `relatorio-portfolio-${projectsToExport.length}-projetos.pdf`;
    
    doc.save(fileName);
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
              <p className="text-muted-foreground">🚀 Gerencie todos os seus projetos em um só lugar</p>
            </div>
            <div className="flex gap-2">
              {selectedProjects.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={exportSelectedProjects} variant="outline" className="hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      📄 Exportar ({selectedProjects.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>📊 Gerar relatório executivo em PDF dos projetos selecionados</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                      <Plus className="h-4 w-4 mr-2" />
                      ➕ Novo Projeto
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>✨ Criar um novo projeto no sistema</p>
                  </TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      ➕ Adicionar Novo Projeto
                    </DialogTitle>
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

          {/* Tabs - Removendo ícones simples, mantendo emojis */}
          <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 hover:bg-gray-50 ${
                activeTab === 'active'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📂 Ativos ({tabCounts.active})
            </button>
            <button
              onClick={() => setActiveTab('finished')}
              className={`px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 hover:bg-gray-50 ${
                activeTab === 'finished'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✅ Finalizados ({tabCounts.finished})
            </button>
            <button
              onClick={() => setActiveTab('deleted')}
              className={`px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 hover:bg-gray-50 ${
                activeTab === 'deleted'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🗑️ Excluídos ({tabCounts.deleted})
            </button>
          </div>

          {activeTab === 'active' && (
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="🔍 Buscar por nome, cliente ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 hover:border-blue-300 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="min-w-[150px] hover:border-blue-300">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📊 Todos</SelectItem>
                    <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                    <SelectItem value="Em Progresso">🔄 Em Progresso</SelectItem>
                    <SelectItem value="Atrasado">⚠️ Atrasado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="min-w-[150px] hover:border-blue-300">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🎯 Todas</SelectItem>
                    <SelectItem value="Alta">🔴 Alta</SelectItem>
                    <SelectItem value="Média">🟡 Média</SelectItem>
                    <SelectItem value="Baixa">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeTab !== 'active' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="🔍 Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 hover:border-blue-300 focus:border-blue-500"
              />
            </div>
          )}

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
                    ☑️ Selecionar todos ({filteredProjects.length})
                  </label>
                </div>
                {selectedProjects.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    📌 {selectedProjects.length} projeto(s) selecionado(s)
                  </span>
                )}
              </div>
              
              {selectedProjects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={clearSelection} className="hover:bg-gray-50">
                        <X className="h-4 w-4 mr-1" />
                        ❌ Cancelar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limpar seleção atual</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50">
                            ⚡ Ações em lote
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Aplicar ações em todos os projetos selecionados</p>
                        </TooltipContent>
                      </Tooltip>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => bulkChangeStatus('active')}>
                        📂 Mover para Ativos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => bulkChangeStatus('finished')}>
                        ✅ Mover para Finalizados
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => bulkChangeStatus('deleted')}>
                        🗑️ Mover para Excluídos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={bulkDeleteProjects} className="text-red-600">
                        ⚠️ Excluir permanentemente
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
              <p className="text-gray-500 text-lg">🔍 Nenhum projeto encontrado</p>
              <p className="text-gray-400 text-sm mt-2">
                {projects.length === 0 
                  ? "🚀 Comece criando seu primeiro projeto!" 
                  : "🔎 Tente ajustar os filtros de busca"}
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
                              📋 {project.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Users className="w-3 h-3" />
                            {project.client}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/project/${project.id}`}>
                              <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>👁️ Visualizar detalhes do projeto</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingProject(project);
                                setIsEditDialogOpen(true);
                              }}
                              className="hover:bg-yellow-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>✏️ Editar informações do projeto</p>
                          </TooltipContent>
                        </Tooltip>

                        {activeTab === 'active' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-green-50">
                                      <CheckSquare className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>✅ Marcar projeto como concluído</p>
                                  </TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-green-600" />
                                    ✅ Finalizar Projeto
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    🎯 Tem certeza que deseja marcar o projeto "<strong>{project.name}</strong>" como concluído? 
                                    Esta ação irá alterar o status do projeto para "Concluído" e movê-lo para a aba de projetos finalizados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>❌ Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleFinishProject(project)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    ✅ Sim, finalizar projeto
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-red-50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>🗑️ Excluir projeto</p>
                                  </TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                    🗑️ Excluir Projeto
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ⚠️ <strong>Atenção!</strong> Esta ação moverá o projeto "<strong>{project.name}</strong>" para a lixeira. 
                                    O projeto poderá ser restaurado posteriormente a partir da aba "Excluídos".
                                    <br/><br/>
                                    📝 Todas as tarefas, comentários e arquivos do projeto serão preservados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>❌ Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteProject(project)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    🗑️ Sim, excluir projeto
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        
                        {(activeTab === 'finished' || activeTab === 'deleted') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="hover:bg-gray-50">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>⚡ Mais opções para este projeto</p>
                                </TooltipContent>
                              </Tooltip>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleStatusChange(project, 'active')}>
                                📂 Mover para Ativos
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(project, 'finished')}>
                                ✅ Mover para Finalizados
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(project, 'deleted')}>
                                🗑️ Mover para Excluídos
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
                          👨‍💼 Responsável:
                        </div>
                        <span className="text-sm font-medium">{project.responsible}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Flag className="w-3 h-3" />
                          🚩 Prioridade:
                        </div>
                        <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          ⏱️ Status:
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🎯 Fase:</span>
                        <span className="text-sm font-medium">{project.phase}</span>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">📈 Progresso:</span>
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
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  ✏️ Editar Projeto
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden">
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
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default ProjectList;

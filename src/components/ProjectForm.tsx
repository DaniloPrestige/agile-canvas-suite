
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TagInput from './TagInput';
import { db, Project, CURRENCIES } from '../lib/database';
import { cn } from '@/lib/utils';

interface ProjectFormProps {
  project?: Project;
  onSubmit: () => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    client: project?.client || '',
    responsible: project?.responsible || '',
    priority: project?.priority || 'Média',
    status: project?.status || 'Pendente',
    phase: project?.phase || 'Iniciação',
    startDate: project?.startDate ? new Date(project.startDate) : undefined,
    endDate: project?.endDate ? new Date(project.endDate) : undefined,
    estimatedValue: project?.estimatedValue || 0,
    finalValue: project?.finalValue || 0,
    currency: project?.currency || 'BRL',
    description: project?.description || '',
    tags: project?.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.client.trim()) newErrors.client = 'Cliente é obrigatório';
    if (!formData.responsible.trim()) newErrors.responsible = 'Responsável é obrigatório';
    if (!formData.startDate) newErrors.startDate = 'Data de início é obrigatória';
    if (!formData.endDate) newErrors.endDate = 'Data de término é obrigatória';
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'Data de término deve ser posterior à data de início';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const projectData = {
      ...formData,
      startDate: formData.startDate!.toISOString(),
      endDate: formData.endDate!.toISOString(),
      currency: formData.currency as 'BRL' | 'USD' | 'EUR',
    };

    if (project) {
      db.updateProject(project.id, projectData);
    } else {
      db.createProject(projectData);
    }

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Projeto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Cliente *</Label>
          <Input
            id="client"
            value={formData.client}
            onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
            className={errors.client ? 'border-red-500' : ''}
          />
          {errors.client && <p className="text-sm text-red-500">{errors.client}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsible">Responsável *</Label>
          <Input
            id="responsible"
            value={formData.responsible}
            onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
            className={errors.responsible ? 'border-red-500' : ''}
          />
          {errors.responsible && <p className="text-sm text-red-500">{errors.responsible}</p>}
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Progresso">Em Progresso</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fase</Label>
          <Select 
            value={formData.phase} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Iniciação">Iniciação</SelectItem>
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Execução">Execução</SelectItem>
              <SelectItem value="Encerramento">Encerramento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data de Início *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground",
                  errors.startDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label>Data de Término *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground",
                  errors.endDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>

        <div className="space-y-2">
          <Label>Moeda</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as 'BRL' | 'USD' | 'EUR' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <SelectItem key={code} value={code}>
                  {info.symbol} - {info.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Valor Estimado</Label>
          <Input
            id="estimatedValue"
            type="number"
            step="0.01"
            min="0"
            value={formData.estimatedValue}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: parseFloat(e.target.value) || 0 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="finalValue">Valor Final</Label>
          <Input
            id="finalValue"
            type="number"
            step="0.01"
            min="0"
            value={formData.finalValue}
            onChange={(e) => setFormData(prev => ({ ...prev, finalValue: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput
          tags={formData.tags}
          onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
          placeholder="Digite uma tag e pressione Enter"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {project ? 'Atualizar' : 'Criar'} Projeto
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { db, Project } from '../lib/database';
import TagInput from './TagInput';

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
    priority: project?.priority || 'Média' as const,
    status: project?.status || 'Pendente' as const,
    phase: project?.phase || 'Iniciação' as const,
    estimatedValue: project?.estimatedValue?.toString() || '',
    finalValue: project?.finalValue?.toString() || '',
    currency: project?.currency || 'BRL' as const,
    description: project?.description || '',
    tags: project?.tags || [] as string[],
  });

  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.startDate ? new Date(project.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.endDate ? new Date(project.endDate) : undefined
  );
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toFixed(2);
  };

  const handleValueChange = (value: string, field: 'estimatedValue' | 'finalValue') => {
    if (value === '') {
      setFormData({ ...formData, [field]: '' });
    } else {
      const formatted = formatCurrencyInput(value);
      setFormData({ ...formData, [field]: formatted });
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setStartDateOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setEndDateOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : '',
      estimatedValue: parseFloat(formData.estimatedValue.replace(',', '.')) || 0,
      finalValue: parseFloat(formData.finalValue.replace(',', '.')) || 0,
      progress: project?.progress || 0,
    };

    if (project) {
      db.updateProject(project.id, projectData);
      db.addHistoryEntry(project.id, 'user', 'Projeto editado');
    } else {
      const newProject = db.createProject(projectData);
      db.addHistoryEntry(newProject.id, 'user', 'Projeto criado');
    }
    
    onSubmit();
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              required
              className="h-8"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="responsible">Responsável *</Label>
          <Input
            id="responsible"
            value={formData.responsible}
            onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
            required
            className="h-8"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value: 'Alta' | 'Média' | 'Baixa') => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'Em Progresso' | 'Pendente' | 'Concluído' | 'Atrasado') => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="h-8">
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
          <div>
            <Label htmlFor="phase">Fase</Label>
            <Select value={formData.phase} onValueChange={(value: 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento') => setFormData({ ...formData, phase: value })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Iniciação">Iniciação</SelectItem>
                <SelectItem value="Planejamento">Planejamento</SelectItem>
                <SelectItem value="Execução">Execução</SelectItem>
                <SelectItem value="Monitoramento">Monitoramento</SelectItem>
                <SelectItem value="Encerramento">Encerramento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data de Início *</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Data de Fim</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="estimatedValue">Valor Estimado</Label>
            <Input
              id="estimatedValue"
              type="text"
              placeholder="0,00"
              value={formData.estimatedValue}
              onChange={(e) => handleValueChange(e.target.value, 'estimatedValue')}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="finalValue">Valor Final</Label>
            <Input
              id="finalValue"
              type="text"
              placeholder="0,00"
              value={formData.finalValue}
              onChange={(e) => handleValueChange(e.target.value, 'finalValue')}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select value={formData.currency} onValueChange={(value: 'BRL' | 'USD' | 'EUR') => setFormData({ ...formData, currency: value })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (BRL)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o projeto..."
            rows={2}
            className="resize-none"
          />
        </div>

        <div>
          <Label>Tags</Label>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
            placeholder="Digite uma tag e pressione Enter"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {project ? 'Atualizar' : 'Criar'} Projeto
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    client: initialData?.client || '',
    responsible: initialData?.responsible || '',
    priority: initialData?.priority || 'Média' as const,
    status: initialData?.status || 'Pendente' as const,
    phase: initialData?.phase || 'Iniciação' as const,
    estimatedValue: initialData?.estimatedValue?.toString() || '',
    finalValue: initialData?.finalValue?.toString() || '',
    currency: initialData?.currency || 'BRL' as const,
    description: initialData?.description || '',
    tags: initialData?.tags || [] as string[],
  });

  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.startDate ? new Date(initialData.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endDate ? new Date(initialData.endDate) : undefined
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
      progress: initialData?.progress || 0,
    };

    if (initialData) {
      db.updateProject(initialData.id, projectData);
    } else {
      db.createProject(projectData);
    }
    
    onSubmit();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col max-h-[calc(90vh-120px)]">
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="name" className="text-sm cursor-help">Nome do Projeto *</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Digite o nome que identificará seu projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="client" className="text-sm cursor-help">Cliente *</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nome ou empresa do cliente</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  required
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="responsible" className="text-sm cursor-help">Responsável *</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pessoa responsável por gerenciar este projeto</p>
                </TooltipContent>
              </Tooltip>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                required
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="priority" className="text-sm cursor-help">Prioridade</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nível de prioridade do projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Select value={formData.priority} onValueChange={(value: 'Alta' | 'Média' | 'Baixa') => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="h-8 text-sm">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="status" className="text-sm cursor-help">Status</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estado atual do projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Select value={formData.status} onValueChange={(value: 'Em Progresso' | 'Pendente' | 'Concluída' | 'Atrasado') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="phase" className="text-sm cursor-help">Fase</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fase atual do ciclo de vida do projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Select value={formData.phase} onValueChange={(value: 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento') => setFormData({ ...formData, phase: value })}>
                  <SelectTrigger className="h-8 text-sm">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-sm cursor-help">Data de Início *</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Data planejada para iniciar o projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-sm cursor-help">Data de Fim</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Data planejada para finalizar o projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
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
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="estimatedValue" className="text-sm cursor-help">Valor Estimado</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Valor orçado para o projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="estimatedValue"
                  type="text"
                  placeholder="0,00"
                  value={formData.estimatedValue}
                  onChange={(e) => handleValueChange(e.target.value, 'estimatedValue')}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="finalValue" className="text-sm cursor-help">Valor Final</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Valor real executado do projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="finalValue"
                  type="text"
                  placeholder="0,00"
                  value={formData.finalValue}
                  onChange={(e) => handleValueChange(e.target.value, 'finalValue')}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="currency" className="text-sm cursor-help">Moeda</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Moeda utilizada no projeto</p>
                  </TooltipContent>
                </Tooltip>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value: 'BRL' | 'USD' | 'EUR') => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label htmlFor="description" className="text-sm cursor-help">Descrição</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descrição detalhada do projeto</p>
                </TooltipContent>
              </Tooltip>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o projeto..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label className="text-sm cursor-help">Tags</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Palavras-chave para categorizar o projeto</p>
                </TooltipContent>
              </Tooltip>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Digite uma tag e pressione Enter"
              />
            </div>
          </form>
        </div>
        
        <div className="border-t p-6 bg-white">
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} className="h-8 text-sm">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="h-8 text-sm">
              {isEditing ? 'Atualizar' : 'Criar'} Projeto
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ProjectForm;

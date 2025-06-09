
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { db, Task } from '../lib/database';

interface TaskManagerProps {
  projectId: string;
  onTaskUpdate?: () => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ projectId, onTaskUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: 'Pendente' | 'Em Progresso' | 'Concluída';
    priority: 'Alta' | 'Média' | 'Baixa';
    assignedTo: string;
  }>({
    name: '',
    description: '',
    status: 'Pendente',
    priority: 'Média',
    assignedTo: '',
  });
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueDateOpen, setDueDateOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = () => {
    const projectTasks = db.getProjectTasks(projectId);
    setTasks(projectTasks);
  };

  const updateProjectProgress = () => {
    // Força atualização do progresso do projeto
    if (onTaskUpdate) {
      onTaskUpdate();
    }
    
    // Atualiza o progresso automaticamente no banco
    const currentTasks = db.getProjectTasks(projectId);
    const completedTasks = currentTasks.filter(task => task.status === 'Concluída').length;
    const progress = currentTasks.length > 0 ? Math.round((completedTasks / currentTasks.length) * 100) : 0;
    
    // Atualiza o projeto com o novo progresso
    const project = db.getProject(projectId);
    if (project) {
      db.updateProject(projectId, { 
        progress,
        isFinished: progress === 100 || project.status === 'Concluída'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'Pendente',
      priority: 'Média',
      assignedTo: '',
    });
    setDueDate(undefined);
    setEditingTask(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      projectId,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      dueDate: dueDate ? dueDate.toISOString().split('T')[0] : '',
      priority: formData.priority,
      assignedTo: formData.assignedTo,
    };

    if (editingTask) {
      db.updateTask(editingTask.id, taskData);
    } else {
      db.createTask(taskData);
    }
    
    loadTasks();
    resetForm();
    updateProjectProgress();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
    });
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setShowForm(true);
  };

  const handleDeleteTask = (id: string) => {
    db.deleteTask(id);
    loadTasks();
    updateProjectProgress();
  };

  const handleTaskStatusChange = (taskId: string, checked: boolean) => {
    const newStatus = checked ? 'Concluída' : 'Pendente';
    db.updateTask(taskId, { status: newStatus });
    loadTasks();
    
    // Atualiza o progresso em tempo real
    setTimeout(() => {
      updateProjectProgress();
    }, 100);
  };

  const handleDueDateSelect = (date: Date | undefined) => {
    setDueDate(date);
    setDueDateOpen(false);
  };

  // Calcula o progresso atual
  const currentProgress = tasks.length > 0 ? 
    Math.round((tasks.filter(task => task.status === 'Concluída').length / tasks.length) * 100) : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Lista de Tarefas</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm text-gray-600">
                {tasks.filter(t => t.status === 'Concluída').length} de {tasks.length} concluídas
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{currentProgress}%</span>
              </div>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova tarefa
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adicionar uma nova tarefa ao projeto</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {showForm && (
          <div className="rounded-md border bg-card text-card-foreground shadow-sm p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="name" className="text-sm">Nome da Tarefa *</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Digite um nome descritivo para a tarefa</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-8 text-sm"
                  placeholder="Ex: Implementar funcionalidade X"
                />
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="description" className="text-sm">Descrição</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adicione detalhes sobre o que precisa ser feito</p>
                  </TooltipContent>
                </Tooltip>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a tarefa..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="status" className="text-sm">Status</Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Selecione o status atual da tarefa</p>
                    </TooltipContent>
                  </Tooltip>
                  <Select value={formData.status} onValueChange={(value: 'Pendente' | 'Em Progresso' | 'Concluída') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="priority" className="text-sm">Prioridade</Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Defina a importância desta tarefa</p>
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
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="assignedTo" className="text-sm">Atribuída a</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pessoa responsável por executar esta tarefa</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="text-sm">Data de Vencimento</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Defina o prazo limite para conclusão</p>
                  </TooltipContent>
                </Tooltip>
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={handleDueDateSelect}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" onClick={resetForm} className="h-8 text-sm">
                      Cancelar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancelar e fechar o formulário</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" className="h-8 text-sm">
                      {editingTask ? 'Atualizar' : 'Criar'} Tarefa
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{editingTask ? 'Salvar alterações na tarefa' : 'Criar nova tarefa no projeto'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </form>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Nenhuma tarefa encontrada para este projeto.</p>
            <p className="text-gray-400 text-xs mt-1">Comece adicionando uma nova tarefa!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      checked={task.status === 'Concluída'}
                      onCheckedChange={(checked) => handleTaskStatusChange(task.id, checked as boolean)}
                      className="flex-shrink-0"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.status === 'Concluída' ? 'Marcar como pendente' : 'Marcar como concluída'}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex-grow">
                  <div className={`font-medium ${task.status === 'Concluída' ? 'line-through text-gray-500' : ''}`}>
                    {task.name}
                  </div>
                  {task.description && (
                    <div className={`text-sm text-gray-600 ${task.status === 'Concluída' ? 'line-through' : ''}`}>
                      {task.description}
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    {task.assignedTo && <span>Atribuída a: {task.assignedTo}</span>}
                    <span>Prioridade: {task.priority}</span>
                    {task.dueDate && <span>Vencimento: {format(new Date(task.dueDate), "dd/MM/yyyy")}</span>}
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar esta tarefa</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Excluir esta tarefa</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default TaskManager;

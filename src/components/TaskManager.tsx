
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    
    // Call the callback to update project progress
    if (onTaskUpdate) {
      onTaskUpdate();
    }
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
    
    // Call the callback to update project progress
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  const handleDueDateSelect = (date: Date | undefined) => {
    setDueDate(date);
    setDueDateOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciar Tarefas</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Tarefa
        </Button>
      </div>

      {showForm && (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">Nome da Tarefa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm">Descrição</Label>
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
                <Label htmlFor="status" className="text-sm">Status</Label>
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
                <Label htmlFor="priority" className="text-sm">Prioridade</Label>
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
              <Label htmlFor="assignedTo" className="text-sm">Atribuída a</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-sm">Data de Vencimento</Label>
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
              <Button type="button" variant="outline" onClick={resetForm} className="h-8 text-sm">
                Cancelar
              </Button>
              <Button type="submit" className="h-8 text-sm">
                {editingTask ? 'Atualizar' : 'Criar'} Tarefa
              </Button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Nenhuma tarefa encontrada para este projeto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-md border bg-card text-card-foreground shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{task.name}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm"><span className="font-medium">Status:</span> {task.status}</p>
                <p className="text-sm"><span className="font-medium">Prioridade:</span> {task.priority}</p>
                <p className="text-sm"><span className="font-medium">Atribuída a:</span> {task.assignedTo}</p>
                {task.dueDate && (
                  <p className="text-sm"><span className="font-medium">Data de Vencimento:</span> {format(new Date(task.dueDate), "dd/MM/yyyy")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskManager;

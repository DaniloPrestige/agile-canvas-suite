
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { db, Task } from '../lib/database';

interface TaskManagerProps {
  projectId: string;
  onTaskUpdate: () => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ projectId, onTaskUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>(db.getProjectTasks(projectId));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Pendente' as const,
    dueDate: '',
    priority: 'Média' as const,
  });

  const loadTasks = () => {
    const updatedTasks = db.getProjectTasks(projectId);
    setTasks(updatedTasks);
    onTaskUpdate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      db.updateTask(editingTask.id, formData);
    } else {
      db.createTask({
        ...formData,
        projectId,
      });
    }
    
    resetForm();
    loadTasks();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'Pendente' as const,
      dueDate: '',
      priority: 'Média' as const,
    });
    setEditingTask(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (task: Task) => {
    setFormData({
      name: task.name,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
    });
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    db.deleteTask(taskId);
    loadTasks();
  };

  const handleStatusChange = (taskId: string, completed: boolean) => {
    const status = completed ? 'Concluída' : 'Pendente';
    db.updateTask(taskId, { status });
    loadTasks();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'default';
      case 'Em Progresso': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'destructive';
      case 'Média': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lista de Tarefas</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTask(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Editar' : 'Nova'} Tarefa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="taskName">Nome da Tarefa</Label>
                <Input
                  id="taskName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="taskDescription">Descrição</Label>
                <Textarea
                  id="taskDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskStatus">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'Pendente' | 'Em Progresso' | 'Concluída') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
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
                  <Label htmlFor="taskPriority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value: 'Alta' | 'Média' | 'Baixa') => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
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
                <Label htmlFor="taskDueDate">Data de Vencimento</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTask ? 'Atualizar' : 'Criar'} Tarefa
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={task.status === 'Concluída'}
                      onCheckedChange={(checked) => handleStatusChange(task.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium ${task.status === 'Concluída' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.name}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Vence: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(task)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskManager;

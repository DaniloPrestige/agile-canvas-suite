import { v4 as uuidv4 } from 'uuid';
import { currencyService } from './currencyService';

export type Project = {
  id: string;
  name: string;
  client: string;
  description?: string;
  startDate: string;
  endDate: string;
  estimatedValue: number;
  finalValue: number;
  currency: 'BRL' | 'USD' | 'EUR';
  responsible: string;
  status: 'Pendente' | 'Em Progresso' | 'Concluída' | 'Atrasado';
  priority: 'Alta' | 'Média' | 'Baixa';
  phase: 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento';
  tags: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isFinished: boolean;
};

export type Task = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'Pendente' | 'Em Progresso' | 'Concluída';
  dueDate: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  projectId: string;
  author: string;
  text: string;
  timestamp: string;
  createdAt: string;
  userId?: string;
};

export type File = {
  id: string;
  projectId: string;
  name: string;
  filename?: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadDate?: string;
};

export type ProjectFile = File;

export type HistoryEntry = {
  id: string;
  projectId: string;
  user: string;
  action: string;
  timestamp: string;
};

type Database = {
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  files: File[];
  history: HistoryEntry[];
};

const initialDatabase: Database = {
  projects: [],
  tasks: [],
  comments: [],
  files: [],
  history: [],
};

class DatabaseService {
  private db: Database;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): Database {
    try {
      const storedDb = localStorage.getItem('database');
      return storedDb ? JSON.parse(storedDb) : initialDatabase;
    } catch (error) {
      console.error('Error loading database from localStorage:', error);
      return initialDatabase;
    }
  }

  private saveDatabase() {
    localStorage.setItem('database', JSON.stringify(this.db));
  }

  // Função para atualizar automaticamente o progresso do projeto baseado nas tarefas
  private updateProjectProgress(projectId: string) {
    try {
      const tasks = this.getProjectTasks(projectId);
      const completedTasks = tasks.filter(task => task.status === 'Concluída');
      const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
      
      // Atualiza o progresso do projeto
      const project = this.getProject(projectId);
      if (project) {
        this.updateProject(projectId, { 
          progress,
          isFinished: progress === 100 || project.status === 'Concluído'
        });
        
        // Adiciona entrada no histórico
        this.addHistoryEntry(projectId, 'Sistema', `Progresso atualizado automaticamente para ${progress}% (${completedTasks.length}/${tasks.length} tarefas concluídas)`);
      }
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  }

  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'isDeleted' | 'isFinished'>): Project {
    const newProject: Project = {
      id: uuidv4(),
      ...projectData,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      isFinished: projectData.status === 'Concluído',
    };
    this.db.projects.push(newProject);
    this.saveDatabase();
    return newProject;
  }

  getProject(id: string): Project | null {
    return this.db.projects.find((project) => project.id === id) || null;
  }

  getAllProjects(): Project[] {
    return this.db.projects;
  }

  getActiveProjects(): Project[] {
    return this.db.projects.filter(p => p.status !== 'Concluído' && !p.isDeleted);
  }

  getFinishedProjects(): Project[] {
    return this.db.projects.filter(p => p.status === 'Concluído' && !p.isDeleted);
  }

  getDeletedProjects(): Project[] {
    return this.db.projects.filter(p => p.isDeleted);
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projectIndex = this.db.projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      return null;
    }
    const updatedProject = {
      ...this.db.projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      isFinished: updates.status === 'Concluído' || this.db.projects[projectIndex].status === 'Concluído',
    };
    this.db.projects[projectIndex] = updatedProject;
    this.saveDatabase();
    return this.db.projects[projectIndex];
  }

  deleteProject(id: string): void {
    const projectIndex = this.db.projects.findIndex((project) => project.id === id);
    if (projectIndex !== -1) {
      this.db.projects[projectIndex] = {
        ...this.db.projects[projectIndex],
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      };
      this.saveDatabase();
    }
  }

  restoreProject(id: string): void {
    const projectIndex = this.db.projects.findIndex((project) => project.id === id);
    if (projectIndex !== -1) {
      this.updateProject(id, { isDeleted: false });
      this.saveDatabase();
    }
  }

  // Task CRUD operations
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.tasks.push(newTask);
    this.saveDatabase();
    
    // Atualiza automaticamente o progresso do projeto
    this.updateProjectProgress(taskData.projectId);
    
    return newTask;
  }

  getTask(id: string): Task | null {
    return this.db.tasks.find((task) => task.id === id) || null;
  }

  getProjectTasks(projectId: string): Task[] {
    return this.db.tasks.filter((task) => task.projectId === projectId);
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const taskIndex = this.db.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      return null;
    }
    
    const updatedTask = {
      ...this.db.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.db.tasks[taskIndex] = updatedTask;
    this.saveDatabase();
    
    // Atualiza automaticamente o progresso do projeto
    this.updateProjectProgress(updatedTask.projectId);
    
    return this.db.tasks[taskIndex];
  }

  deleteTask(id: string): void {
    const task = this.getTask(id);
    if (task) {
      const projectId = task.projectId;
      this.db.tasks = this.db.tasks.filter((task) => task.id !== id);
      this.saveDatabase();
      
      // Atualiza automaticamente o progresso do projeto
      this.updateProjectProgress(projectId);
    }
  }

  createComment(commentData: Omit<Comment, 'id' | 'timestamp' | 'createdAt'>): Comment {
    const newComment: Comment = {
      id: uuidv4(),
      ...commentData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.db.comments.push(newComment);
    this.saveDatabase();
    return newComment;
  }

  getProjectComments(projectId: string): Comment[] {
    return this.db.comments.filter((comment) => comment.projectId === projectId);
  }

  updateComment(id: string, updates: Partial<Comment>): Comment | null {
    const commentIndex = this.db.comments.findIndex((comment) => comment.id === id);
    if (commentIndex === -1) {
      return null;
    }
    this.db.comments[commentIndex] = {
      ...this.db.comments[commentIndex],
      ...updates,
    };
    this.saveDatabase();
    return this.db.comments[commentIndex];
  }

  deleteComment(id: string): void {
    this.db.comments = this.db.comments.filter((comment) => comment.id !== id);
    this.saveDatabase();
  }

  createFile(fileData: Omit<File, 'id' | 'uploadedAt'>): File {
    const newFile: File = {
      id: uuidv4(),
      ...fileData,
      filename: fileData.filename || fileData.name,
      uploadedAt: new Date().toISOString(),
      uploadDate: new Date().toISOString(),
    };
    this.db.files.push(newFile);
    this.saveDatabase();
    return newFile;
  }

  getProjectFiles(projectId: string): File[] {
    return this.db.files.filter((file) => file.projectId === projectId);
  }

  deleteFile(id: string): void {
    this.db.files = this.db.files.filter((file) => file.id !== id);
    this.saveDatabase();
  }

  addHistoryEntry(projectId: string, user: string, action: string): void {
    const newEntry: HistoryEntry = {
      id: uuidv4(),
      projectId,
      user,
      action,
      timestamp: new Date().toISOString(),
    };
    this.db.history.push(newEntry);
    this.saveDatabase();
  }

  getProjectHistory(projectId: string): HistoryEntry[] {
    return this.db.history.filter((entry) => entry.projectId === projectId);
  }

  // Utility functions with real-time currency conversion
  async formatCurrency(amount: number, currency: 'BRL' | 'USD' | 'EUR'): Promise<string> {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  async convertCurrency(amount: number, fromCurrency: 'BRL' | 'USD' | 'EUR', toCurrency: 'BRL' | 'USD' | 'EUR'): Promise<number> {
    return await currencyService.convertCurrency(amount, fromCurrency, toCurrency);
  }
}

export const db = new DatabaseService();

// Export utility functions
export const formatCurrency = async (amount: number, currency: 'BRL' | 'USD' | 'EUR'): Promise<string> => {
  return await db.formatCurrency(amount, currency);
};

export const convertCurrency = async (amount: number, fromCurrency: 'BRL' | 'USD' | 'EUR', toCurrency: 'BRL' | 'USD' | 'EUR'): Promise<number> => {
  return await db.convertCurrency(amount, fromCurrency, toCurrency);
};

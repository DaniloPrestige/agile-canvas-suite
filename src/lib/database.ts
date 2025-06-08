
import { v4 as uuidv4 } from 'uuid';

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
  status: 'Pendente' | 'Em Progresso' | 'Concluído' | 'Atrasado';
  priority: 'Alta' | 'Média' | 'Baixa';
  phase: 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento';
  tags: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
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
};

export type File = {
  id: string;
  projectId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
};

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

  // Project CRUD operations
  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'isDeleted'>): Project {
    const newProject: Project = {
      id: uuidv4(),
      ...projectData,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
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
    this.db.projects[projectIndex] = {
      ...this.db.projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
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
    this.db.tasks[taskIndex] = {
      ...this.db.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.db.tasks[taskIndex];
  }

  deleteTask(id: string): void {
    this.db.tasks = this.db.tasks.filter((task) => task.id !== id);
    this.saveDatabase();
  }

  // Comment CRUD operations
  createComment(commentData: Omit<Comment, 'id' | 'timestamp'>): Comment {
    const newComment: Comment = {
      id: uuidv4(),
      ...commentData,
      timestamp: new Date().toISOString(),
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

  // File CRUD operations
  createFile(fileData: Omit<File, 'id' | 'uploadedAt'>): File {
    const newFile: File = {
      id: uuidv4(),
      ...fileData,
      uploadedAt: new Date().toISOString(),
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

  // History operations
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

  // Utility functions
  formatCurrency(amount: number, currency: 'BRL' | 'USD' | 'EUR'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  convertCurrency(amount: number, fromCurrency: 'BRL' | 'USD' | 'EUR', toCurrency: 'BRL' | 'USD' | 'EUR'): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const exchangeRates = {
      BRLtoUSD: 0.20,
      BRLtoEUR: 0.18,
      USDtoBRL: 4.95,
      USDtoEUR: 0.92,
      EURtoBRL: 5.41,
      EURtoUSD: 1.09,
    };

    try {
      if (fromCurrency === 'BRL' && toCurrency === 'USD') {
        return amount * exchangeRates.BRLtoUSD;
      } else if (fromCurrency === 'BRL' && toCurrency === 'EUR') {
        return amount * exchangeRates.BRLtoEUR;
      } else if (fromCurrency === 'USD' && toCurrency === 'BRL') {
        return amount * exchangeRates.USDtoBRL;
      } else if (fromCurrency === 'USD' && toCurrency === 'EUR') {
        return amount * exchangeRates.USDtoEUR;
      } else if (fromCurrency === 'EUR' && toCurrency === 'BRL') {
        return amount * exchangeRates.EURtoBRL;
      } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
        return amount * exchangeRates.EURtoUSD;
      } else {
        console.warn(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
        return amount;
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount;
    }
  }
}

export const db = new DatabaseService();

// Export utility functions
export const formatCurrency = (amount: number, currency: 'BRL' | 'USD' | 'EUR'): string => {
  return db.formatCurrency(amount, currency);
};

export const convertCurrency = (amount: number, fromCurrency: 'BRL' | 'USD' | 'EUR', toCurrency: 'BRL' | 'USD' | 'EUR'): number => {
  return db.convertCurrency(amount, fromCurrency, toCurrency);
};

// Update the updateProjectProgress function to calculate based on tasks
const updateProjectProgress = (projectId: string) => {
  try {
    const tasks = db.getProjectTasks(projectId);
    const completedTasks = tasks.filter(task => task.status === 'Concluída');
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    // Get current project data
    const project = db.getProject(projectId);
    if (project) {
      db.updateProject(projectId, { progress });
      db.addHistoryEntry(projectId, 'system', `Progresso atualizado automaticamente para ${progress}% baseado nas tarefas concluídas (${completedTasks.length}/${tasks.length})`);
    }
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

// Update createTask function to auto-update progress
export const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  const task = db.createTask(taskData);
  updateProjectProgress(taskData.projectId);
  return task;
};

// Update updateTask function to auto-update progress
export const updateTask = (id: string, updates: Partial<Task>) => {
  const task = db.updateTask(id, updates);
  if (task) {
    updateProjectProgress(task.projectId);
  }
  return task;
};

// Update deleteTask function to auto-update progress
export const deleteTask = (id: string) => {
  const task = db.getTask(id);
  if (task) {
    const projectId = task.projectId;
    db.deleteTask(id);
    updateProjectProgress(projectId);
  }
};

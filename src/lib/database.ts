// Database setup for local SQLite storage
export interface Project {
  id: string;
  name: string;
  client: string;
  responsible: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Em Progresso' | 'Pendente' | 'Concluído' | 'Atrasado';
  phase: 'Iniciação' | 'Planejamento' | 'Execução' | 'Encerramento';
  startDate: string;
  endDate: string;
  estimatedValue: number;
  finalValue: number;
  currency: 'BRL' | 'USD' | 'EUR';
  description: string;
  tags: string[];
  progress: number;
  isDeleted: boolean;
  isFinished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'Pendente' | 'Em Progresso' | 'Concluída';
  dueDate: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  filename: string;
  url: string;
  size: number;
  uploadDate: string;
}

export interface HistoryEntry {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  timestamp: string;
}

class LocalDatabase {
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private comments: Comment[] = [];
  private files: ProjectFile[] = [];
  private history: HistoryEntry[] = [];

  constructor() {
    // Load data from localStorage if available
    this.loadData();
    
    // Create sample data if no projects exist
    if (this.projects.length === 0) {
      this.createSampleData();
    }
  }

  private createSampleData() {
    const sampleProject = this.createProject({
      name: 'Sistema de Gestão de Projetos',
      client: 'Empresa Exemplo',
      responsible: 'João Silva',
      priority: 'Alta',
      status: 'Em Progresso',
      phase: 'Execução',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      estimatedValue: 50000,
      finalValue: 0,
      currency: 'BRL',
      description: 'Desenvolvimento de um sistema completo para gestão de projetos empresariais.',
      tags: ['desenvolvimento', 'sistema', 'gestão'],
      progress: 30
    });

    // Add some sample tasks
    this.createTask({
      projectId: sampleProject.id,
      name: 'Análise de Requisitos',
      description: 'Levantamento completo dos requisitos do sistema',
      status: 'Concluída',
      dueDate: '2024-02-15',
      priority: 'Alta'
    });

    this.createTask({
      projectId: sampleProject.id,
      name: 'Desenvolvimento do Frontend',
      description: 'Criação da interface do usuário',
      status: 'Em Progresso',
      dueDate: '2024-06-30',
      priority: 'Alta'
    });

    this.createTask({
      projectId: sampleProject.id,
      name: 'Testes do Sistema',
      description: 'Testes funcionais e de integração',
      status: 'Pendente',
      dueDate: '2024-11-30',
      priority: 'Média'
    });

    // Add sample comment
    this.createComment({
      projectId: sampleProject.id,
      userId: 'user-1',
      text: 'Projeto iniciado com sucesso. Equipe alinhada com os objetivos.'
    });

    // Add history entry
    this.addHistoryEntry(sampleProject.id, 'system', 'Projeto criado com dados de exemplo');
  }

  private loadData() {
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      this.projects = JSON.parse(storedProjects);
    }

    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      this.tasks = JSON.parse(storedTasks);
    }

    const storedComments = localStorage.getItem('comments');
    if (storedComments) {
      this.comments = JSON.parse(storedComments);
    }

    const storedFiles = localStorage.getItem('files');
    if (storedFiles) {
      this.files = JSON.parse(storedFiles);
    }

    const storedHistory = localStorage.getItem('history');
    if (storedHistory) {
      this.history = JSON.parse(storedHistory);
    }
  }

  private saveData() {
    localStorage.setItem('projects', JSON.stringify(this.projects));
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('comments', JSON.stringify(this.comments));
    localStorage.setItem('files', JSON.stringify(this.files));
    localStorage.setItem('history', JSON.stringify(this.history));
  }

  // Project CRUD operations
  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'isFinished'>): Project {
    const newProject: Project = {
      id: crypto.randomUUID(),
      ...projectData,
      isDeleted: false,
      isFinished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.push(newProject);
    this.saveData();
    return newProject;
  }

  getProject(id: string): Project | undefined {
    return this.projects.find((project) => project.id === id && !project.isDeleted);
  }

  getActiveProjects(): Project[] {
    return this.projects.filter((project) => !project.isDeleted && !project.isFinished);
  }

  getDeletedProjects(): Project[] {
    return this.projects.filter((project) => project.isDeleted);
  }

  getFinishedProjects(): Project[] {
    return this.projects.filter((project) => project.isFinished && !project.isDeleted);
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project | undefined {
    const projectIndex = this.projects.findIndex((project) => project.id === id && !project.isDeleted);
    if (projectIndex === -1) {
      return undefined;
    }

    this.projects[projectIndex] = {
      ...this.projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.projects[projectIndex];
  }

  deleteProject(id: string): boolean {
    const project = this.getProject(id);
    if (!project) {
      return false;
    }
    project.isDeleted = true;
    this.saveData();
    return true;
  }

  finishProject(id: string): boolean {
    const projectIndex = this.projects.findIndex((project) => project.id === id && !project.isDeleted);
    if (projectIndex === -1) {
      return false;
    }
    this.projects[projectIndex].isFinished = true;
    this.saveData();
    return true;
  }

  // Task CRUD operations
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.saveData();
    return newTask;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  getProjectTasks(projectId: string): Task[] {
    return this.tasks.filter((task) => task.projectId === projectId);
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | undefined {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      return undefined;
    }

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.tasks[taskIndex];
  }

  deleteTask(id: string): boolean {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      return false;
    }

    this.tasks.splice(taskIndex, 1);
    this.saveData();
    return true;
  }

  // Comment CRUD operations
  createComment(commentData: Omit<Comment, 'id' | 'createdAt'>): Comment {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      ...commentData,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(newComment);
    this.saveData();
    return newComment;
  }

  getComment(id: string): Comment | undefined {
    return this.comments.find((comment) => comment.id === id);
  }

  getProjectComments(projectId: string): Comment[] {
    return this.comments.filter((comment) => comment.projectId === projectId);
  }

  updateComment(id: string, updates: Partial<Omit<Comment, 'id' | 'createdAt'>>): Comment | undefined {
    const commentIndex = this.comments.findIndex((comment) => comment.id === id);
    if (commentIndex === -1) {
      return undefined;
    }

    this.comments[commentIndex] = {
      ...this.comments[commentIndex],
      ...updates,
    };
    this.saveData();
    return this.comments[commentIndex];
  }

  deleteComment(id: string): boolean {
    const commentIndex = this.comments.findIndex((comment) => comment.id === id);
    if (commentIndex === -1) {
      return false;
    }

    this.comments.splice(commentIndex, 1);
    this.saveData();
    return true;
  }

  // File CRUD operations
  createFile(fileData: Omit<ProjectFile, 'id' | 'uploadDate'>): ProjectFile {
    const newFile: ProjectFile = {
      id: crypto.randomUUID(),
      ...fileData,
      uploadDate: new Date().toISOString(),
    };
    this.files.push(newFile);
    this.saveData();
    return newFile;
  }

  getFile(id: string): ProjectFile | undefined {
    return this.files.find((file) => file.id === id);
  }

  getProjectFiles(projectId: string): ProjectFile[] {
    return this.files.filter((file) => file.projectId === projectId);
  }

  deleteFile(id: string): boolean {
    const fileIndex = this.files.findIndex((file) => file.id === id);
    if (fileIndex === -1) {
      return false;
    }

    this.files.splice(fileIndex, 1);
    this.saveData();
    return true;
  }

  // History tracking
  addHistoryEntry(projectId: string, userId: string, action: string): void {
    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      projectId,
      userId,
      action,
      timestamp: new Date().toISOString(),
    };
    this.history.push(newEntry);
    this.saveData();
  }

  getProjectHistory(projectId: string): HistoryEntry[] {
    return this.history.filter((entry) => entry.projectId === projectId);
  }
}

export const db = new LocalDatabase();

// Currency utilities
export const CURRENCIES = {
  BRL: { symbol: 'R$', name: 'Real Brasileiro' },
  USD: { symbol: '$', name: 'Dólar Americano' },
  EUR: { symbol: '€', name: 'Euro' }
} as const;

export const formatCurrency = (value: number, currency: 'BRL' | 'USD' | 'EUR') => {
  const currencyMap = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE'
  };

  return new Intl.NumberFormat(currencyMap[currency], {
    style: 'currency',
    currency: currency
  }).format(value);
};

// Exchange rates for conversion (in a real app, this would come from an API)
export const EXCHANGE_RATES = {
  BRL: { USD: 0.20, EUR: 0.18 },
  USD: { BRL: 5.00, EUR: 0.92 },
  EUR: { BRL: 5.50, USD: 1.09 }
};

export const convertCurrency = (amount: number, from: 'BRL' | 'USD' | 'EUR', to: 'BRL' | 'USD' | 'EUR'): number => {
  if (from === to) return amount;
  
  if (from === 'BRL') {
    return amount * EXCHANGE_RATES.BRL[to as keyof typeof EXCHANGE_RATES.BRL];
  } else if (from === 'USD') {
    return amount * EXCHANGE_RATES.USD[to as keyof typeof EXCHANGE_RATES.USD];
  } else {
    return amount * EXCHANGE_RATES.EUR[to as keyof typeof EXCHANGE_RATES.EUR];
  }
};

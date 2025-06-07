// Database setup for local SQLite storage
export interface Project {
  id: string;
  name: string;
  client: string;
  responsible: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Em Progresso' | 'Pendente' | 'Concluído' | 'Atrasado';
  phase: 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento';
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
  assignedTo: string;
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
  details?: any;
  type: 'project' | 'task' | 'comment' | 'file';
  icon?: string;
}

class LocalDatabase {
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private comments: Comment[] = [];
  private files: ProjectFile[] = [];
  private history: HistoryEntry[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
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
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    }
  }

  private saveData() {
    try {
      localStorage.setItem('projects', JSON.stringify(this.projects));
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
      localStorage.setItem('comments', JSON.stringify(this.comments));
      localStorage.setItem('files', JSON.stringify(this.files));
      localStorage.setItem('history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  // Enhanced history tracking with detailed information
  addHistoryEntry(
    projectId: string, 
    userId: string, 
    action: string, 
    type: 'project' | 'task' | 'comment' | 'file' = 'project',
    details?: any,
    icon?: string
  ): void {
    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      projectId,
      userId,
      action,
      timestamp: new Date().toISOString(),
      type,
      details,
      icon
    };
    this.history.push(newEntry);
    this.saveData();
  }

  getProjectHistory(projectId: string): HistoryEntry[] {
    return this.history
      .filter((entry) => entry.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Project CRUD operations with enhanced history
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
    this.addHistoryEntry(
      newProject.id, 
      'system', 
      `Projeto "${newProject.name}" criado`, 
      'project',
      {
        client: newProject.client,
        responsible: newProject.responsible,
        priority: newProject.priority,
        status: newProject.status
      },
      '🎯'
    );
    return newProject;
  }

  getProject(id: string): Project | undefined {
    return this.projects.find((project) => project.id === id && !project.isDeleted);
  }

  getAllProjects(): Project[] {
    return this.projects;
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
    const projectIndex = this.projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      return undefined;
    }

    const oldProject = { ...this.projects[projectIndex] };
    this.projects[projectIndex] = {
      ...this.projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    
    // Track detailed changes with emojis
    const changes: string[] = [];
    if (oldProject.name !== this.projects[projectIndex].name) {
      changes.push(`📝 Nome alterado: "${oldProject.name}" → "${this.projects[projectIndex].name}"`);
      this.addHistoryEntry(id, 'user', `Nome do projeto alterado para "${this.projects[projectIndex].name}"`, 'project', { oldValue: oldProject.name, newValue: this.projects[projectIndex].name }, '📝');
    }
    if (oldProject.client !== this.projects[projectIndex].client) {
      changes.push(`🏢 Cliente alterado: "${oldProject.client}" → "${this.projects[projectIndex].client}"`);
      this.addHistoryEntry(id, 'user', `Cliente alterado para "${this.projects[projectIndex].client}"`, 'project', { oldValue: oldProject.client, newValue: this.projects[projectIndex].client }, '🏢');
    }
    if (oldProject.responsible !== this.projects[projectIndex].responsible) {
      changes.push(`👤 Responsável alterado: "${oldProject.responsible}" → "${this.projects[projectIndex].responsible}"`);
      this.addHistoryEntry(id, 'user', `Responsável alterado para "${this.projects[projectIndex].responsible}"`, 'project', { oldValue: oldProject.responsible, newValue: this.projects[projectIndex].responsible }, '👤');
    }
    if (oldProject.status !== this.projects[projectIndex].status) {
      changes.push(`🔄 Status alterado: "${oldProject.status}" → "${this.projects[projectIndex].status}"`);
      this.addHistoryEntry(id, 'user', `Status alterado para "${this.projects[projectIndex].status}"`, 'project', { oldValue: oldProject.status, newValue: this.projects[projectIndex].status }, '🔄');
    }
    if (oldProject.priority !== this.projects[projectIndex].priority) {
      changes.push(`⚡ Prioridade alterada: "${oldProject.priority}" → "${this.projects[projectIndex].priority}"`);
      this.addHistoryEntry(id, 'user', `Prioridade alterada para "${this.projects[projectIndex].priority}"`, 'project', { oldValue: oldProject.priority, newValue: this.projects[projectIndex].priority }, '⚡');
    }
    if (oldProject.phase !== this.projects[projectIndex].phase) {
      changes.push(`🎭 Fase alterada: "${oldProject.phase}" → "${this.projects[projectIndex].phase}"`);
      this.addHistoryEntry(id, 'user', `Fase alterada para "${this.projects[projectIndex].phase}"`, 'project', { oldValue: oldProject.phase, newValue: this.projects[projectIndex].phase }, '🎭');
    }
    if (oldProject.progress !== this.projects[projectIndex].progress) {
      changes.push(`📊 Progresso alterado: ${oldProject.progress}% → ${this.projects[projectIndex].progress}%`);
      this.addHistoryEntry(id, 'user', `Progresso atualizado para ${this.projects[projectIndex].progress}%`, 'project', { oldValue: oldProject.progress, newValue: this.projects[projectIndex].progress }, '📊');
    }
    if (oldProject.estimatedValue !== this.projects[projectIndex].estimatedValue) {
      this.addHistoryEntry(id, 'user', `Valor estimado alterado`, 'project', { oldValue: oldProject.estimatedValue, newValue: this.projects[projectIndex].estimatedValue }, '💰');
    }
    if (oldProject.finalValue !== this.projects[projectIndex].finalValue) {
      this.addHistoryEntry(id, 'user', `Valor final alterado`, 'project', { oldValue: oldProject.finalValue, newValue: this.projects[projectIndex].finalValue }, '💰');
    }
    if (oldProject.startDate !== this.projects[projectIndex].startDate) {
      this.addHistoryEntry(id, 'user', `Data de início alterada`, 'project', { oldValue: oldProject.startDate, newValue: this.projects[projectIndex].startDate }, '📅');
    }
    if (oldProject.endDate !== this.projects[projectIndex].endDate) {
      this.addHistoryEntry(id, 'user', `Data de fim alterada`, 'project', { oldValue: oldProject.endDate, newValue: this.projects[projectIndex].endDate }, '📅');
    }
    if (oldProject.description !== this.projects[projectIndex].description) {
      this.addHistoryEntry(id, 'user', `Descrição do projeto atualizada`, 'project', { changed: true }, '📄');
    }
    
    return this.projects[projectIndex];
  }

  deleteProject(id: string): boolean {
    const project = this.getProject(id);
    if (!project) {
      return false;
    }
    project.isDeleted = true;
    this.saveData();
    this.addHistoryEntry(id, 'user', `Projeto "${project.name}" movido para lixeira`, 'project', {}, '🗑️');
    return true;
  }

  finishProject(id: string): boolean {
    const projectIndex = this.projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      return false;
    }
    this.projects[projectIndex].isFinished = true;
    this.projects[projectIndex].isDeleted = false;
    this.saveData();
    this.addHistoryEntry(id, 'user', `Projeto "${this.projects[projectIndex].name}" finalizado`, 'project', {}, '✅');
    return true;
  }

  restoreProject(id: string): boolean {
    const projectIndex = this.projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      return false;
    }
    this.projects[projectIndex].isDeleted = false;
    this.projects[projectIndex].isFinished = false;
    this.saveData();
    this.addHistoryEntry(id, 'user', `Projeto "${this.projects[projectIndex].name}" restaurado`, 'project', {}, '♻️');
    return true;
  }

  // Task CRUD operations with enhanced history
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.saveData();
    this.addHistoryEntry(
      taskData.projectId, 
      'user', 
      `Nova tarefa criada: "${taskData.name}"`, 
      'task',
      {
        taskName: taskData.name,
        priority: taskData.priority,
        status: taskData.status,
        assignedTo: taskData.assignedTo
      },
      '📋'
    );
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

    const oldTask = this.tasks[taskIndex];
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    
    // Track task changes with specific icons
    if (updates.status && updates.status !== oldTask.status) {
      let icon = '📝';
      if (updates.status === 'Concluída') icon = '✅';
      else if (updates.status === 'Em Progresso') icon = '🔄';
      else if (updates.status === 'Pendente') icon = '⏳';
      
      this.addHistoryEntry(
        oldTask.projectId, 
        'user', 
        `Tarefa "${oldTask.name}" alterada de "${oldTask.status}" para "${updates.status}"`, 
        'task',
        {
          taskName: oldTask.name,
          oldStatus: oldTask.status,
          newStatus: updates.status
        },
        icon
      );
    } else {
      this.addHistoryEntry(
        oldTask.projectId, 
        'user', 
        `Tarefa "${oldTask.name}" atualizada`, 
        'task',
        { taskName: oldTask.name },
        '📝'
      );
    }
    
    return this.tasks[taskIndex];
  }

  deleteTask(id: string): boolean {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      return false;
    }

    const task = this.tasks[taskIndex];
    this.addHistoryEntry(
      task.projectId, 
      'user', 
      `Tarefa "${task.name}" excluída`, 
      'task',
      { taskName: task.name },
      '🗑️'
    );
    this.tasks.splice(taskIndex, 1);
    this.saveData();
    return true;
  }

  // Comment CRUD operations with enhanced history
  createComment(commentData: Omit<Comment, 'id' | 'createdAt'>): Comment {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      ...commentData,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(newComment);
    this.saveData();
    this.addHistoryEntry(
      commentData.projectId, 
      commentData.userId, 
      `Novo comentário adicionado`, 
      'comment',
      {
        comment: commentData.text.substring(0, 50) + (commentData.text.length > 50 ? '...' : ''),
        taskId: commentData.taskId
      },
      '💬'
    );
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

    const comment = this.comments[commentIndex];
    this.comments[commentIndex] = {
      ...this.comments[commentIndex],
      ...updates,
    };
    this.saveData();
    this.addHistoryEntry(
      comment.projectId, 
      comment.userId, 
      `Comentário editado`, 
      'comment',
      { edited: true },
      '✏️'
    );
    return this.comments[commentIndex];
  }

  deleteComment(id: string): boolean {
    const commentIndex = this.comments.findIndex((comment) => comment.id === id);
    if (commentIndex === -1) {
      return false;
    }

    const comment = this.comments[commentIndex];
    this.addHistoryEntry(
      comment.projectId, 
      comment.userId, 
      `Comentário excluído`, 
      'comment',
      {},
      '🗑️'
    );
    this.comments.splice(commentIndex, 1);
    this.saveData();
    return true;
  }

  // File CRUD operations with enhanced history
  createFile(fileData: Omit<ProjectFile, 'id' | 'uploadDate'>): ProjectFile {
    const newFile: ProjectFile = {
      id: crypto.randomUUID(),
      ...fileData,
      uploadDate: new Date().toISOString(),
    };
    this.files.push(newFile);
    this.saveData();
    this.addHistoryEntry(
      fileData.projectId, 
      'user', 
      `Arquivo "${fileData.filename}" adicionado`, 
      'file',
      {
        filename: fileData.filename,
        size: fileData.size
      },
      '📎'
    );
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

    const file = this.files[fileIndex];
    this.addHistoryEntry(
      file.projectId, 
      'user', 
      `Arquivo "${file.filename}" excluído`, 
      'file',
      { filename: file.filename },
      '🗑️'
    );
    this.files.splice(fileIndex, 1);
    this.saveData();
    return true;
  }

  permanentDeleteProject(id: string): boolean {
    const projectIndex = this.projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      return false;
    }
    const project = this.projects[projectIndex];
    this.addHistoryEntry(id, 'user', `Projeto "${project.name}" excluído permanentemente`, 'project', {}, '💀');
    this.projects.splice(projectIndex, 1);
    this.saveData();
    return true;
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

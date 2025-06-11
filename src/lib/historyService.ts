
import { v4 as uuidv4 } from 'uuid';

export interface HistoryEntry {
  id: string;
  projectId: string;
  user: string;
  action: string;
  timestamp: string;
  details?: any;
}

class HistoryService {
  private static instance: HistoryService;
  private readonly STORAGE_KEY = 'project_history';

  private constructor() {}

  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  private getHistory(): HistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveHistory(history: HistoryEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  addEntry(projectId: string, action: string, user: string = 'Usuário', details?: any): void {
    const history = this.getHistory();
    const entry: HistoryEntry = {
      id: uuidv4(),
      projectId,
      user,
      action,
      timestamp: new Date().toISOString(),
      details
    };

    history.unshift(entry);
    
    if (history.length > 1000) {
      history.splice(1000);
    }

    this.saveHistory(history);
    console.log('Entrada de histórico adicionada:', entry);
  }

  getProjectHistory(projectId: string): HistoryEntry[] {
    const history = this.getHistory();
    return history.filter(entry => entry.projectId === projectId);
  }

  getAllHistory(): HistoryEntry[] {
    return this.getHistory();
  }

  clearProjectHistory(projectId: string): void {
    const history = this.getHistory();
    const filtered = history.filter(entry => entry.projectId !== projectId);
    this.saveHistory(filtered);
  }

  clearAllHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const historyService = HistoryService.getInstance();

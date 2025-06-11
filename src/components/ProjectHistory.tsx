
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText, CheckSquare, MessageSquare, AlertTriangle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { historyService, HistoryEntry } from '../lib/historyService';

interface ProjectHistoryProps {
  projectId: string;
  onHistoryCountChange?: (count: number) => void;
}

const ProjectHistory: React.FC<ProjectHistoryProps> = ({ projectId, onHistoryCountChange }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, [projectId]);

  const loadHistory = () => {
    const projectHistory = historyService.getProjectHistory(projectId);
    setHistory(projectHistory);
    onHistoryCountChange?.(projectHistory.length);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('criado') || action.includes('adicionado')) {
      return <CheckSquare className="h-4 w-4 text-green-600" />;
    }
    if (action.includes('editado') || action.includes('atualizado')) {
      return <Edit className="h-4 w-4 text-blue-600" />;
    }
    if (action.includes('comentário')) {
      return <MessageSquare className="h-4 w-4 text-purple-600" />;
    }
    if (action.includes('arquivo') || action.includes('upload')) {
      return <FileText className="h-4 w-4 text-orange-600" />;
    }
    if (action.includes('risco')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('criado') || action.includes('adicionado')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('editado') || action.includes('atualizado')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('comentário')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (action.includes('arquivo') || action.includes('upload')) {
      return 'bg-orange-100 text-orange-800';
    }
    if (action.includes('risco')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Histórico de Alterações</h3>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Nenhuma atividade registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <Card key={entry.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getActionIcon(entry.action)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        {entry.user}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-2">{entry.action}</p>
                    
                    <Badge className={getActionColor(entry.action)} variant="secondary">
                      {entry.action.includes('criado') || entry.action.includes('adicionado') ? 'Criação' :
                       entry.action.includes('editado') || entry.action.includes('atualizado') ? 'Edição' :
                       entry.action.includes('comentário') ? 'Comentário' :
                       entry.action.includes('arquivo') ? 'Arquivo' :
                       entry.action.includes('risco') ? 'Risco' :
                       'Atividade'}
                    </Badge>
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

export default ProjectHistory;

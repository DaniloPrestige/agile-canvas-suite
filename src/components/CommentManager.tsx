
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, Edit } from 'lucide-react';
import { db, Comment } from '../lib/database';

interface CommentManagerProps {
  projectId: string;
}

const CommentManager: React.FC<CommentManagerProps> = ({ projectId }) => {
  const [comments, setComments] = useState<Comment[]>(db.getProjectComments(projectId));
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const loadComments = () => {
    setComments(db.getProjectComments(projectId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      db.createComment({
        projectId,
        author: 'Usuário', // Added required author field
        text: newComment,
      });
      setNewComment('');
      loadComments();
    }
  };

  const handleEdit = (commentId: string, text: string) => {
    setEditingComment(commentId);
    setEditText(text);
  };

  const handleSaveEdit = (commentId: string) => {
    if (editText.trim()) {
      db.updateComment(commentId, { text: editText });
      setEditingComment(null);
      setEditText('');
      loadComments();
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const handleDelete = (commentId: string) => {
    db.deleteComment(commentId);
    loadComments();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Comentários</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={!newComment.trim()}>
            Adicionar Comentário
          </Button>
        </form>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum comentário encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Usuário</p>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(comment.id, comment.text)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{comment.text}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentManager;

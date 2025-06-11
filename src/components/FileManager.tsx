
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { db, ProjectFile } from '../lib/database';
import { historyService } from '../lib/historyService';

interface FileManagerProps {
  projectId: string;
  onFileCountChange?: (count: number) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ projectId, onFileCountChange }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = () => {
    const projectFiles = db.getProjectFiles(projectId);
    setFiles(projectFiles);
    onFileCountChange?.(projectFiles.length);
  };

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        db.createFile({
          projectId,
          name: file.name,
          filename: file.name,
          url: reader.result as string,
          size: file.size,
          type: file.type,
        });
        
        historyService.addEntry(projectId, `Arquivo "${file.name}" foi enviado`, 'Usuário do Sistema');
        
        loadFiles();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDelete = (fileId: string, filename: string) => {
    db.deleteFile(fileId);
    
    historyService.addEntry(projectId, `Arquivo "${filename}" foi excluído`, 'Usuário do Sistema');
    
    loadFiles();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Arquivos do Projeto</h3>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            Selecionar Arquivos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{file.filename}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>Enviado em {formatDate(file.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.filename;
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(file.id, file.filename)}
                    >
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

export default FileManager;

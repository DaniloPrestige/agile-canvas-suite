
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { db } from '../lib/database';

export type Risk = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  impact: 'Baixo' | 'Médio' | 'Alto';
  probability: 'Baixa' | 'Média' | 'Alta';
  status: 'Ativo' | 'Mitigado' | 'Ocorrido';
  mitigation: string;
  createdAt: string;
  updatedAt: string;
};

interface RiskManagerProps {
  projectId: string;
}

const RiskManager: React.FC<RiskManagerProps> = ({ projectId }) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    impact: 'Médio' as const,
    probability: 'Média' as const,
    status: 'Ativo' as const,
    mitigation: ''
  });

  useEffect(() => {
    loadRisks();
  }, [projectId]);

  const loadRisks = () => {
    // Simulate loading risks - replace with actual db call when implemented
    setRisks([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRisk) {
      // Update existing risk
      setEditingRisk(null);
    } else {
      // Create new risk
    }
    
    setFormData({
      name: '',
      description: '',
      impact: 'Médio',
      probability: 'Média',
      status: 'Ativo',
      mitigation: ''
    });
    setIsAddingRisk(false);
    loadRisks();
  };

  const handleEdit = (risk: Risk) => {
    setFormData({
      name: risk.name,
      description: risk.description,
      impact: risk.impact,
      probability: risk.probability,
      status: risk.status,
      mitigation: risk.mitigation
    });
    setEditingRisk(risk);
    setIsAddingRisk(true);
  };

  const handleDelete = (risk: Risk) => {
    if (window.confirm(`Tem certeza que deseja excluir o risco "${risk.name}"?`)) {
      loadRisks();
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Alto': return 'bg-red-100 text-red-800';
      case 'Médio': return 'bg-yellow-100 text-yellow-800';
      case 'Baixo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-blue-100 text-blue-800';
      case 'Mitigado': return 'bg-green-100 text-green-800';
      case 'Ocorrido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestão de Riscos</h3>
        <Button onClick={() => setIsAddingRisk(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Risco
        </Button>
      </div>

      {isAddingRisk && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRisk ? 'Editar Risco' : 'Adicionar Novo Risco'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="riskName">Nome do Risco</Label>
                <Input
                  id="riskName"
                  placeholder="Ex: Atraso na entrega"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="riskDescription">Descrição</Label>
                <Textarea
                  id="riskDescription"
                  placeholder="Descreva o risco em detalhes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="impact">Impacto</Label>
                  <Select value={formData.impact} onValueChange={(value: 'Baixo' | 'Médio' | 'Alto') => setFormData({ ...formData, impact: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="probability">Probabilidade</Label>
                  <Select value={formData.probability} onValueChange={(value: 'Baixa' | 'Média' | 'Alta') => setFormData({ ...formData, probability: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'Ativo' | 'Mitigado' | 'Ocorrido') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Mitigado">Mitigado</SelectItem>
                      <SelectItem value="Ocorrido">Ocorrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="mitigation">Plano de Contingência</Label>
                <Textarea
                  id="mitigation"
                  placeholder="Descreva as ações para mitigar este risco..."
                  value={formData.mitigation}
                  onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingRisk(false);
                    setEditingRisk(null);
                    setFormData({
                      name: '',
                      description: '',
                      impact: 'Médio',
                      probability: 'Média',
                      status: 'Ativo',
                      mitigation: ''
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRisk ? 'Atualizar' : 'Adicionar'} Risco
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h4 className="font-semibold">Riscos Identificados ({risks.length})</h4>
        
        {risks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum risco identificado ainda.</p>
          </div>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h5 className="font-semibold text-lg mb-2">{risk.name}</h5>
                    <p className="text-gray-600 mb-3">{risk.description}</p>
                    
                    <div className="flex gap-2 mb-3">
                      <Badge className={getImpactColor(risk.impact)}>
                        Impacto: {risk.impact}
                      </Badge>
                      <Badge className={getProbabilityColor(risk.probability)}>
                        Probabilidade: {risk.probability}
                      </Badge>
                      <Badge className={getStatusColor(risk.status)}>
                        {risk.status}
                      </Badge>
                    </div>

                    {risk.mitigation && (
                      <div>
                        <p className="font-medium text-sm mb-1">Plano de Contingência:</p>
                        <p className="text-sm text-gray-600">{risk.mitigation}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(risk)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(risk)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RiskManager;


import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectDetailsRiskProps {
  projectId: string;
}

const ProjectDetailsRisk: React.FC<ProjectDetailsRiskProps> = ({ projectId }) => {
  return (
    <div className="mt-6">
      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="risks">Riscos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="risks" className="mt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Sistema de riscos em desenvolvimento</p>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Sistema de histórico em desenvolvimento</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailsRisk;

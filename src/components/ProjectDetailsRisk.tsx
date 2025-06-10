
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RiskManager from './RiskManager';
import ProjectHistory from './ProjectHistory';

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
          <RiskManager projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <ProjectHistory projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailsRisk;

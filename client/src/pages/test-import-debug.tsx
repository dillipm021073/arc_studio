import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { projectStorage } from '@/services/project-storage';

export default function TestImportDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  const testAuth = async () => {
    try {
      addLog('Testing authentication...');
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      addLog(`Auth response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Auth error: ${error}`);
    }
  };

  const testGetTeamProjects = async () => {
    try {
      addLog('Fetching team projects...');
      const projects = await projectStorage.getTeamProjects();
      addLog(`Found ${projects.length} team projects`);
      if (projects.length > 0) {
        addLog(`First project: ${JSON.stringify(projects[0], null, 2)}`);
      }
      return projects;
    } catch (error) {
      addLog(`Error fetching team projects: ${error}`);
      return [];
    }
  };

  const testGetSingleProject = async (projectId: string) => {
    try {
      addLog(`Fetching single project: ${projectId}`);
      const response = await fetch(`/api/interface-builder/projects/${projectId}`);
      const data = await response.json();
      addLog(`Project data: ${JSON.stringify(data, null, 2)}`);
      return data;
    } catch (error) {
      addLog(`Error fetching project: ${error}`);
      return null;
    }
  };

  const testImport = async (projectId: string) => {
    try {
      addLog(`Starting import for project: ${projectId}`);
      
      // Step 1: Get the project
      addLog('Step 1: Fetching project data...');
      const project = await testGetSingleProject(projectId);
      if (!project) {
        addLog('Failed to fetch project');
        return;
      }
      
      // Step 2: Send import request
      addLog('Step 2: Sending import request...');
      const response = await fetch(`/api/local-projects/import/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      addLog(`Import response status: ${response.status}`);
      const responseText = await response.text();
      addLog(`Import response body: ${responseText}`);
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        addLog(`Import successful: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      addLog(`Import error: ${error}`);
    }
  };

  const runFullTest = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      // Test 1: Check auth
      await testAuth();
      
      // Test 2: Get team projects
      const projects = await testGetTeamProjects();
      
      // Test 3: Try to import first project
      if (projects.length > 0) {
        await testImport(projects[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Debug Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runFullTest} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run Import Test'}
            </Button>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Debug Logs:</h3>
              <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <pre key={index} className="text-xs mb-1">{log}</pre>
                ))}
                {logs.length === 0 && (
                  <p className="text-gray-500">No logs yet. Click the button above to start testing.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
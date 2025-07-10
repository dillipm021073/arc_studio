import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Node, Edge } from 'reactflow';
import EnhancedCanvas from '@/components/interface-builder/enhanced-canvas';
import PropertiesPanel from '@/components/interface-builder/properties-panel';
import ComponentLibrary from '@/components/interface-builder/component-library';

export default function TestVisioComplete() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'enhancedRectangle',
      position: { x: 200, y: 100 },
      data: {
        label: 'Process',
        width: 180,
        height: 80,
        rotation: 0,
        fillColor: '#3182ce',
        fillOpacity: 100,
        strokeColor: '#ffffff',
        strokeWidth: 2,
        strokeStyle: 'solid',
        borderRadius: 8,
        text: 'Main Process',
        fontSize: 16,
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        textColor: '#ffffff',
        textAlign: 'center',
        shadowEnabled: true,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 4,
        shadowColor: '#000000',
      },
    },
    {
      id: '2',
      type: 'shape',
      position: { x: 450, y: 120 },
      data: {
        id: 'diamond',
        label: 'Decision',
        width: 120,
        height: 120,
        fillColor: '#e53e3e',
        fillOpacity: 90,
        strokeColor: '#ffffff',
        strokeWidth: 3,
        text: 'Decision Point',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '3',
      type: 'arrow',
      position: { x: 200, y: 250 },
      data: {
        width: 150,
        height: 60,
        fillColor: '#48bb78',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Next Step',
        fontSize: 14,
        textColor: '#ffffff',
        arrowDirection: 'right',
        arrowStyle: 'single',
        headSize: 20,
      },
    },
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  const handleNodeUpdate = (nodeId: string, data: any) => {
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.id === nodeId) {
          // Handle position updates separately
          if (data.position) {
            return { ...node, position: data.position, data: { ...node.data, ...data } };
          }
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
  };

  const handleCanvasChange = (newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Update selected nodes based on selection in canvas
    const selected = newNodes.filter(node => node.selected);
    setSelectedNodes(selected);
  };

  const handleComponentSelect = (component: any) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: component.type === 'shape' ? 'shape' : component.type,
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        ...component.properties,
        label: component.name,
        onUpdate: (data: any) => handleNodeUpdate(newNode.id, data),
      },
    };
    setNodes(current => [...current, newNode]);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white">Complete Visio-like Interface Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {nodes.length} shapes • {edges.length} connections • {selectedNodes.length} selected
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Library */}
        <ComponentLibrary onComponentSelect={handleComponentSelect} />

        {/* Canvas */}
        <div className="flex-1 bg-gray-900">
          <EnhancedCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onChange={handleCanvasChange}
          />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          selectedNodes={selectedNodes}
          onUpdate={handleNodeUpdate}
        />
      </div>
    </div>
  );
}
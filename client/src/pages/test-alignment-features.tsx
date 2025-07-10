import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'wouter';
import { Node, Edge } from 'reactflow';
import EnhancedCanvas from '@/components/interface-builder/enhanced-canvas';

export default function TestAlignmentFeatures() {
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'enhancedRectangle',
      position: { x: 50, y: 50 },
      data: {
        label: 'Node 1',
        width: 150,
        height: 80,
        fillColor: '#2d3748',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Select Multiple',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '2',
      type: 'shape',
      position: { x: 250, y: 120 },
      data: {
        id: 'star',
        label: 'Node 2',
        width: 100,
        height: 100,
        fillColor: '#805ad5',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        points: 5,
        innerRadius: 30,
        text: 'And Align',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '3',
      type: 'arrow',
      position: { x: 400, y: 80 },
      data: {
        width: 120,
        height: 50,
        fillColor: '#e53e3e',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Or Distribute',
        fontSize: 12,
        textColor: '#ffffff',
        arrowDirection: 'right',
      },
    },
    {
      id: '4',
      type: 'shape',
      position: { x: 150, y: 250 },
      data: {
        id: 'hexagon',
        label: 'Node 4',
        width: 100,
        height: 100,
        fillColor: '#319795',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Snap to Grid',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '5',
      type: 'enhancedRectangle',
      position: { x: 320, y: 280 },
      data: {
        label: 'Node 5',
        width: 140,
        height: 70,
        fillColor: '#3182ce',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        borderRadius: 12,
        text: 'Smart Guides',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '6',
      type: 'shape',
      position: { x: 500, y: 200 },
      data: {
        id: 'pentagon',
        label: 'Node 6',
        width: 90,
        height: 90,
        fillColor: '#d69e2e',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Resize',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
  ];

  const handleChange = (nodes: Node[], edges: Edge[]) => {
    setNodeCount(nodes.length);
    setEdgeCount(edges.length);
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
          <h1 className="text-xl font-semibold text-white">Alignment & Distribution Test</h1>
          <Badge variant="secondary">
            {nodeCount} nodes, {edgeCount} edges
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1 bg-gray-900">
          <EnhancedCanvas
            initialNodes={initialNodes}
            initialEdges={[]}
            onChange={handleChange}
          />
        </div>

        {/* Help Panel */}
        <Card className="w-96 m-4 p-4 bg-gray-800 border-gray-700 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Visio-like Alignment Features</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">🎯 Selection</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click to select a single shape</li>
                <li>Ctrl+Click to add/remove from selection</li>
                <li>Drag to create selection rectangle</li>
                <li>Selected shapes show resize & rotation handles</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">↔️ Alignment (2+ shapes)</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><kbd>Ctrl+Shift+L</kbd> - Align Left</li>
                <li><kbd>Ctrl+Shift+C</kbd> - Align Center</li>
                <li><kbd>Ctrl+Shift+R</kbd> - Align Right</li>
                <li><kbd>Ctrl+Shift+T</kbd> - Align Top</li>
                <li><kbd>Ctrl+Shift+M</kbd> - Align Middle</li>
                <li><kbd>Ctrl+Shift+B</kbd> - Align Bottom</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">📊 Distribution (3+ shapes)</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><kbd>Ctrl+Shift+H</kbd> - Distribute Horizontally</li>
                <li><kbd>Ctrl+Shift+V</kbd> - Distribute Vertically</li>
                <li>Creates equal spacing between shapes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">🔧 Smart Features</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Smart Guides:</strong> Blue dashed lines appear when dragging to show alignment</li>
                <li><strong>Snap to Grid:</strong> Shapes snap to 10px grid (toggle in toolbar)</li>
                <li><strong>Grid Display:</strong> Toggle grid dots visibility</li>
                <li><strong>8-Point Resize:</strong> Drag handles to resize shapes</li>
                <li><strong>Rotation:</strong> Drag rotation handle above shape</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">💡 Try This</h3>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Select multiple shapes (Ctrl+Click)</li>
                <li>Use toolbar buttons or shortcuts to align</li>
                <li>Select 3+ shapes and distribute them</li>
                <li>Drag a shape to see smart guides</li>
                <li>Toggle snap to grid and drag shapes</li>
                <li>Resize shapes with 8-point handles</li>
                <li>Rotate shapes with the rotation handle</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
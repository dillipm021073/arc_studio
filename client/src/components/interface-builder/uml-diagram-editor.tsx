import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Copy,
  Clipboard,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RefreshCw,
  Code,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface UmlDiagram {
  id: number;
  folderId: number;
  name: string;
  description?: string;
  content: string;
  diagramType: string;
  createdAt: string;
  updatedAt: string;
}

interface UmlDiagramEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagram: UmlDiagram;
  onSave: (diagram: UmlDiagram) => void;
}

const DIAGRAM_TYPES = [
  { value: 'sequence', label: 'Sequence Diagram' },
  { value: 'activity', label: 'Activity Diagram' },
  { value: 'class', label: 'Class Diagram' },
  { value: 'usecase', label: 'Use Case Diagram' },
  { value: 'component', label: 'Component Diagram' },
  { value: 'state', label: 'State Diagram' },
  { value: 'deployment', label: 'Deployment Diagram' },
  { value: 'object', label: 'Object Diagram' },
  { value: 'package', label: 'Package Diagram' },
  { value: 'timing', label: 'Timing Diagram' },
  { value: 'custom', label: 'Custom Diagram' }
];

const PLANTUML_TEMPLATES = {
  sequence: `@startuml
actor User
participant "Frontend" as FE
participant "Backend" as BE
database "Database" as DB

User -> FE: Request
FE -> BE: API Call
BE -> DB: Query
DB --> BE: Result
BE --> FE: Response
FE --> User: Display
@enduml`,
  activity: `@startuml
start
:Initialize Process;
if (Condition?) then (yes)
  :Process A;
  :Process B;
else (no)
  :Alternative Process;
endif
:Finalize;
stop
@enduml`,
  class: `@startuml
class User {
  -id: Long
  -name: String
  -email: String
  +getName(): String
  +setName(name: String): void
}

class Order {
  -id: Long
  -date: Date
  -status: String
  +getTotal(): Double
}

User "1" --> "*" Order : places
@enduml`,
  usecase: `@startuml
left to right direction
actor User
actor Admin

rectangle System {
  usecase "Login" as UC1
  usecase "View Data" as UC2
  usecase "Manage Users" as UC3
}

User --> UC1
User --> UC2
Admin --> UC1
Admin --> UC2
Admin --> UC3
@enduml`
};

export function UmlDiagramEditor({ open, onOpenChange, diagram, onSave }: UmlDiagramEditorProps) {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(diagram.name);
  const [description, setDescription] = useState(diagram.description || '');
  const [content, setContent] = useState(diagram.content);
  const [diagramType, setDiagramType] = useState(diagram.diagramType);
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update state when diagram prop changes
  useEffect(() => {
    setName(diagram.name);
    setDescription(diagram.description || '');
    setContent(diagram.content);
    setDiagramType(diagram.diagramType);
  }, [diagram]);

  // Load preview on content change
  useEffect(() => {
    if (content && showPreview) {
      renderPreview();
    }
  }, [content, showPreview]);

  const renderPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use PlantUML web service to render
      const response = await api.post('/api/uml/render', {
        content,
        format: 'svg'
      });
      
      setPreview(response.data.svg);
    } catch (error) {
      console.error('Failed to render preview:', error);
      setError('Failed to render diagram. Please check your syntax.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const diagramData = {
        ...diagram,
        name,
        description,
        content,
        diagramType
      };
      
      if (diagram.id === 0) {
        // Create new diagram
        const response = await api.post(`/api/uml/folders/${diagram.folderId}/diagrams`, diagramData);
        onSave(response.data);
        toast({
          title: 'Diagram created',
          description: 'Your diagram has been saved successfully'
        });
      } else {
        // Update existing diagram
        const response = await api.put(`/api/uml/diagrams/${diagram.id}`, diagramData);
        onSave(response.data);
        toast({
          title: 'Diagram updated',
          description: 'Your changes have been saved'
        });
      }
    } catch (error) {
      console.error('Failed to save diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to save diagram',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Diagram content copied to clipboard'
    });
  };

  const handleClearAll = () => {
    setContent('');
    setPreview('');
    setError(null);
  };

  const handleInsertTemplate = (templateType: string) => {
    const template = PLANTUML_TEMPLATES[templateType as keyof typeof PLANTUML_TEMPLATES];
    if (template) {
      setContent(template);
      setDiagramType(templateType);
    }
  };

  const handleExport = async (format: 'png' | 'svg') => {
    try {
      setLoading(true);
      const response = await api.post('/api/uml/render', {
        content,
        format
      });
      
      // Create download link
      const blob = new Blob([format === 'svg' ? response.data.svg : atob(response.data.png)], {
        type: format === 'svg' ? 'image/svg+xml' : 'image/png'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Exported',
        description: `Diagram exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Failed to export diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to export diagram',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-gray-900 text-white ${isMaximized ? 'max-w-full h-screen m-0' : 'max-w-7xl h-[90vh]'}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>PlantUML Diagram Editor</DialogTitle>
              <DialogDescription>
                Create and edit PlantUML diagrams with live preview
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Editor Panel */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Diagram Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter diagram name"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Diagram Type</Label>
                <Select value={diagramType} onValueChange={setDiagramType}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGRAM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the diagram"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>PlantUML Content</Label>
              <div className="flex items-center gap-2">
                <Select onValueChange={handleInsertTemplate}>
                  <SelectTrigger className="w-40 h-8 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequence">Sequence</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="usecase">Use Case</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={handleCopyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="@startuml\n...\n@enduml"
              className="flex-1 font-mono text-sm bg-gray-800 border-gray-700 resize-none"
              style={{ minHeight: '400px' }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Diagram
                </Button>
                <Button variant="outline" onClick={() => handleExport('png')} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button variant="outline" onClick={() => handleExport('svg')} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label>Live Preview</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={renderPreview}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 overflow-auto">
                {loading && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500">{error}</p>
                    </div>
                  </div>
                )}
                
                {!loading && !error && preview && (
                  <div dangerouslySetInnerHTML={{ __html: preview }} />
                )}
                
                {!loading && !error && !preview && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Enter PlantUML code to see preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
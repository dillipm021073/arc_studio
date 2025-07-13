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
      <DialogContent className={`bg-gray-900 text-white flex flex-col ${isMaximized ? 'max-w-full h-screen m-0' : 'max-w-7xl h-[90vh]'}`}>
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle>PlantUML Diagram Editor</DialogTitle>
              <DialogDescription className="sr-only">
                Create and edit PlantUML diagrams with live preview
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        {/* Compact header with form fields */}
        <div className="shrink-0 space-y-2 pb-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Diagram name"
                className="h-8 bg-gray-800 border-gray-700 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={diagramType} onValueChange={setDiagramType}>
                <SelectTrigger className="h-8 bg-gray-800 border-gray-700 text-sm">
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
            <div>
              <Label className="text-xs">Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="h-8 bg-gray-800 border-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          {/* Editor Panel */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm">PlantUML Content</Label>
              <div className="flex items-center gap-1">
                <Select onValueChange={handleInsertTemplate}>
                  <SelectTrigger className="w-32 h-7 bg-gray-800 border-gray-700 text-xs">
                    <SelectValue placeholder="Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequence">Sequence</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="usecase">Use Case</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={handleCopyToClipboard} className="h-7 w-7 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-7 w-7 p-0">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Scrollable text editor container */}
            <div className="flex-1 min-h-0 bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="@startuml\n...\n@enduml"
                className="w-full h-full font-mono text-sm bg-transparent border-0 resize-none focus:ring-0 p-3"
                style={{ minHeight: 'max-content' }}
              />
            </div>

            {/* Static button container */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={loading} className="h-8">
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('png')} disabled={loading} className="h-8">
                  <Download className="h-3 w-3 mr-1" />
                  PNG
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('svg')} disabled={loading} className="h-8">
                  <Download className="h-3 w-3 mr-1" />
                  SVG
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPreview(!showPreview)}
                className="h-8"
              >
                {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showPreview ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Live Preview</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={renderPreview}
                  disabled={loading}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Scrollable preview container */}
              <div className="flex-1 min-h-0 bg-white rounded-lg p-3 overflow-auto">
                {loading && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                {!loading && !error && preview && (
                  <div dangerouslySetInnerHTML={{ __html: preview }} />
                )}
                
                {!loading && !error && !preview && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-sm">Enter PlantUML code to see preview</p>
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
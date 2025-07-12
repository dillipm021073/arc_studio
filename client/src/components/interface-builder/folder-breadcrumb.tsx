import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderBreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function FolderBreadcrumb({ currentPath, onNavigate }: FolderBreadcrumbProps) {
  const parts = currentPath.split('/').filter(Boolean);
  
  return (
    <div className="flex items-center gap-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => onNavigate('/')}
      >
        <Home className="h-3 w-3" />
      </Button>
      
      {parts.length > 0 && <ChevronRight className="h-3 w-3 text-gray-500" />}
      
      {parts.map((part, index) => {
        const path = '/' + parts.slice(0, index + 1).join('/');
        const isLast = index === parts.length - 1;
        
        return (
          <div key={path} className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${isLast ? 'font-medium' : ''}`}
              onClick={() => onNavigate(path)}
              disabled={isLast}
            >
              {part}
            </Button>
            {!isLast && <ChevronRight className="h-3 w-3 text-gray-500" />}
          </div>
        );
      })}
    </div>
  );
}
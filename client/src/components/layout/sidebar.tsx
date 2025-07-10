import { Link, useLocation } from "wouter";
import { 
  Home, 
  Box, 
  Plug, 
  GitBranch, 
  Network, 
  History, 
  BarChart3,
  User,
  LogOut,
  Workflow,
  FileJson,
  MessageSquare,
  Cpu,
  Palette,
  Users,
  Shield,
  Activity,
  Lock,
  CheckCircle,
  Settings,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InitiativeSwitcher } from "@/components/initiatives/initiative-switcher";
import { InitiativeIndicator } from "@/components/initiatives/initiative-indicator";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, section: "Overview" },
  { name: "Initiatives", href: "/initiatives", icon: GitBranch, section: "Version Control" },
  { name: "Applications (AML)", href: "/applications", icon: Box, section: "Management" },
  { name: "Interfaces (IML)", href: "/interfaces", icon: Plug, section: "Management" },
  { name: "Business Processes", href: "/business-processes", icon: Workflow, section: "Management" },
  { name: "Internal Activities", href: "/internal-activities", icon: CheckCircle, section: "Management" },
  { name: "Technical Processes", href: "/technical-processes", icon: Cpu, section: "Management" },
  { name: "Communications", href: "/communications", icon: MessageSquare, section: "Management" },
  { name: "Impact Analysis", href: "/impact-analysis", icon: Network, section: "Analysis" },
  { name: "Enhanced Analysis", href: "/impact-analysis-enhanced", icon: Network, section: "Analysis" },
  { name: "History View", href: "/timeline", icon: History, section: "Analysis" },
  { name: "Interface Builder", href: "/interface-builder", icon: Palette, section: "Analysis" },
  { name: "TM Forum View", href: "/tmf-domain-view", icon: Layers, section: "Analysis" },
  { name: "Reports", href: "/reports", icon: BarChart3, section: "Analysis" },
  { name: "Import/Export", href: "/import-export", icon: FileJson, section: "System" },
  { name: "User Management", href: "/users", icon: Users, section: "System" },
  { name: "Role Management", href: "/roles", icon: Shield, section: "System" },
  { name: "API Permissions", href: "/api-permissions", icon: Lock, section: "System" },
  { name: "Activity Monitor", href: "/activity-monitor", icon: Activity, section: "System" },
];

const sections = ["Overview", "Version Control", "Management", "Analysis", "System"];

interface SidebarProps {
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
}

export default function Sidebar({ isMinimized, setIsMinimized }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getSectionItems = (section: string) => {
    return navigation.filter(item => item.section === section);
  };

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location === href) return true;
    return false;
  };

  return (
    <aside className={`${isMinimized ? 'w-16' : 'w-64'} bg-gray-800 shadow-sm border-r border-gray-700 flex flex-col transition-all duration-300`}>
      <div className={`${isMinimized ? 'p-3' : 'p-6'} border-b border-gray-700 relative`}>
        {isMinimized ? (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">AS</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">AS</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Architect Studio</h1>
              <p className="text-xs text-gray-400">Interface Management</p>
            </div>
          </div>
        )}
        
        {/* Toggle button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsMinimized(!isMinimized)}
          className={`absolute ${isMinimized ? 'right-1' : 'right-2'} top-2 hover:bg-gray-700 p-1`}
          title={isMinimized ? "Expand sidebar (Ctrl+B)" : "Minimize sidebar (Ctrl+B)"}
        >
          {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Initiative Switcher */}
      <div className={`${isMinimized ? 'px-2' : 'px-4'} pb-2`}>
        {isMinimized ? (
          <InitiativeIndicator showDetails={false} className="w-full" />
        ) : (
          <InitiativeSwitcher />
        )}
      </div>
      
      <nav className={`flex-1 ${isMinimized ? 'p-2' : 'p-4'} space-y-2`}>
        {sections.map((section) => {
          const items = getSectionItems(section);
          if (items.length === 0) return null;
          
          return (
            <div key={section} className={isMinimized ? 'mb-2' : 'mb-6'}>
              {!isMinimized && (
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {section}
                </h3>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const linkContent = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''} ${
                      isMinimized ? 'justify-center px-2' : ''
                    }`}
                  >
                    <Icon size={isMinimized ? 20 : 16} className={isMinimized ? '' : 'mr-3'} />
                    {!isMinimized && item.name}
                  </Link>
                );

                return isMinimized ? (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-700 text-white border-gray-600">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  linkContent
                );
              })}
            </div>
          );
        })}
      </nav>
      
      <div className={`${isMinimized ? 'p-2' : 'p-4'} border-t border-gray-700 space-y-3`}>
        {!isMinimized && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="text-gray-300" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'User'}</p>
            </div>
          </div>
        )}
        
        {isMinimized ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center bg-gray-700 text-white border-gray-600 hover:bg-gray-600 p-2"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-700 text-white border-gray-600">
                Settings
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-center bg-gray-700 text-white border-gray-600 hover:bg-gray-600 p-2" 
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-700 text-white border-gray-600">
                Logout
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Link href="/settings">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-gray-700 text-white border-gray-600 hover:bg-gray-600 mb-2"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-gray-700 text-white border-gray-600 hover:bg-gray-600" 
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}

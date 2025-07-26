import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  User, 
  Users, 
  FileJson,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HierarchyDesign {
  id: number;
  name: string;
  createdBy: string;
  isTemplate: boolean;
}

interface HierarchyFolderTreeProps {
  userFolders: Map<string, HierarchyDesign[]>;
  currentUsername: string;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

export default function HierarchyFolderTree({
  userFolders,
  currentUsername,
  selectedFolder,
  onSelectFolder,
}: HierarchyFolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["my-designs", "other-users"])
  );

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  // Get other users (excluding current user and templates)
  const otherUsers = Array.from(userFolders.keys()).filter(
    (username) => username !== currentUsername && username !== "templates"
  );

  const myDesignsCount = userFolders.get(currentUsername)?.length || 0;
  const templatesCount = userFolders.get("templates")?.length || 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase">Folders</h3>
        
        {/* My Designs */}
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700",
            selectedFolder === "my-designs" && "bg-gray-700"
          )}
          onClick={() => onSelectFolder("my-designs")}
        >
          <User className="h-4 w-4 text-blue-400" />
          <span className="flex-1 text-sm">My Designs</span>
          <span className="text-xs text-gray-400">{myDesignsCount}</span>
        </div>

        {/* Templates */}
        {templatesCount > 0 && (
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700",
              selectedFolder === "templates" && "bg-gray-700"
            )}
            onClick={() => onSelectFolder("templates")}
          >
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="flex-1 text-sm">Templates</span>
            <span className="text-xs text-gray-400">{templatesCount}</span>
          </div>
        )}

        {/* Other Users */}
        {otherUsers.length > 0 && (
          <>
            <div
              className="flex items-center gap-1 p-2 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => toggleFolder("other-users")}
            >
              <button className="p-0.5 hover:bg-gray-600 rounded">
                {expandedFolders.has("other-users") ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              <Users className="h-4 w-4 text-green-400" />
              <span className="flex-1 text-sm">Other Users</span>
              <span className="text-xs text-gray-400">{otherUsers.length}</span>
            </div>

            {expandedFolders.has("other-users") && (
              <div className="ml-4">
                {otherUsers.map((username) => {
                  const userDesignsCount = userFolders.get(username)?.length || 0;
                  const folderId = `user-${username}`;
                  
                  return (
                    <div
                      key={username}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700",
                        selectedFolder === folderId && "bg-gray-700"
                      )}
                      onClick={() => onSelectFolder(folderId)}
                    >
                      {selectedFolder === folderId ? (
                        <FolderOpen className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Folder className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="flex-1 text-sm">{username}</span>
                      <span className="text-xs text-gray-400">{userDesignsCount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* All Designs */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700",
              selectedFolder === "all" && "bg-gray-700"
            )}
            onClick={() => onSelectFolder("all")}
          >
            <FileJson className="h-4 w-4 text-purple-400" />
            <span className="flex-1 text-sm">All Designs</span>
            <span className="text-xs text-gray-400">
              {Array.from(userFolders.values()).reduce((acc, designs) => acc + designs.length, 0)}
            </span>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
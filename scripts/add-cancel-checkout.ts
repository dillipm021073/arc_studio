import fs from 'fs';
import path from 'path';

const artifactFiles = [
  {
    path: '/mnt/c/new_portfolio/StudioArchitect/client/src/pages/business-processes.tsx',
    artifactType: 'business_process',
    mutationName: 'bp',
    nameField: 'businessProcess'
  },
  {
    path: '/mnt/c/new_portfolio/StudioArchitect/client/src/pages/internal-activities.tsx',
    artifactType: 'internal_process',
    mutationName: 'activity',
    nameField: 'activityName'
  },
  {
    path: '/mnt/c/new_portfolio/StudioArchitect/client/src/pages/technical-processes.tsx',
    artifactType: 'technical_process',
    mutationName: 'process',
    nameField: 'name'
  }
];

function addCancelCheckoutToFile(fileConfig: typeof artifactFiles[0]) {
  const { path: filePath, artifactType, mutationName, nameField } = fileConfig;
  
  console.log(`\n🔄 Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add X import to lucide-react imports
  if (!content.includes(', X')) {
    content = content.replace(
      /} from "lucide-react";/,
      ', X} from "lucide-react";'
    );
    console.log('✅ Added X import');
  }
  
  // 2. Add cancel checkout mutation after checkin mutation
  const cancelCheckoutMutation = `
  const cancelCheckoutMutation = useMutation({
    mutationFn: async (${mutationName}: any) => {
      const response = await api.post('/api/version-control/cancel-checkout', {
        artifactType: '${artifactType}',
        artifactId: ${mutationName}.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, ${mutationName}) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/${artifactType.replace('_', '-')}s'] });
      toast({
        title: "Checkout cancelled",
        description: \`\${${mutationName}.${nameField}} checkout has been cancelled and changes discarded\`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancel checkout failed",
        description: error.response?.data?.error || "Failed to cancel checkout",
        variant: "destructive"
      });
    }
  });
`;

  // Find where to insert the cancel checkout mutation (after checkin mutation)
  const checkinMutationEnd = content.indexOf('});', content.indexOf('const checkinMutation'));
  if (checkinMutationEnd !== -1 && !content.includes('cancelCheckoutMutation')) {
    const insertPosition = checkinMutationEnd + 3; // After '});'
    content = content.slice(0, insertPosition) + cancelCheckoutMutation + content.slice(insertPosition);
    console.log('✅ Added cancel checkout mutation');
  }
  
  // 3. Add cancel checkout context menu item
  const cancelCheckoutMenuItem = `                                  <ContextMenuItem 
                                    onClick={() => cancelCheckoutMutation.mutate(${mutationName})}
                                    disabled={cancelCheckoutMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Checkout
                                  </ContextMenuItem>`;

  // Find the checkin context menu item and add cancel checkout after it
  const checkinMenuPattern = /<ContextMenuItem[^>]*>\s*<Unlock className="mr-2 h-4 w-4" \/>\s*Checkin\s*<\/ContextMenuItem>/;
  const match = content.match(checkinMenuPattern);
  
  if (match && !content.includes('Cancel Checkout')) {
    const endOfCheckinItem = content.indexOf('</ContextMenuItem>', match.index!) + '</ContextMenuItem>'.length;
    content = content.slice(0, endOfCheckinItem) + '\n' + cancelCheckoutMenuItem + content.slice(endOfCheckinItem);
    console.log('✅ Added cancel checkout context menu item');
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated ${filePath}`);
}

function main() {
  console.log('🚀 Adding cancel checkout functionality to all artifact types...\n');
  
  for (const fileConfig of artifactFiles) {
    try {
      addCancelCheckoutToFile(fileConfig);
    } catch (error) {
      console.error(`❌ Error processing ${fileConfig.path}:`, error);
    }
  }
  
  console.log('\n🎉 Cancel checkout functionality added to all artifact types!');
}

main();
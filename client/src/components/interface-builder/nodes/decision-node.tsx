import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { GitBranch, HelpCircle } from 'lucide-react';

interface DecisionNodeData {
  id: string;
  name: string;
  description?: string;
  decisionType: string;
  evaluationLogic?: string;
  possibleOutcomes?: string[];
  color?: string;
}

export default memo(function DecisionNode({ 
  data, 
  selected 
}: NodeProps<DecisionNodeData>) {
  
  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'data_check': return 'border-blue-500 bg-blue-500/10';
      case 'business_rule': return 'border-purple-500 bg-purple-500/10';
      case 'technical_check': return 'border-orange-500 bg-orange-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getDecisionTypeLabel = (type: string) => {
    switch (type) {
      case 'data_check': return 'Data Check';
      case 'business_rule': return 'Business Rule';
      case 'technical_check': return 'Technical Check';
      default: return type;
    }
  };

  const outcomes = data.possibleOutcomes || ['yes', 'no'];

  return (
    <div 
      className={`
        relative transition-all duration-200
        ${selected ? 'scale-110' : ''}
      `}
    >
      {/* Diamond shape container with rounded corners */}
      <div 
        className={`
          w-32 h-32 transform rotate-45
          border-2 rounded-2xl shadow-lg
          ${getDecisionTypeColor(data.decisionType)}
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}
        `}
      >
        {/* Inner content (rotated back) */}
        <div className="absolute inset-0 transform -rotate-45 flex items-center justify-center">
          <div className="text-center px-4">
            <GitBranch className="h-6 w-6 text-white mx-auto mb-1" />
            <h3 className="text-xs font-semibold text-white truncate max-w-[100px]" title={data.name}>
              {data.name}
            </h3>
          </div>
        </div>
      </div>

      {/* Decision type badge */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <Badge variant="outline" className="text-xs border-gray-600 bg-gray-800 text-gray-300">
          {getDecisionTypeLabel(data.decisionType)}
        </Badge>
      </div>

      {/* Evaluation logic tooltip */}
      {data.evaluationLogic && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 group">
          <HelpCircle className="h-4 w-4 text-gray-400" />
          <div className="hidden group-hover:block absolute bottom-6 left-1/2 transform -translate-x-1/2 w-48 p-2 bg-gray-900 rounded text-xs text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
            {data.evaluationLogic}
          </div>
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-gray-400 bg-gray-800"
        style={{ 
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />

      {/* Output Handles for each outcome */}
      {outcomes.map((outcome, index) => {
        const angle = (index / outcomes.length) * 180 - 90; // Distribute on right side
        const radius = 50;
        const x = Math.cos(angle * Math.PI / 180) * radius + 64; // 64 is center
        const y = Math.sin(angle * Math.PI / 180) * radius + 64;
        
        return (
          <div key={outcome}>
            <Handle
              type="source"
              position={Position.Right}
              id={outcome}
              className="w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-500 hover:bg-blue-400 transition-colors"
              style={{ 
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />
            {/* Outcome label */}
            <div 
              className="absolute text-xs text-gray-400 font-medium"
              style={{
                left: `${x + 20}px`,
                top: `${y}px`,
                transform: 'translateY(-50%)'
              }}
            >
              {outcome}
            </div>
          </div>
        );
      })}

      {/* Description tooltip */}
      {data.description && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded max-w-xs">
            <p className="line-clamp-2">{data.description}</p>
          </div>
        </div>
      )}
    </div>
  );
});
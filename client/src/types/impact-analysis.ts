export interface CrossCRImpact {
  commonApplications: Array<{
    application: {
      id: number;
      name: string;
      description: string;
      status: string;
    };
    affectedByCRs: string[];
    conflictType?: 'modification' | 'deletion' | 'status_change';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  commonInterfaces: Array<{
    interface: {
      id: number;
      imlNumber: string;
      businessProcessName: string;
      interfaceType: string;
      status: string;
      providerApplicationName: string;
      consumerApplicationName: string;
    };
    affectedByCRs: string[];
    conflictType?: 'modification' | 'version_change' | 'deletion';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  commonBusinessProcesses: Array<{
    businessProcess: {
      id: number;
      businessProcess: string;
      lob: string;
      product: string;
      level: string;
    };
    affectedByCRs: string[];
    conflictType?: 'modification' | 'sequence_change' | 'deletion';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  overallRiskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    conflicts: string[];
    recommendations: string[];
  };
  timeline: Array<{
    crNumber: string;
    targetDate: Date | null;
    conflicts: string[];
  }>;
}
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileTypeFromBuffer } from 'file-type';

interface ExtractedCapability {
  capabilityName: string;
  capabilityType: 'interface' | 'api' | 'service' | 'function' | 'integration' | 'other';
  area: string;
  description: string;
  interfaceType?: 'REST' | 'SOAP' | 'GraphQL' | 'gRPC' | 'WebSocket' | 'MQ' | 'FTP' | 'Other';
  protocol?: string;
  dataFormat?: string;
  endpoint?: string;
  method?: string;
  authType?: string;
  requestFormat?: string;
  responseFormat?: string;
  version?: string;
}

export class GeminiExtractorService {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractCapabilitiesFromPDF(filePath: string): Promise<ExtractedCapability[]> {
    try {
      // Read the file
      const fileData = await fs.readFile(filePath);
      const fileType = await fileTypeFromBuffer(fileData);
      
      if (!fileType || fileType.mime !== 'application/pdf') {
        throw new Error('File is not a PDF');
      }

      // Convert file to base64
      const base64Data = fileData.toString('base64');
      
      // Use Gemini 2.0 Flash model
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp'
      });

      const prompt = `You are an expert at analyzing technical documentation to extract software capabilities, interfaces, and APIs.

Analyze this PDF document and extract ALL capabilities, interfaces, APIs, and services mentioned. For each capability found, provide:

1. capabilityName: The name of the capability/interface/API
2. capabilityType: One of: interface, api, service, function, integration, other
3. area: The functional area (e.g., Authentication, Data Management, Reporting, etc.)
4. description: A clear description of what this capability does
5. interfaceType (if applicable): REST, SOAP, GraphQL, gRPC, WebSocket, MQ, FTP, or Other
6. protocol (if mentioned): HTTP, HTTPS, TCP, etc.
7. dataFormat (if mentioned): JSON, XML, CSV, etc.
8. endpoint (if provided): The URL or endpoint path
9. method (if applicable): GET, POST, PUT, DELETE, etc.
10. authType (if mentioned): OAuth, API Key, Basic, etc.
11. requestFormat (if provided): Structure or example of requests
12. responseFormat (if provided): Structure or example of responses
13. version (if mentioned): Version number

Return the results as a JSON array of objects with these properties. Be thorough and extract ALL capabilities mentioned in the document.

Important: Focus on extracting actual technical capabilities, not general features or business benefits.`;

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        },
        prompt
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      try {
        // Extract JSON from the response (handle markdown code blocks)
        let jsonText = text.trim();
        
        // Check if the response is wrapped in markdown code blocks
        const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonText = codeBlockMatch[1].trim();
        }
        
        const capabilities = JSON.parse(jsonText);
        
        // Validate and clean the extracted capabilities
        return capabilities.map((cap: any) => ({
          capabilityName: cap.capabilityName || 'Unknown',
          capabilityType: this.validateCapabilityType(cap.capabilityType),
          area: cap.area || 'General',
          description: cap.description || '',
          interfaceType: this.validateInterfaceType(cap.interfaceType),
          protocol: cap.protocol || undefined,
          dataFormat: cap.dataFormat || undefined,
          endpoint: cap.endpoint || undefined,
          method: cap.method || undefined,
          authType: cap.authType || undefined,
          requestFormat: cap.requestFormat || undefined,
          responseFormat: cap.responseFormat || undefined,
          version: cap.version || undefined,
        }));
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.error('Raw response:', text);
        throw new Error('Failed to parse capabilities from Gemini response');
      }
    } catch (error) {
      console.error('Error extracting capabilities with Gemini:', error);
      throw error;
    }
  }

  private validateCapabilityType(type: string): ExtractedCapability['capabilityType'] {
    const validTypes: ExtractedCapability['capabilityType'][] = ['interface', 'api', 'service', 'function', 'integration', 'other'];
    const lowerType = (type || '').toLowerCase() as ExtractedCapability['capabilityType'];
    return validTypes.includes(lowerType) ? lowerType : 'other';
  }

  private validateInterfaceType(type: string): ExtractedCapability['interfaceType'] | undefined {
    if (!type) return undefined;
    const validTypes: ExtractedCapability['interfaceType'][] = ['REST', 'SOAP', 'GraphQL', 'gRPC', 'WebSocket', 'MQ', 'FTP', 'Other'];
    const upperType = type.toUpperCase() as ExtractedCapability['interfaceType'];
    return validTypes.includes(upperType) ? upperType : 'Other';
  }
}
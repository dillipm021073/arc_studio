import https from 'https';
import { db } from '../db';
import { applications, applicationCapabilities, capabilityExtractionHistory } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse-new';

// Configuration
const API_BASE_URL = 'https://promptui.autox.corp.amdocs.azr';
const API_KEY = process.env.AUTOX_API_KEY || '';
const USERNAME = process.env.AUTOX_USERNAME || '';

// Create HTTPS agent that ignores certificate errors (for testing)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface ExtractedCapability {
  name: string;
  type?: string;
  area?: string;
  module?: string;
  webMethod?: string;
  methodName?: string;
  outputName?: string;
  output?: string;
  protocol?: string;
  direction?: string;
  dataFormat?: string;
  authentication?: string;
  thirdPartyService?: string;
  endpoints?: string[];
  endpoint?: string;
  interfaceType?: string;
  description?: string;
}

interface ExtractionResult {
  capabilities: ExtractedCapability[];
  totalCount: number;
  modules?: Record<string, any>;
  rawResult?: string;
}

export class CapabilityExtractorService {
  /**
   * Standardize capabilities using AutoX to ensure consistent format
   */
  private async standardizeCapabilities(
    capabilities: any[],
    credentials?: { apiKey: string; username: string }
  ): Promise<ExtractedCapability[]> {
    if (!capabilities || capabilities.length === 0) return [];
    
    // If we have too many capabilities, skip standardization to avoid timeout
    if (capabilities.length > 150) {
      return capabilities;
    }
    
    const prompt = `Please standardize the following capabilities into a consistent format.

Input capabilities:
${JSON.stringify(capabilities, null, 2)}

For EACH capability, extract and return in this exact JSON format:
[
  {
    "name": "<capability name or method name>",
    "type": "<interface|api|web-service|function|data-format>",
    "area": "<functional area or module>",
    "description": "<what this capability does>",
    "interfaceType": "<SOAP|REST|GraphQL|File|Database|etc>",
    "protocol": "<HTTP|HTTPS|FTP|TCP|etc>",
    "dataFormat": "<JSON|XML|CSV|Binary|etc>",
    "endpoint": "<endpoint URL or method name>",
    "sampleRequest": "<example request if available>",
    "sampleResponse": "<example response or output name if available>"
  }
]

IMPORTANT:
- Use "name" for the capability/method name (not webMethod)
- Ensure all fields are present (use null if not available)
- Maintain the original information but in standardized format
- If interfaceType is not specified, infer from context
- Return ONLY the JSON array, no explanations`;
    
    const apiKey = credentials?.apiKey || API_KEY;
    const username = credentials?.username || USERNAME;
    
    const requestData = {
      username,
      apikey: apiKey,
      conv_id: '',
      application: 'ait-capability-standardizer',
      messages: [{ user: prompt }],
      promptfilename: '',
      promptname: '',
      prompttype: 'system',
      promptrole: 'You are a data standardization expert that converts various capability formats into a consistent schema.',
      prompttask: 'Standardize the capability data into the required format',
      promptexamples: '',
      promptformat: 'Return only valid JSON array in the specified format',
      promptrestrictions: 'Do not add explanations, return only JSON',
      promptadditional: 'Preserve all original information while standardizing the format',
      max_tokens: 8000,
      model_type: 'GPT4o_128K',
      temperature: 0.1,
      topKChunks: 5,
      read_from_your_data: false,
      data_filenames: [],
      document_groupname: '',
      document_grouptags: [],
      find_the_best_response: false,
      chat_attr: {},
      additional_attr: {}
    };

    return new Promise((resolve) => {
      const data = JSON.stringify(requestData);
      
      const options = {
        hostname: 'chat.autox.corp.amdocs.azr',
        path: '/api/v1/chats/send-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        agent: httpsAgent
      };

      const req = https.request(options, async (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', async () => {
          try {
            const response = JSON.parse(responseData);
            if (response.task_id) {
              // Wait for completion
              const standardResult = await this.waitForCompletion(response.task_id, 120, 2000);
              
              if (standardResult.result) {
                let standardizedJson = standardResult.result;
                if (standardizedJson.startsWith('```json')) {
                  standardizedJson = standardizedJson.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
                }
                try {
                  const parsed = JSON.parse(standardizedJson);
                  resolve(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                  console.error('Failed to parse standardized JSON:', e);
                  resolve([]);
                }
              } else {
                resolve([]);
              }
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error('Failed to parse AutoX standardization response:', error);
            resolve([]);
          }
        });
      });

      req.on('error', (error) => {
        console.error('AutoX standardization request error:', error);
        resolve([]);
      });

      req.write(data);
      req.end();
    });
  }
  /**
   * Read and extract text content from a file
   */
  private async extractFileContent(filePath: string, fileType: string): Promise<string> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      console.log(`Reading file from: ${fullPath}`);
      
      if (fileType.toLowerCase() === 'pdf') {
        const dataBuffer = await fs.readFile(fullPath);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if (fileType.toLowerCase() === 'text' || fileType.toLowerCase() === 'txt') {
        return await fs.readFile(fullPath, 'utf-8');
      } else if (fileType.toLowerCase() === 'word' || fileType.toLowerCase() === 'docx') {
        // For now, return a message that Word files need special handling
        return 'Word document - content extraction not yet implemented';
      } else {
        // For other file types, try to read as text
        return await fs.readFile(fullPath, 'utf-8');
      }
    } catch (error) {
      console.error('Error reading file content:', error);
      throw new Error(`Failed to read file content: ${error.message}`);
    }
  }

  /**
   * Send document for analysis to AutoX API
   */
  private async sendAnalysisRequest(
    filename: string,
    fileType: string,
    fileContent: string,
    applicationName?: string,
    credentials?: { apiKey: string; username: string },
    chunkIndex?: number,
    totalChunks?: number
  ): Promise<string> {
    const prompt = this.buildPrompt(filename, fileType, fileContent, applicationName, chunkIndex, totalChunks);
    
    // Use provided credentials or fall back to environment variables
    const apiKey = credentials?.apiKey || API_KEY;
    const username = credentials?.username || USERNAME;
    
    const requestData = {
      username,
      apikey: apiKey,
      conv_id: '',
      application: 'ait-capability-extraction',
      messages: [{ user: prompt }],
      promptfilename: '',
      promptname: '',
      prompttype: 'system',
      promptrole: 'You are an expert system analyst specializing in extracting application capabilities and interfaces from technical documents.',
      prompttask: 'Extract all capabilities, interfaces, and integration points from the document',
      promptexamples: '',
      promptformat: 'Return structured JSON with all capabilities found',
      promptrestrictions: 'Extract only information explicitly mentioned in the document',
      promptadditional: 'Be exhaustive and thorough. Include every capability, no matter how small.',
      max_tokens: 16000,  // Increased to handle more capabilities
      model_type: 'GPT4o_128K',
      temperature: 0.1,
      topKChunks: 15,
      read_from_your_data: false,
      data_filenames: [],
      document_groupname: '',
      document_grouptags: [],
      find_the_best_response: false,
      chat_attr: {},
      additional_attr: {}
    };

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(requestData);
      
      const options = {
        hostname: 'chat.autox.corp.amdocs.azr',
        path: '/api/v1/chats/send-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        agent: httpsAgent
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (response.task_id) {
              resolve(response.task_id);
            } else {
              reject(new Error(response.detail || response.error || 'No task_id in response'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Check status of analysis task
   */
  private async checkTaskStatus(taskId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'chat.autox.corp.amdocs.azr',
        path: `/api/v1/chats/status/${taskId}`,
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        agent: httpsAgent
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse status response: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Wait for task completion with polling
   */
  private async waitForCompletion(
    taskId: string,
    maxAttempts = 60,
    delayMs = 2000
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkTaskStatus(taskId);
      
      if (status.status === 'Complete' || status.status === 'complete') {
        return status;
      } else if (status.status === 'Failed' || status.status === 'failed') {
        throw new Error(`Task failed: ${status.result || 'Unknown error'}`);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error(`Task did not complete after ${maxAttempts} attempts`);
  }

  /**
   * Build extraction prompt based on file type
   */
  private buildPrompt(filename: string, fileType: string, fileContent: string, applicationName?: string, chunkIndex?: number, totalChunks?: number): string {
    const appContext = applicationName 
      ? `for the application "${applicationName}"` 
      : '';

    const chunkInfo = chunkIndex !== undefined && totalChunks !== undefined
      ? `\n\nNOTE: This is chunk ${chunkIndex + 1} of ${totalChunks} from the document.`
      : '';

    // Check if this is a Clarity document
    const isClarityDoc = filename.toLowerCase().includes('clarity');
    
    if (isClarityDoc) {
      return `Analyze the following Clarity System Connect Web Services Guide content and extract all web service methods.${chunkInfo}

DOCUMENT CONTENT:
${fileContent}

EXTRACTION REQUIREMENTS:
For EACH web service method found in the above content, extract:
1. area - The functional area/module (e.g., "Corporate Manager - Customer Management")
2. webMethod - The exact method name (e.g., "createCustomer")
3. outputName - The output result name (e.g., "createCustomerResult") 
4. description - What the method does
5. interfaceType - SOAP or REST

Look for patterns like:
- Method definitions
- Operation names
- Service endpoints
- WSDL operations
- API documentation sections

Return a JSON array where each element has: {area, webMethod, outputName, description, interfaceType}`;
    }

    const basePrompt = `Analyze the following document content and extract all technical capabilities ${appContext}.${chunkInfo}

DOCUMENT CONTENT:
${fileContent}
${fileContent.length > 100000 ? '\n[Content truncated...]' : ''}

Extract:
1. All APIs and web services
2. File interfaces and data formats
3. Integration points and protocols
4. Public methods and functions
5. Directory structures and paths
6. Configuration parameters
7. System interfaces

Return a JSON array of capabilities with properties like: name, type, description, protocol, etc.
`;

    const fileTypePrompts: Record<string, string> = {
      pdf: 'This is a PDF document. Extract all technical capabilities mentioned.',
      text: 'This is a text file. Extract all technical capabilities and interfaces.',
      word: 'This is a Word document. Extract all API specifications and capabilities.',
      image: 'This is an image/diagram. Identify all systems, connections, and integration points shown.',
      excel: 'This is an Excel file. Extract any API specifications, data models, or capability lists.'
    };

    const typePrompt = fileTypePrompts[fileType.toLowerCase()] || 'Extract all technical capabilities from this document.';

    return basePrompt + typePrompt + '\n\nBe exhaustive and extract every single capability mentioned.';
  }

  /**
   * Fix truncated or malformed JSON using AutoX
   */
  private async fixTruncatedJson(truncatedJson: string, credentials?: { apiKey: string; username: string }): Promise<any[]> {
    const prompt = `The following JSON array was truncated. Please complete or fix it to make it valid JSON. Return ONLY the valid JSON array, no explanations:

${truncatedJson}

Return a valid JSON array of capabilities.`;
    
    const apiKey = credentials?.apiKey || API_KEY;
    const username = credentials?.username || USERNAME;
    
    const requestData = {
      username,
      apikey: apiKey,
      conv_id: '',
      application: 'ait-json-fixer',
      messages: [{ user: prompt }],
      promptfilename: '',
      promptname: '',
      prompttype: 'system',
      promptrole: 'You are a JSON parser that fixes truncated or malformed JSON.',
      prompttask: 'Fix the truncated JSON and return valid JSON',
      promptexamples: '',
      promptformat: 'Return only valid JSON array',
      promptrestrictions: 'Do not add explanations, return only JSON',
      promptadditional: '',
      max_tokens: 8000,
      model_type: 'GPT4o_128K',
      temperature: 0.0,
      topKChunks: 5,
      read_from_your_data: false,
      data_filenames: [],
      document_groupname: '',
      document_grouptags: [],
      find_the_best_response: false,
      chat_attr: {},
      additional_attr: {}
    };

    return new Promise((resolve) => {
      const data = JSON.stringify(requestData);
      
      const options = {
        hostname: 'chat.autox.corp.amdocs.azr',
        path: '/api/v1/chats/send-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        agent: httpsAgent
      };

      const req = https.request(options, async (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', async () => {
          try {
            const response = JSON.parse(responseData);
            if (response.task_id) {
              // Wait for completion
              const fixResult = await this.waitForCompletion(response.task_id, 60, 2000); // Wait up to 2 minutes for JSON fix
              
              if (fixResult.result) {
                let fixedJson = fixResult.result;
                if (fixedJson.startsWith('```json')) {
                  fixedJson = fixedJson.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
                }
                try {
                  const parsed = JSON.parse(fixedJson);
                  resolve(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                  console.error('Failed to parse fixed JSON:', e);
                  resolve([]);
                }
              } else {
                resolve([]);
              }
            } else {
              console.error('No task_id in response:', response);
              resolve([]);
            }
          } catch (error) {
            console.error('Failed to parse AutoX response:', error);
            resolve([]);
          }
        });
      });

      req.on('error', (error) => {
        console.error('AutoX request error:', error);
        resolve([]);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Parse extraction result into structured format
   */
  private async parseExtractionResult(result: string, credentials?: { apiKey: string; username: string }): Promise<ExtractionResult> {
    try {
      // Handle potential double-encoding
      let parsedResult = result;
      if (parsedResult.startsWith('"') && parsedResult.endsWith('"')) {
        parsedResult = JSON.parse(parsedResult);
      }
      
      // Handle markdown code blocks
      if (typeof parsedResult === 'string') {
        // Remove ```json and ``` markers if present
        parsedResult = parsedResult.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        
        // Handle truncated JSON
        if (!parsedResult.trim().endsWith(']')) {
          console.log('JSON appears to be truncated, attempting to fix...');
          
          // Strategy: Find all complete objects before truncation
          // Look for pattern: }, (with optional whitespace)
          const objects = [];
          let lastValidEndIndex = 0;
          
          // Find all complete objects by looking for }, patterns
          const regex = /\},/g;
          let match;
          while ((match = regex.exec(parsedResult)) !== null) {
            lastValidEndIndex = match.index + 1; // Include the }
          }
          
          // Also check if the last object is complete (ends with })
          const lastBraceIndex = parsedResult.lastIndexOf('}');
          if (lastBraceIndex > lastValidEndIndex) {
            // Check if this } is part of a complete object
            const afterBrace = parsedResult.substring(lastBraceIndex + 1).trim();
            if (!afterBrace || afterBrace.startsWith(',') || afterBrace.startsWith(']')) {
              lastValidEndIndex = lastBraceIndex + 1;
            }
          }
          
          if (lastValidEndIndex > 0) {
            // Take all content up to the last valid object
            parsedResult = parsedResult.substring(0, lastValidEndIndex);
            // Remove any trailing comma and close the array
            parsedResult = parsedResult.replace(/,\s*$/, '') + ']';
            // JSON truncation fixed
          }
        }
        
        // Clean up common JSON issues
        // Remove trailing commas before closing brackets/braces
        parsedResult = parsedResult.replace(/,\s*([}\]])/g, '$1');
        
        // If it still doesn't end with ], add it
        if (!parsedResult.trim().endsWith(']') && parsedResult.trim().startsWith('[')) {
          parsedResult = parsedResult.trim() + ']';
        }
      }
      
      let data;
      try {
          data = typeof parsedResult === 'string' ? JSON.parse(parsedResult) : parsedResult;
      } catch (parseError) {
        // If JSON parsing fails, try to fix it with AutoX
        if (credentials) {
          try {
            const fixedCapabilities = await this.fixTruncatedJson(parsedResult, credentials);
            if (fixedCapabilities && fixedCapabilities.length > 0) {
              data = { capabilities: fixedCapabilities };
            } else {
              // If AutoX couldn't fix it, try manual recovery
              const capMatch = parsedResult.match(/\[[\s\S]*\]/);
              if (capMatch) {
                try {
                  data = { capabilities: JSON.parse(capMatch[0]) };
                } catch (e) {
                  return {
                    capabilities: [],
                    totalCount: 0,
                    rawResult: result
                  };
                }
              } else {
                return {
                  capabilities: [],
                  totalCount: 0,
                  rawResult: result
                };
              }
            }
          } catch (fixError) {
            console.error('Failed to fix JSON with AutoX:', fixError);
            return {
              capabilities: [],
              totalCount: 0,
              rawResult: result
            };
          }
        } else {
          // No credentials to use AutoX for fixing
          return {
            capabilities: [],
            totalCount: 0,
            rawResult: result
          };
        }
      }
      
      // Extract capabilities from various possible formats
      let capabilities: ExtractedCapability[] = [];
      
      if (Array.isArray(data)) {
        capabilities = data;
      } else if (Array.isArray(data.capabilities)) {
        capabilities = data.capabilities;
      } else if (data.modules) {
        // Handle module-based format
        for (const [moduleName, moduleData] of Object.entries(data.modules)) {
          if (moduleData && typeof moduleData === 'object') {
            const moduleCapabilities = this.extractCapabilitiesFromModule(moduleName, moduleData);
            capabilities.push(...moduleCapabilities);
          }
        }
      } else {
        // Try to extract from any object structure
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            capabilities.push(...value.map((item: any) => ({
              ...item,
              module: key
            })));
          }
        }
      }

      // Standardize capabilities if we have credentials and capabilities
      if (credentials && capabilities.length > 0) {
        try {
          const standardized = await this.standardizeCapabilities(capabilities, credentials);
          if (standardized.length > 0) {
            return {
              capabilities: standardized,
              totalCount: standardized.length,
              modules: data.modules || data,
              rawResult: result
            };
          }
        } catch (error) {
          console.error('Standardization failed, using raw capabilities:', error);
        }
      }
      
      return {
        capabilities,
        totalCount: capabilities.length,
        modules: data.modules || data,
        rawResult: result
      };
    } catch (error) {
      console.error('Failed to parse extraction result:', error);
      return {
        capabilities: [],
        totalCount: 0,
        rawResult: result
      };
    }
  }

  /**
   * Extract capabilities from module data
   */
  private extractCapabilitiesFromModule(
    moduleName: string,
    moduleData: any
  ): ExtractedCapability[] {
    const capabilities: ExtractedCapability[] = [];

    // Handle different module data structures
    if (moduleData.services || moduleData.WebServices) {
      const services = moduleData.services || moduleData.WebServices || [];
      for (const service of services) {
        capabilities.push({
          name: service.ServiceName || service.name,
          type: service.Type || 'Web Service',
          protocol: service.protocol || 'HTTPS',
          description: `${moduleName} - ${service.description || ''}`,
          endpoints: service.Operations?.map((op: any) => op.MethodName) || []
        });
      }
    }

    if (moduleData.operations) {
      for (const operation of moduleData.operations) {
        capabilities.push({
          name: operation.name,
          type: operation.type || 'API Operation',
          protocol: operation.protocol,
          dataFormat: operation.dataFormat,
          description: `${moduleName} - ${operation.description || ''}`
        });
      }
    }

    return capabilities;
  }

  /**
   * Extract capabilities from a document
   */
  async extractCapabilities(
    filename: string,
    fileType: string,
    applicationId?: number,
    userId?: number,
    credentials?: { apiKey: string; username: string }
  ): Promise<ExtractionResult> {
    try {
      // Get application name if ID provided
      let applicationName: string | undefined;
      if (applicationId) {
        const app = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
        applicationName = app[0]?.name;
      }

      // First, try to find the file in various locations
      let filePath = '';
      let fileContent = '';
      
      // Try different possible locations
      const possiblePaths = [
        path.join(process.cwd(), 'uploads', 'capabilities', filename),
        path.join(process.cwd(), 'uploads', 'temp', filename),
        path.join(process.cwd(), 'uploads', filename),
        filename // In case it's already an absolute path
      ];
      
      for (const tryPath of possiblePaths) {
        try {
          await fs.access(tryPath);
          filePath = tryPath;
          break;
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!filePath) {
        throw new Error(`File not found: ${filename}`);
      }
      
      // Read file content
      fileContent = await this.extractFileContent(filePath, fileType);
      
      // Process in chunks if content is large
      const CHUNK_SIZE = 80000; // 80k chars per chunk to leave room for prompt
      const chunks: string[] = [];
      
      if (fileContent.length > CHUNK_SIZE) {
        // Split content into chunks
        for (let i = 0; i < fileContent.length; i += CHUNK_SIZE) {
          chunks.push(fileContent.substring(i, i + CHUNK_SIZE));
        }
        // Document will be processed in chunks
      } else {
        chunks.push(fileContent);
      }
      
      // Record extraction start
      const [historyRecord] = await db.insert(capabilityExtractionHistory).values({
        filename,
        fileType,
        applicationId,
        taskId: 'pending',
        status: 'processing',
        startedAt: new Date(),
        userId
      }).returning();
      
      // Process each chunk
      const allCapabilities: ExtractedCapability[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        // Send chunk for analysis
        const taskId = await this.sendAnalysisRequest(filename, fileType, chunks[i], applicationName, credentials);
        
        // Wait for completion
        const result = await this.waitForCompletion(taskId);
        
        // Parse results (skip individual standardization since we'll do it once at the end)
        const chunkResult = await this.parseExtractionResult(result.result, undefined);
        
        if (chunkResult.capabilities.length > 0) {
          allCapabilities.push(...chunkResult.capabilities);
        }
      }
      
      // Standardize capabilities if credentials available
      let finalCapabilities = allCapabilities;
      if (credentials && allCapabilities.length > 0) {
        try {
          finalCapabilities = await this.standardizeCapabilities(allCapabilities, credentials);
        } catch (error) {
          console.error('Standardization failed, using raw capabilities:', error);
          finalCapabilities = allCapabilities;
        }
      }
      
      // Update history with results
      await db.update(capabilityExtractionHistory)
        .set({
          status: 'completed',
          completedAt: new Date(),
          resultSummary: {
            totalExtracted: finalCapabilities.length,
            chunks: chunks.length
          },
          extractedData: finalCapabilities
        })
        .where(eq(capabilityExtractionHistory.id, historyRecord.id));

      // Return the extraction result
      const extractionResult = {
        capabilities: finalCapabilities,
        totalCount: finalCapabilities.length,
        modules: {},
        rawResult: ''
      };
      
      // DON'T save capabilities here - let the route handler do it
      // This prevents duplicates

      return extractionResult;
    } catch (error) {
      console.error('Capability extraction failed:', error);
      
      // Record failure if we have a history record
      if (filename) {
        const history = await db.select()
          .from(capabilityExtractionHistory)
          .where(eq(capabilityExtractionHistory.filename, filename))
          .orderBy(capabilityExtractionHistory.startedAt)
          .limit(1);
        
        if (history[0]) {
          await db.update(capabilityExtractionHistory)
            .set({
              status: 'failed',
              completedAt: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            .where(eq(capabilityExtractionHistory.id, history[0].id));
        }
      }
      
      throw error;
    }
  }

  /**
   * Save extracted capabilities to application
   */
  private async saveCapabilitiesToApplication(
    applicationId: number,
    extractedCapabilities: ExtractedCapability[],
    extractionHistoryId: number
  ): Promise<void> {
    for (const cap of extractedCapabilities) {
      await db.insert(applicationCapabilities).values({
        applicationId,
        capabilityName: cap.name || cap.webMethod || cap.methodName,
        capabilityType: cap.type || 'web-service',
        area: cap.area || cap.module || null,
        description: cap.description || `${cap.outputName || ''} - ${cap.output || ''}`.trim() || null,
        interfaceType: cap.interfaceType || cap.type || 'SOAP',
        protocol: cap.protocol || 'HTTPS',
        dataFormat: cap.dataFormat || 'XML',
        isActive: true,
        status: 'available',
        endpoint: cap.endpoint || cap.webMethod || null,
        sampleResponse: cap.outputName || cap.output || null,
        extractedFrom: `AutoX-${extractionHistoryId}`,
        extractedDate: new Date(),
        extractedBy: 'autox'
      });
    }
  }

  /**
   * Get extraction history
   */
  async getExtractionHistory(applicationId?: number) {
    if (applicationId) {
      return db.select()
        .from(capabilityExtractionHistory)
        .where(eq(capabilityExtractionHistory.applicationId, applicationId))
        .orderBy(capabilityExtractionHistory.startedAt);
    }
    
    return db.select()
      .from(capabilityExtractionHistory)
      .orderBy(capabilityExtractionHistory.startedAt);
  }
}

export const capabilityExtractor = new CapabilityExtractorService();
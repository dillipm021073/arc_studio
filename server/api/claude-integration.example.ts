import { Router } from 'express';
import { claudeService } from '../services/claude-cli.service';
import { z } from 'zod';

const router = Router();

// Request validation schemas
const AnalyzeDocumentSchema = z.object({
  filePath: z.string(),
  prompt: z.string()
});

const QuerySchema = z.object({
  prompt: z.string(),
  outputFormat: z.enum(['text', 'json']).optional()
});

const ExtractDataSchema = z.object({
  text: z.string(),
  schema: z.string(),
  examples: z.string().optional()
});

/**
 * POST /api/claude/query
 * Send a query to Claude
 */
router.post('/query', async (req, res) => {
  try {
    const { prompt, outputFormat } = QuerySchema.parse(req.body);
    
    const response = await claudeService.query(prompt, { outputFormat });
    
    res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/analyze-document
 * Analyze a document using Claude
 */
router.post('/analyze-document', async (req, res) => {
  try {
    const { filePath, prompt } = AnalyzeDocumentSchema.parse(req.body);
    
    // Security: Ensure file path is within allowed directories
    const allowedBasePath = '/mnt/c/new_portfolio/ApplicationInterfaceTracker/uploads';
    if (!filePath.startsWith(allowedBasePath)) {
      throw new Error('File path not allowed');
    }
    
    const analysis = await claudeService.parseDocument(filePath, prompt);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/extract-structured-data
 * Extract structured data from text
 */
router.post('/extract-structured-data', async (req, res) => {
  try {
    const { text, schema, examples } = ExtractDataSchema.parse(req.body);
    
    const data = await claudeService.extractStructuredData(text, schema, examples);
    
    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/health
 * Check Claude CLI availability
 */
router.get('/health', async (req, res) => {
  try {
    const health = await claudeService.healthCheck();
    
    res.json({
      success: true,
      ...health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Example: Analyze IML documentation
 * POST /api/claude/analyze-iml
 */
router.post('/analyze-iml', async (req, res) => {
  try {
    const { imlData } = req.body;
    
    const prompt = `Analyze this Interface Master List (IML) data and provide:
1. A summary of the interface relationships
2. Potential issues or improvements
3. Suggested test scenarios

IML Data:
${JSON.stringify(imlData, null, 2)}`;

    const analysis = await claudeService.query(prompt, { outputFormat: 'json' });
    
    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Example: Generate test cases for a business process
 * POST /api/claude/generate-test-cases
 */
router.post('/generate-test-cases', async (req, res) => {
  try {
    const { businessProcess, interfaces } = req.body;
    
    const schema = `{
      "testCases": [
        {
          "id": "string - unique test case ID",
          "name": "string - test case name",
          "description": "string - what is being tested",
          "steps": ["string - step by step instructions"],
          "expectedResult": "string - expected outcome",
          "interfaces": ["string - IML numbers involved"]
        }
      ]
    }`;
    
    const prompt = `Generate comprehensive test cases for the following business process:

Business Process: ${businessProcess.name}
Description: ${businessProcess.description}

Interfaces involved:
${interfaces.map((iml: any) => `- ${iml.imlNumber}: ${iml.description}`).join('\n')}

Generate at least 5 test cases covering happy path, error scenarios, and edge cases.`;

    const testCases = await claudeService.extractStructuredData(prompt, schema);
    
    res.json({
      success: true,
      testCases
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
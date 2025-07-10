# Claude CLI Backend Integration

This document describes how to use Claude CLI programmatically as a backend service in the Application Interface Tracker.

## Overview

The Claude CLI can be used programmatically through Node.js to:
- Process natural language queries
- Analyze documents
- Extract structured data
- Generate test cases and documentation
- Provide AI-powered insights for interface analysis

## Installation Requirements

1. **Claude CLI must be installed**:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Set up authentication**:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

## Key Features

### 1. Non-Interactive Mode
- Use `--print` flag for programmatic usage
- Supports JSON output with `--output-format json`
- Can process input via stdin

### 2. Authentication
- Uses `ANTHROPIC_API_KEY` environment variable
- No need for interactive login

### 3. Output Formats
- **text**: Plain text response (default)
- **json**: Structured JSON response
- **stream-json**: Real-time streaming responses

## Usage Examples

### Basic Query
```typescript
import { claudeService } from './services/claude-cli.service';

const response = await claudeService.query('What is an API?');
console.log(response); // Plain text response
```

### JSON Response
```typescript
const response = await claudeService.query(
  'Explain REST API in one sentence',
  { outputFormat: 'json' }
);
console.log(response.content); // Structured response
```

### Document Analysis
```typescript
const analysis = await claudeService.parseDocument(
  '/path/to/document.pdf',
  'Summarize the key points in this document'
);
```

### Structured Data Extraction
```typescript
interface InterfaceData {
  name: string;
  type: string;
  endpoints: string[];
}

const data = await claudeService.extractStructuredData<InterfaceData>(
  documentText,
  schemaDefinition
);
```

## API Endpoints

### Health Check
```
GET /api/claude/health
```

### Query Claude
```
POST /api/claude/query
{
  "prompt": "Your question here",
  "outputFormat": "json" // optional
}
```

### Analyze Document
```
POST /api/claude/analyze-document
{
  "filePath": "/path/to/file",
  "prompt": "Analysis instructions"
}
```

### Extract Structured Data
```
POST /api/claude/extract-structured-data
{
  "text": "Text to analyze",
  "schema": "JSON schema definition",
  "examples": "Optional examples"
}
```

## Use Cases in Application Interface Tracker

### 1. IML Analysis
- Analyze interface relationships
- Identify potential issues
- Suggest improvements

### 2. Test Case Generation
- Generate test scenarios for business processes
- Create connectivity test procedures
- Document test requirements

### 3. Documentation Generation
- Auto-generate interface documentation
- Create change impact summaries
- Generate release notes

### 4. Impact Analysis
- Analyze change request impacts
- Identify affected systems
- Suggest testing priorities

## Error Handling

The service handles common errors:
- API key not found
- Claude CLI not installed
- Timeout errors (default 30s)
- JSON parsing errors
- File access errors

## Security Considerations

1. **File Access**: Restrict file access to allowed directories only
2. **Input Validation**: Always validate user inputs
3. **API Key**: Store securely, never expose in client code
4. **Rate Limiting**: Implement rate limiting for API endpoints

## Limitations

1. **Cost**: Each query consumes API credits
2. **Response Time**: Can take several seconds for complex queries
3. **Context Length**: Limited by model's context window
4. **File Types**: Best with text-based files

## Example Integration

```typescript
// In your Express route
router.post('/api/analyze-change-impact', async (req, res) => {
  const { changeRequest } = req.body;
  
  const prompt = `Analyze this change request and identify:
1. Systems that will be impacted
2. Interfaces that need testing
3. Risk level (high/medium/low)

Change Request: ${JSON.stringify(changeRequest)}`;

  const analysis = await claudeService.query(prompt, { 
    outputFormat: 'json' 
  });
  
  res.json({ impact: analysis });
});
```

## Troubleshooting

### "Credit balance is too low"
- Check your Anthropic account balance
- Ensure API key has sufficient credits

### "Command not found: claude"
- Ensure Claude CLI is installed globally
- Check PATH environment variable

### Timeout errors
- Increase timeout in options
- Simplify complex prompts
- Use streaming for long responses
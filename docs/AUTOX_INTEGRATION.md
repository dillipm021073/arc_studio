# AutoX AI Capability Extraction Integration

This document describes the AutoX AI integration for extracting application capabilities from technical documents.

## Overview

The Application Interface Tracker now supports capability extraction using AutoX Cloud AI. This feature allows you to:

- Extract capabilities from documents already uploaded to AutoX
- Analyze PDFs, Word documents, text files, Excel sheets, and images
- Automatically identify APIs, interfaces, protocols, and integration points
- Track extraction history and results

## Setup

### 1. Environment Configuration

Add the following to your `.env` file:

```env
# Extraction Method (optional, defaults to 'autox')
EXTRACTION_METHOD=autox
```

### 2. User Settings

AutoX credentials are now stored per-user for security:

1. Click on the **Settings** button in the sidebar
2. Navigate to the **Integrations** tab
3. Enter your AutoX credentials:
   - **Username**: Your AutoX username (e.g., dillipm)
   - **API Key**: Your AutoX API key
4. Click **Save Settings**

The AutoX URL is: `https://promptui.autox.corp.amdocs.azr/`

### 2. Database Migration

The required database tables are automatically created when you run:

```bash
npm run db:push
```

New tables added:
- `capability_extraction_history` - Tracks extraction attempts
- `capabilities` - Stores extracted capabilities

## Usage

### 1. Upload Documents to AutoX

Before using the extraction feature, you must:
1. Log into the AutoX web interface
2. Upload your technical documents (PDF, DOCX, TXT, etc.)
3. Note the filename as it appears in AutoX (may include username prefix)

### 2. Extract Capabilities in AIT

1. Navigate to an application's capabilities page
2. Click the "Use AutoX" button in the upload section
3. Enter the filename exactly as it appears in AutoX
4. Select the file type
5. Click "Extract with AutoX"

### 3. View Results

The extraction process will:
- Send the request to AutoX API
- Poll for completion (may take 30-60 seconds)
- Display extracted capabilities
- Save them to your application

## API Endpoints

### Extract Capabilities
```
POST /api/applications/:id/extract-autox
Body: {
  filename: "document-name-in-autox.pdf",
  fileType: "pdf" | "word" | "text" | "excel" | "image"
}
```

### Get Extraction History
```
GET /api/applications/:id/extraction-history
```

### Get Capabilities by Extraction
```
GET /api/capabilities/by-extraction/:extractionId
```

## Supported File Types

- **PDF** (.pdf) - Technical documentation, API guides
- **Word** (.docx, .doc) - Specifications, requirements
- **Text** (.txt) - README files, plain text docs
- **Excel** (.xlsx, .xls) - API lists, capability matrices
- **Images** (.png, .jpg) - Architecture diagrams, screenshots

## Extracted Information

AutoX AI extracts:
- Interface types (REST, SOAP, GraphQL, etc.)
- Protocols (HTTP/HTTPS, SFTP, AMQP, etc.)
- Data formats (JSON, XML, CSV, etc.)
- Authentication methods
- Third-party services and integrations
- API endpoints and operations
- Sample requests/responses

## Troubleshooting

### "Error getting document data"
- Ensure the document is uploaded to AutoX first
- Check that the filename matches exactly (including any username prefix)
- Verify your AutoX credentials are correct

### Timeout Errors
- Large documents may take longer to process
- The system will retry automatically
- Maximum processing time is 2-3 minutes

### Authentication Issues
- Verify AUTOX_API_KEY and AUTOX_USERNAME in .env
- Ensure your AutoX account has access to the documents

## Testing

1. Upload the test document to AutoX:
   - `test-capabilities-doc.txt` (included in the repo)

2. Run the extraction:
   ```javascript
   // Filename format in AutoX: username-filename
   filename: "dillipm-test_capabilities_doc.txt"
   fileType: "text"
   ```

3. Expected results:
   - 22 capabilities extracted
   - Categories: Authentication, Payment, Data Export, Integration, File Management

## Development

### Adding New File Types

1. Update the file type options in `autox-extraction-dialog.tsx`
2. Modify the prompt in `capability-extractor.ts` for the new type
3. Test with sample documents

### Customizing Extraction

The extraction prompt can be customized in:
`server/services/capability-extractor.ts` → `buildPrompt()` method

## Security

- API keys are stored in environment variables
- All requests use HTTPS
- Extracted data is validated before storage
- User permissions are checked before extraction
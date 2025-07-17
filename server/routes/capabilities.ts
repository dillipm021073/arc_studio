import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { storage } from "../storage";
import { GeminiExtractorService } from "../services/gemini-extractor";
import { capabilityExtractor } from "../services/capability-extractor";
import { requireAuth, requirePermission } from "../auth";
import { parseIdParam } from "../middleware/validation";
import { insertApplicationCapabilitySchema, insertUploadedDocumentSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";

const router = Router();

// Initialize extractor services
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiExtractor = geminiApiKey ? new GeminiExtractorService(geminiApiKey) : null;

// Get extraction method from environment or default to autox
const EXTRACTION_METHOD = process.env.EXTRACTION_METHOD || 'autox';


// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads", "capabilities");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureUploadDir();
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, DOCX, DOC, TXT, XLSX, XLS'));
    }
  }
});


// Get all capabilities for an application
router.get("/applications/:id/capabilities", requireAuth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const capabilities = await storage.getApplicationCapabilities(applicationId);
    res.json(capabilities);
  } catch (error) {
    console.error("Error fetching capabilities:", error);
    res.status(500).json({ message: "Failed to fetch capabilities" });
  }
});

// Get capabilities by status
router.get("/applications/:id/capabilities/by-status/:status", requireAuth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { status } = req.params;
    const capabilities = await storage.getCapabilitiesByStatus(applicationId, status);
    res.json(capabilities);
  } catch (error) {
    console.error("Error fetching capabilities by status:", error);
    res.status(500).json({ message: "Failed to fetch capabilities" });
  }
});

// Get a single capability
router.get("/capabilities/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const capability = await storage.getApplicationCapability(id);
    if (!capability) {
      return res.status(404).json({ message: "Capability not found" });
    }
    res.json(capability);
  } catch (error) {
    console.error("Error fetching capability:", error);
    res.status(500).json({ message: "Failed to fetch capability" });
  }
});

// Create a capability manually
router.post("/applications/:id/capabilities", requireAuth, requirePermission('applications', 'update'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const data = insertApplicationCapabilitySchema.parse({
      ...req.body,
      applicationId,
      extractedBy: req.user?.username || 'manual',
      extractedDate: new Date()
    });
    
    const capability = await storage.createApplicationCapability(data);
    res.status(201).json(capability);
  } catch (error) {
    console.error("Error creating capability:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid capability data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create capability" });
  }
});

// Update a capability
router.put("/capabilities/:id", requireAuth, requirePermission('applications', 'update'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const capability = await storage.updateApplicationCapability(id, req.body);
    if (!capability) {
      return res.status(404).json({ message: "Capability not found" });
    }
    res.json(capability);
  } catch (error) {
    console.error("Error updating capability:", error);
    res.status(500).json({ message: "Failed to update capability" });
  }
});

// Delete a capability
router.delete("/capabilities/:id", requireAuth, requirePermission('applications', 'delete'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteApplicationCapability(id);
    if (!deleted) {
      return res.status(404).json({ message: "Capability not found" });
    }
    res.json({ message: "Capability deleted successfully" });
  } catch (error) {
    console.error("Error deleting capability:", error);
    res.status(500).json({ message: "Failed to delete capability" });
  }
});

// Match capability with IML
router.post("/capabilities/:id/match-iml", requireAuth, requirePermission('applications', 'update'), async (req, res) => {
  try {
    const capabilityId = parseInt(req.params.id);
    const { imlId } = req.body;
    
    if (!imlId) {
      return res.status(400).json({ message: "IML ID is required" });
    }
    
    const capability = await storage.matchCapabilityWithIML(capabilityId, imlId);
    if (!capability) {
      return res.status(404).json({ message: "Capability not found" });
    }
    
    res.json(capability);
  } catch (error) {
    console.error("Error matching capability with IML:", error);
    res.status(500).json({ message: "Failed to match capability with IML" });
  }
});


// Upload and process document for capability extraction
router.post("/applications/:id/upload-capabilities", 
  async (req, res, next) => {
    
    // Load user from session before multer
    const passportUser = (req.session as any)?.passport?.user;
    if (passportUser && !req.user) {
      storage.getUser(passportUser)
        .then(user => {
          if (user) {
            req.user = user;
          }
          next();
        })
        .catch(err => {
          next();
        });
    } else {
      next();
    }
  },
  upload.single('document'),
  async (req, res) => {
    
    try {
      // Auth check
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Quick permission check for admin
      if (req.user.role === 'admin') {
      } else {
        const userPermissions = await storage.getUserPermissions(req.user.id);
        const hasPermission = userPermissions.some(p => 
          p.resource === 'applications' && 
          (p.action === 'update' || p.action === 'create')
        );
        
        if (!hasPermission) {
          return res.status(403).json({ message: "Insufficient permissions" });
        }
      }
      
    
    try {
      const applicationId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get application details
      const application = await storage.getApplication(applicationId);
      if (!application) {
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ message: "Application not found" });
      }

      // Create document record
      const documentData = insertUploadedDocumentSchema.parse({
        applicationId,
        fileName: req.file.originalname,
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size,
        filePath: req.file.path,
        uploadedBy: req.user?.username || 'unknown',
        processedStatus: 'processing',
        extractionMethod: req.body.extractionMethod || EXTRACTION_METHOD,
        extractionStartTime: new Date()
      });

      const document = await storage.createUploadedDocument(documentData);

      // Declare timeoutId and responseTimedOut in outer scope
      let timeoutId: NodeJS.Timeout | undefined;
      let responseTimedOut = false;

      try {
        // Set a timeout for the response
        timeoutId = setTimeout(() => {
          if (!res.headersSent) {
            responseTimedOut = true;
            console.error('Request timeout');
            res.status(408).json({ message: 'Request timeout' });
          }
        }, 600000); // 10 minutes timeout for long processing (extraction + standardization)
        
        // Determine extraction method
        const extractionMethod = documentData.extractionMethod || EXTRACTION_METHOD;
        
        let extractedCapabilities = [];
        
        if (extractionMethod === 'autox') {
          // Get user's AutoX credentials
          const user = await storage.getUser(req.user?.id);
          if (!user?.autoXApiKey || !user?.autoXUsername) {
            throw new Error('AutoX credentials not configured. Please configure them in Settings.');
          }
          
          try {
            // Use the actual uploaded file
            const result = await capabilityExtractor.extractCapabilities(
              req.file.filename,  // Use the actual filename from multer
              documentData.fileType,
              applicationId,
              req.user?.id,
              {
                apiKey: user.autoXApiKey,
                username: user.autoXUsername
              }
            );
            
            // AutoX returns capabilities in result.capabilities
            extractedCapabilities = result.capabilities || [];
            console.log(`AutoX extraction completed: ${extractedCapabilities.length} capabilities found`);
          } catch (autoXError: any) {
            console.error('AutoX extraction error:', autoXError);
            throw new Error(`Capability extraction failed: ${autoXError.message || 'Unknown error'}`);
          }
        } else if (geminiExtractor) {
          // Fallback to Gemini if configured
          extractedCapabilities = await geminiExtractor.extractCapabilitiesFromPDF(
            req.file.path
          );
        } else {
          throw new Error('No extraction service available. Please configure AUTOX_API_KEY or GEMINI_API_KEY.');
        }

        // Save extracted capabilities
        const savedCapabilities = [];
        let successCount = 0;
        let failedCount = 0;

        for (const cap of extractedCapabilities) {
          try {
            // Check if capability might match existing IML
            let mappedImlId = null;
            if ((cap as any).endpoint || (cap as any).interfaceType) {
              // Try to find matching IML
              const interfaces = await storage.getInterfacesByApplication(applicationId);
              const capabilityNameForMatching = (cap as any).name || (cap as any).webMethod || (cap as any).capabilityName || '';
              const match = interfaces.find(iml => 
                ((cap as any).endpoint && iml.description?.includes((cap as any).endpoint)) ||
                ((cap as any).interfaceType && iml.interfaceType === (cap as any).interfaceType && 
                 capabilityNameForMatching && iml.description?.toLowerCase().includes(capabilityNameForMatching.toLowerCase()))
              );
              if (match) {
                mappedImlId = match.id;
              }
            }

            // Create capability data - handle standardized format from AutoX
            const capItem = cap as any;
            const capabilityData = {
              applicationId,
              capabilityName: capItem.name || capItem.webMethod || capItem.capabilityName,
              capabilityType: capItem.type || capItem.capabilityType || 'interface',
              area: capItem.area || capItem.module || null,
              description: capItem.description || null,
              interfaceType: capItem.interfaceType || capItem.type || null,
              protocol: capItem.protocol || 'HTTPS',
              dataFormat: capItem.dataFormat || 'XML',
              isActive: capItem.isActive !== undefined ? capItem.isActive : true,
              status: capItem.status || 'available',
              endpoint: capItem.endpoint || capItem.webMethod || capItem.endpoints?.[0] || null,
              sampleRequest: capItem.sampleRequest || null,
              sampleResponse: capItem.sampleResponse || capItem.outputName || null,
              documentation: capItem.documentation || null,
              mappedImlId,
              extractedFrom: req.file.originalname,
              extractedDate: new Date(),
              extractedBy: extractionMethod
            };

            const savedCapability = await storage.createApplicationCapability(capabilityData as any);
            savedCapabilities.push(savedCapability);
            successCount++;
          } catch (error) {
            failedCount++;
          }
        }

        // Update document record
        await storage.updateUploadedDocument(document.id, {
          processedStatus: 'completed',
          extractionEndTime: new Date(),
          capabilitiesExtracted: successCount,
          extractionNotes: `Successfully extracted ${successCount} capabilities. Failed: ${failedCount}`
        });

        // Clear timeout and send response
        clearTimeout(timeoutId);
        if (!responseTimedOut && !res.headersSent) {
          res.json({
            message: "Document processed successfully",
            document,
            capabilitiesExtracted: successCount,
            capabilitiesFailed: failedCount,
            capabilities: savedCapabilities
          });
        }

      } catch (extractionError) {
        console.error("Error during extraction:", extractionError);
        
        // Update document record with error
        await storage.updateUploadedDocument(document.id, {
          processedStatus: 'failed',
          extractionEndTime: new Date(),
          extractionNotes: `Extraction failed: ${extractionError.message}`
        });

        // Clear timeout and send error response
        if (timeoutId) clearTimeout(timeoutId);
        if (!responseTimedOut && !res.headersSent) {
          res.status(500).json({ 
            message: "Failed to extract capabilities from document",
            error: extractionError.message 
          });
        }
      }

    } catch (error) {
      console.error("Error processing document upload:", error);
      console.error("Error stack:", error.stack);
      
      // Clean up uploaded file if it exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      if (!res.headersSent) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid document data", errors: error.errors });
        }
        
        res.status(500).json({ 
          message: "Failed to process document upload",
          error: error.message 
        });
      }
    }
    } catch (authError) {
      console.error("Auth/permission error:", authError);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Failed to verify authentication",
          error: authError.message 
        });
      }
    }
  }
);

// Extract capabilities using AutoX API
router.post("/applications/:id/extract-autox", requireAuth, requirePermission('applications', 'update'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { filename, fileType, autoXApiKey, autoXUsername } = req.body;
    
    if (!filename || !fileType) {
      return res.status(400).json({ message: "Filename and fileType are required" });
    }
    
    if (!autoXApiKey || !autoXUsername) {
      return res.status(400).json({ message: "AutoX credentials are required" });
    }
    
    // Get application details
    const application = await storage.getApplication(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Start extraction using AutoX with provided credentials
    const result = await capabilityExtractor.extractCapabilities(
      filename,
      fileType,
      applicationId,
      req.user?.id,
      {
        apiKey: autoXApiKey,
        username: autoXUsername
      }
    );
    
    res.json({
      message: "Extraction completed successfully",
      totalExtracted: result.totalCount,
      capabilities: result.capabilities,
      modules: result.modules
    });
    
  } catch (error) {
    console.error("AutoX extraction error:", error);
    res.status(500).json({ 
      message: "Failed to extract capabilities using AutoX",
      error: error.message 
    });
  }
});

// Get extraction history
router.get("/applications/:id/extraction-history", requireAuth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const history = await capabilityExtractor.getExtractionHistory(applicationId);
    res.json(history);
  } catch (error) {
    console.error("Error fetching extraction history:", error);
    res.status(500).json({ message: "Failed to fetch extraction history" });
  }
});

// Get capabilities from extraction history
router.get("/capabilities/by-extraction/:extractionId", requireAuth, async (req, res) => {
  try {
    const extractionId = parseInt(req.params.extractionId);
    const capabilities = await storage.getCapabilitiesByExtraction(extractionId);
    res.json(capabilities);
  } catch (error) {
    console.error("Error fetching capabilities by extraction:", error);
    res.status(500).json({ message: "Failed to fetch capabilities" });
  }
});

// Get uploaded documents for an application
router.get("/applications/:id/documents", requireAuth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const documents = await storage.getUploadedDocuments(applicationId);
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// Get capabilities for a specific document
router.get("/documents/:id/capabilities", requireAuth, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Get document details
    const document = await storage.getUploadedDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Get capabilities extracted from this document
    const capabilities = await storage.getCapabilitiesByDocument(document.fileName);
    res.json(capabilities);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch document capabilities" });
  }
});

// Delete an uploaded document
router.delete("/documents/:id", requireAuth, requirePermission('applications', 'delete'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Get document details first
    const document = await storage.getUploadedDocument(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Delete related capabilities
    let deletedCapabilities = 0;
    try {
      // Delete capabilities that were extracted from this document
      deletedCapabilities = await storage.deleteCapabilitiesByDocument(document.fileName);
      console.log(`Deleted ${deletedCapabilities} capabilities extracted from ${document.fileName}`);
    } catch (error) {
      console.error("Error deleting related capabilities:", error);
    }
    
    // Delete extraction history
    let deletedHistory = 0;
    try {
      // Delete extraction history for this document
      deletedHistory = await storage.deleteExtractionHistoryByDocument(document.fileName);
      console.log(`Deleted ${deletedHistory} extraction history records for ${document.fileName}`);
    } catch (error) {
      console.error("Error deleting extraction history:", error);
    }
    
    // Delete the file from disk
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
    }
    
    // Delete from database
    const deleted = await storage.deleteUploadedDocument(id);
    if (!deleted) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    res.json({ 
      message: "Document deleted successfully",
      deletedCapabilities,
      deletedHistory,
      details: `Cleaned up ${deletedCapabilities} capabilities and ${deletedHistory} extraction history records`
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

// Download a document
router.get("/applications/:appId/documents/:docId/download", requireAuth, async (req, res) => {
  try {
    const documentId = parseInt(req.params.docId);
    
    // Get document details
    const document = await storage.getUploadedDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({ message: "Document file not found on disk" });
    }
    
    // Set appropriate headers based on file type
    const contentType = getContentType(document.fileType);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    
    // Stream the file
    const fileStream = fsSync.createReadStream(document.filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream document" });
      }
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ message: "Failed to download document" });
  }
});

// Helper function to determine content type
function getContentType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    text: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
}

// Error handling middleware
router.use((err: any, req: any, res: any, next: any) => {
  console.error("Capabilities route error:", err);
  console.error("Error stack:", err.stack);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: "File too large" });
  }
  
  if (err.message?.includes('authentication')) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  res.status(500).json({ 
    message: "Internal server error", 
    error: err.message 
  });
});

export default router;
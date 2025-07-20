export function formatXml(xml: string): string {
  try {
    // First, try to parse as JSON (in case it's a JSON response with XML string)
    if (xml.trim().startsWith('"') && xml.trim().endsWith('"')) {
      // It's a JSON string, parse it
      xml = JSON.parse(xml);
    }
    
    // Remove escape characters
    xml = xml.replace(/\\n/g, '\n')
             .replace(/\\r/g, '\r')
             .replace(/\\t/g, '\t')
             .replace(/\\"/g, '"')
             .replace(/\\\\/g, '\\');
    
    // Format XML with proper indentation
    const PADDING = '  ';
    let formatted = '';
    let pad = 0;
    
    // Split into tokens
    const tokens = xml.split(/>\s*</);
    
    if (tokens.length === 1) {
      // No XML tags found, return as-is but cleaned
      return xml;
    }
    
    tokens.forEach((token, index) => {
      let indent = 0;
      let padding = '';
      
      // Add back the brackets
      if (index > 0) {
        token = '<' + token;
      }
      if (index < tokens.length - 1) {
        token = token + '>';
      }
      
      // Trim whitespace
      token = token.trim();
      
      // Closing tag - reduce indent
      if (token.match(/^<\/\w/)) {
        pad -= 1;
      }
      
      // Build padding
      for (let i = 0; i < pad; i++) {
        padding += PADDING;
      }
      
      formatted += padding + token + '\n';
      
      // Opening tag (not self-closing) - increase indent
      if (token.match(/^<\w[^>]*[^\/]>.*$/)) {
        // Check if the tag contains text content (not just other tags)
        const hasTextContent = token.match(/^<\w[^>]*[^\/]>[^<]/);
        if (!hasTextContent) {
          pad += 1;
        }
      }
      
      // Self-closing tag - no indent change
      if (token.match(/^<\w[^>]*\/>/)) {
        // No change in padding
      }
    });
    
    return formatted.trim();
  } catch (error) {
    // If parsing fails, return the original string
    console.error('XML formatting error:', error);
    return xml;
  }
}

export function isXmlContent(content: string | any): boolean {
  if (typeof content !== 'string') {
    return false;
  }
  
  // Remove whitespace and check for XML indicators
  const trimmed = content.trim();
  
  // Check for XML declaration
  if (trimmed.startsWith('<?xml')) {
    return true;
  }
  
  // Check for SOAP envelope
  if (trimmed.includes('<soap:') || trimmed.includes('<SOAP:') || 
      trimmed.includes('<soapenv:') || trimmed.includes('<s:Envelope')) {
    return true;
  }
  
  // Check for any XML-like structure
  if (trimmed.match(/^<[^>]+>[\s\S]*<\/[^>]+>$/)) {
    return true;
  }
  
  // Check if it's a JSON string containing XML
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && 
      (trimmed.includes('<?xml') || trimmed.includes('<soap:') || trimmed.includes('<SOAP:'))) {
    return true;
  }
  
  return false;
}
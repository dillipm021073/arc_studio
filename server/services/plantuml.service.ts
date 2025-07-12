import { deflate } from 'zlib';
import { promisify } from 'util';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

const deflateAsync = promisify(deflate);

export class PlantUmlService {
  private static readonly PLANTUML_SERVERS = [
    'https://www.plantuml.com/plantuml',
    'http://www.plantuml.com/plantuml',  // Try HTTP as fallback  
    'https://plantuml.com/plantuml',      // Try without www
    'http://plantuml.com/plantuml'        // HTTP without www
  ];
  
  // Direct URL patterns that bypass redirects
  private static readonly DIRECT_PLANTUML_PATTERNS = [
    'https://www.plantuml.com/plantuml/{format}/{encoded}',
    'http://www.plantuml.com/plantuml/{format}/{encoded}',
  ];

  /**
   * Get proxy configuration from environment variables
   */
  private static getProxyAgent(url: string) {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
    
    if (!proxyUrl) {
      console.log('No proxy configuration found in environment variables');
      return undefined;
    }

    
    if (url.startsWith('https:')) {
      return new HttpsProxyAgent(proxyUrl);
    } else {
      return new HttpProxyAgent(proxyUrl);
    }
  }
  
  /**
   * Encode PlantUML text using the PlantUML encoding algorithm
   */
  static async encode(text: string): Promise<string> {
    // PlantUML encoding process:
    // 1. Convert to UTF-8 bytes
    // 2. Compress using deflate
    // 3. Encode to base64-like format using custom alphabet
    
    const utf8Bytes = Buffer.from(text, 'utf-8');
    const compressed = await deflateAsync(utf8Bytes, { level: 9 }); // Use maximum compression
    
    // Encode the compressed data without the ~1 header
    // The PlantUML server seems to handle it automatically
    return this.encode64(compressed);
  }

  /**
   * PlantUML's custom base64 encoding
   */
  private static encode64(data: Buffer): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
    let result = '';
    let current = 0;
    let bits = 0;

    for (const byte of data) {
      current = (current << 8) | byte;
      bits += 8;

      while (bits >= 6) {
        bits -= 6;
        const index = (current >> bits) & 0x3f;
        result += alphabet[index];
      }
    }

    if (bits > 0) {
      current <<= (6 - bits);
      const index = current & 0x3f;
      result += alphabet[index];
    }

    return result;
  }

  /**
   * Simple encoding for quick rendering (using URL-safe base64)
   */
  static simpleEncode(text: string): string {
    return Buffer.from(text)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Get the URL for a PlantUML diagram
   */
  static async getDiagramUrl(text: string, format: 'svg' | 'png' = 'svg', serverIndex: number = 0): Promise<string> {
    try {
      // Try the proper encoding first
      const encoded = await this.encode(text);
      const server = this.PLANTUML_SERVERS[serverIndex] || this.PLANTUML_SERVERS[0];
      return `${server}/${format}/${encoded}`;
    } catch (error) {
      // If encoding fails, fall back to simple text approach
      console.log('PlantUML encoding failed, trying simple approach:', error.message);
      const encoded = this.simpleEncode(text);
      const server = this.PLANTUML_SERVERS[serverIndex] || this.PLANTUML_SERVERS[0];
      return `${server}/txt/${encoded}`;
    }
  }

  /**
   * Fetch content using native Node.js HTTP client (better proxy support)
   */
  private static async fetchWithNativeHttp(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const requestFn = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest;
      
      const options: any = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'StudioArchitect-PlantUML-Client/1.0'
        },
        timeout: 10000
      };

      // Add proxy agent if configured
      const agent = this.getProxyAgent(url);
      if (agent) {
        options.agent = agent;
      }

      const req = requestFn(options, (res) => {
        let data = '';
        
        // Handle redirects manually
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            console.log(`Redirect to: ${location}`);
            return PlantUmlService.fetchWithNativeHttp(location).then(resolve).catch(reject);
          }
        }
        
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Fetch SVG content from PlantUML server
   */
  static async renderSvg(text: string): Promise<string> {
    console.log('PlantUML text to render:', text);
    console.log('Text length:', text.length);
    
    // First, always try the encoded URL approach with ~1 prefix
    try {
      console.log('Attempting encoded URL approach');
      const encoded = await this.encode(text);
      // Add ~1 prefix to indicate DEFLATE encoding as per PlantUML documentation
      const url = `https://www.plantuml.com/plantuml/svg/~1${encoded}`;
      console.log('Encoded URL length:', url.length);
      
      const svgContent = await this.fetchWithNativeHttp(url);
      if (svgContent && (svgContent.includes('<svg') || svgContent.includes('<?xml'))) {
        // Check if it's an error diagram
        if (svgContent.includes('bad URL') || svgContent.includes('DEFLATE')) {
          console.log('PlantUML returned encoding error, trying simple base64');
          throw new Error('Encoding error from PlantUML');
        }
        console.log('Success with encoded URL approach');
        return this.cleanSvg(svgContent);
      }
    } catch (error) {
      console.log('Encoded URL approach failed:', error.message);
    }
    
    // Fallback to simple base64 encoding for text endpoint
    try {
      console.log('Attempting simple base64 encoding');
      const encoded = this.simpleEncode(text);
      const url = `https://www.plantuml.com/plantuml/txt/${encoded}`;
      console.log('Simple encoded URL length:', url.length);
      
      const textContent = await this.fetchWithNativeHttp(url);
      if (textContent) {
        console.log('Got text diagram, converting to SVG format request');
        // Extract the diagram ID from the response if possible
        // Otherwise, use the svg endpoint with simple encoding
        const svgUrl = url.replace('/txt/', '/svg/');
        const svgContent = await this.fetchWithNativeHttp(svgUrl);
        if (svgContent && (svgContent.includes('<svg') || svgContent.includes('<?xml'))) {
          console.log('Success with simple encoding');
          return this.cleanSvg(svgContent);
        }
      }
    } catch (error) {
      console.log('Simple encoding approach failed:', error.message);
    }
    
    // All attempts failed, return fallback
    console.error('All PlantUML attempts failed, using fallback');
    return this.generateFallbackSvg(text, 'Unable to connect to PlantUML server. Please check your internet connection and proxy settings.');
  }

  /**
   * Generate a fallback SVG when PlantUML server is unavailable
   */
  private static generateFallbackSvg(text: string, errorMessage: string): string {
    const lines = text.split('\n');
    const lineHeight = 20;
    const padding = 20;
    const width = 600;
    const height = Math.max(200, lines.length * lineHeight + padding * 2);

    return `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="${padding}" y="30" font-family="monospace" font-size="14" fill="#dc3545" font-weight="bold">
          PlantUML Server Unavailable
        </text>
        <text x="${padding}" y="55" font-family="monospace" font-size="12" fill="#6c757d">
          ${errorMessage}
        </text>
        <text x="${padding}" y="85" font-family="monospace" font-size="12" fill="#495057" font-weight="bold">
          Source Code:
        </text>
        ${lines.map((line, index) => 
          `<text x="${padding}" y="${105 + index * lineHeight}" font-family="monospace" font-size="11" fill="#212529">${this.escapeXml(line)}</text>`
        ).join('\n        ')}
      </svg>
    `.trim();
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Clean SVG content for safe embedding
   */
  private static cleanSvg(svg: string): string {
    // Remove XML declaration if present
    svg = svg.replace(/<\?xml[^>]*\?>/g, '');
    
    // Add viewBox if missing (for better scaling)
    if (!svg.includes('viewBox')) {
      const widthMatch = svg.match(/width="(\d+)"/);
      const heightMatch = svg.match(/height="(\d+)"/);
      
      if (widthMatch && heightMatch) {
        const width = widthMatch[1];
        const height = heightMatch[1];
        svg = svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
      }
    }
    
    // Remove fixed width/height for responsive sizing
    svg = svg.replace(/width="\d+"/, 'width="100%"');
    svg = svg.replace(/height="\d+"/, 'height="100%"');
    
    return svg;
  }

  /**
   * Validate PlantUML syntax
   */
  static validateSyntax(text: string): { valid: boolean; error?: string } {
    // Basic validation
    if (!text.trim()) {
      return { valid: false, error: 'Diagram content is empty' };
    }
    
    if (!text.includes('@startuml')) {
      return { valid: false, error: 'Missing @startuml directive' };
    }
    
    if (!text.includes('@enduml')) {
      return { valid: false, error: 'Missing @enduml directive' };
    }
    
    // Count start/end pairs
    const startCount = (text.match(/@startuml/g) || []).length;
    const endCount = (text.match(/@enduml/g) || []).length;
    
    if (startCount !== endCount) {
      return { valid: false, error: 'Mismatched @startuml/@enduml directives' };
    }
    
    return { valid: true };
  }

  /**
   * Extract diagram metadata
   */
  static extractMetadata(text: string): any {
    const metadata: any = {
      actors: [],
      participants: [],
      classes: [],
      interfaces: [],
      components: [],
      hasTitle: false,
      hasNotes: false
    };
    
    // Extract title
    const titleMatch = text.match(/title\s+(.+)/);
    if (titleMatch) {
      metadata.title = titleMatch[1];
      metadata.hasTitle = true;
    }
    
    // Extract actors (sequence diagrams)
    const actorMatches = text.matchAll(/actor\s+"?([^"\n]+)"?\s*(as\s+\w+)?/g);
    for (const match of actorMatches) {
      metadata.actors.push(match[1]);
    }
    
    // Extract participants (sequence diagrams)
    const participantMatches = text.matchAll(/participant\s+"?([^"\n]+)"?\s*(as\s+\w+)?/g);
    for (const match of participantMatches) {
      metadata.participants.push(match[1]);
    }
    
    // Extract classes (class diagrams)
    const classMatches = text.matchAll(/class\s+(\w+)\s*{/g);
    for (const match of classMatches) {
      metadata.classes.push(match[1]);
    }
    
    // Check for notes
    if (text.includes('note')) {
      metadata.hasNotes = true;
    }
    
    // Detect diagram type
    if (text.includes('actor') || text.includes('participant')) {
      metadata.type = 'sequence';
    } else if (text.includes('class') || text.includes('interface')) {
      metadata.type = 'class';
    } else if (text.includes('start') && text.includes('stop')) {
      metadata.type = 'activity';
    } else if (text.includes('usecase')) {
      metadata.type = 'usecase';
    } else if (text.includes('component')) {
      metadata.type = 'component';
    } else if (text.includes('state')) {
      metadata.type = 'state';
    }
    
    return metadata;
  }
}
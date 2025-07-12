import { deflate } from 'zlib';
import { promisify } from 'util';

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
   * Encode PlantUML text using the PlantUML encoding algorithm
   */
  static async encode(text: string): Promise<string> {
    // PlantUML encoding process:
    // 1. Convert to UTF-8 bytes
    // 2. Compress using deflate
    // 3. Encode to base64-like format using custom alphabet
    
    const utf8Bytes = Buffer.from(text, 'utf-8');
    const compressed = await deflateAsync(utf8Bytes);
    
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
    const encoded = await this.encode(text);
    const server = this.PLANTUML_SERVERS[serverIndex] || this.PLANTUML_SERVERS[0];
    return `${server}/${format}/${encoded}`;
  }

  /**
   * Fetch SVG content from PlantUML server
   */
  static async renderSvg(text: string): Promise<string> {
    const encoded = await this.encode(text);
    
    // First try direct URL patterns (bypass redirects)
    for (let i = 0; i < this.DIRECT_PLANTUML_PATTERNS.length; i++) {
      try {
        const url = this.DIRECT_PLANTUML_PATTERNS[i]
          .replace('{format}', 'svg')
          .replace('{encoded}', encoded);
        
        console.log(`Attempting direct PlantUML URL ${i + 1}/${this.DIRECT_PLANTUML_PATTERNS.length}:`, url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'StudioArchitect-PlantUML-Client/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const svgContent = await response.text();
          if (svgContent.includes('<svg') || svgContent.includes('<?xml')) {
            console.log(`Success with direct URL ${i + 1}`);
            return this.cleanSvg(svgContent);
          }
        }
        
        console.log(`Direct URL ${i + 1} failed: ${response.status}`);
      } catch (error) {
        console.log(`Direct URL ${i + 1} error:`, error.message);
      }
    }
    
    // Fallback to regular server attempts
    for (let i = 0; i < this.PLANTUML_SERVERS.length; i++) {
      try {
        const url = await this.getDiagramUrl(text, 'svg', i);
        console.log(`Attempting PlantUML server ${i + 1}/${this.PLANTUML_SERVERS.length}:`, url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'StudioArchitect-PlantUML-Client/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const svgContent = await response.text();
          if (svgContent.includes('<svg') || svgContent.includes('<?xml')) {
            console.log(`Success with server ${i + 1}`);
            return this.cleanSvg(svgContent);
          }
        }
        
        console.log(`Server ${i + 1} failed: ${response.status}`);
      } catch (error) {
        console.log(`Server ${i + 1} error:`, error.message);
      }
    }
    
    // All attempts failed, return fallback
    console.error('All PlantUML attempts failed, using fallback');
    return this.generateFallbackSvg(text, 'All PlantUML servers are currently unavailable');
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
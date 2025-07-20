import http from 'http';
import https from 'https';
import fs from 'fs';
import { URL } from 'url';

const requestHandler = (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/soap' || pathname === '/soapService') {
    // SOAP Service Handler
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const timestamp = new Date().toISOString();
      
      
      // Parse SOAP action from headers
      const soapAction = req.headers['soapaction'] || req.headers['SOAPAction'] || '';
      
      // Generate SOAP response
      const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <ns:HelloWorldResponse xmlns:ns="http://localhost/soapService">
      <ns:Message>Hello World from SOAP Service</ns:Message>
      <ns:Timestamp>${timestamp}</ns:Timestamp>
      <ns:ReceivedAction>${soapAction}</ns:ReceivedAction>
      <ns:Method>${method}</ns:Method>
    </ns:HelloWorldResponse>
  </soap:Body>
</soap:Envelope>`;

      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.writeHead(200);
      res.end(soapResponse);
    });
  } else if (pathname === '/helloWorld') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const timestamp = new Date().toISOString();
      let requestData = null;
      
      if (body) {
        try {
          requestData = JSON.parse(body);
        } catch (e) {
          requestData = body;
        }
      }

      switch (method) {
        case 'GET':
          res.writeHead(200);
          res.end(JSON.stringify({
            message: 'Hello World from GET',
            method: 'GET',
            timestamp: timestamp,
            query: Object.fromEntries(parsedUrl.searchParams)
          }));
          break;

        case 'POST':
          res.writeHead(201);
          res.end(JSON.stringify({
            message: 'Hello World from POST',
            method: 'POST',
            timestamp: timestamp,
            data: requestData
          }));
          break;

        case 'PUT':
          res.writeHead(200);
          res.end(JSON.stringify({
            message: 'Hello World from PUT',
            method: 'PUT',
            timestamp: timestamp,
            data: requestData
          }));
          break;

        case 'DELETE':
          res.writeHead(200);
          res.end(JSON.stringify({
            message: 'Hello World from DELETE',
            method: 'DELETE',
            timestamp: timestamp
          }));
          break;

        default:
          res.writeHead(405);
          res.end(JSON.stringify({
            error: 'Method not allowed',
            method: method,
            timestamp: timestamp
          }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not found',
      path: pathname,
      timestamp: new Date().toISOString()
    }));
  }
};

// Create HTTP servers
const httpServer4000 = http.createServer(requestHandler);
const httpServer6500 = http.createServer(requestHandler);

// Create HTTPS server
let httpsServer;
try {
  const privateKey = fs.readFileSync('server.key', 'utf8');
  const certificate = fs.readFileSync('server.cert', 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  httpsServer = https.createServer(credentials, requestHandler);
} catch (error) {
  console.error('Error loading SSL certificates:', error.message);
  console.log('HTTPS server will not be started. Make sure server.key and server.cert exist.');
}

const HTTP_PORT_1 = 4000;
const HTTP_PORT_2 = 6500;
const HTTPS_PORT = 6501;

// Start first HTTP server on port 4000
httpServer4000.listen(HTTP_PORT_1, '0.0.0.0', () => {
  console.log(`HTTP server running at http://localhost:${HTTP_PORT_1}/helloWorld`);
  console.log('HTTP Endpoints (Port 4000):');
  console.log('  GET    http://localhost:4000/helloWorld');
  console.log('  POST   http://localhost:4000/helloWorld');
  console.log('  PUT    http://localhost:4000/helloWorld');
  console.log('  DELETE http://localhost:4000/helloWorld');
  console.log('  POST   http://localhost:4000/soap (SOAP Service)');
});

// Start second HTTP server on port 6500
httpServer6500.listen(HTTP_PORT_2, '0.0.0.0', () => {
  console.log(`\nHTTP server running at http://localhost:${HTTP_PORT_2}/helloWorld`);
  console.log('HTTP Endpoints (Port 6500):');
  console.log('  GET    http://localhost:6500/helloWorld');
  console.log('  POST   http://localhost:6500/helloWorld');
  console.log('  PUT    http://localhost:6500/helloWorld');
  console.log('  DELETE http://localhost:6500/helloWorld');
  console.log('  POST   http://localhost:6500/soap (SOAP Service)');
});

// Start HTTPS server if certificates are available
if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`\nSimple HTTPS server running at https://localhost:${HTTPS_PORT}/helloWorld`);
    console.log('HTTPS Endpoints:');
    console.log('  GET    https://localhost:6501/helloWorld');
    console.log('  POST   https://localhost:6501/helloWorld');
    console.log('  PUT    https://localhost:6501/helloWorld');
    console.log('  DELETE https://localhost:6501/helloWorld');
    console.log('  POST   https://localhost:6501/soap (SOAP Service)');
    console.log('\nNote: The HTTPS server uses a self-signed certificate.');
    console.log('Clients may need to accept the certificate or use --insecure flag.');
    
    // Display sample SOAP request
    console.log('\n=== SAMPLE SOAP REQUEST ===');
    console.log('Endpoint: https://localhost:6501/soap');
    console.log('Method: POST');
    console.log('Headers:');
    console.log('  Content-Type: text/xml; charset=utf-8');
    console.log('  SOAPAction: "HelloWorld"');
    console.log('\nBody:');
    console.log(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <ns:HelloWorldRequest xmlns:ns="http://localhost/soapService">
      <ns:Name>TestUser</ns:Name>
      <ns:Message>Hello from SOAP Client</ns:Message>
    </ns:HelloWorldRequest>
  </soap:Body>
</soap:Envelope>`);
    console.log('\nExample curl command:');
    console.log(`curl -k --noproxy localhost -X POST https://localhost:6501/soap \\
  -H "Content-Type: text/xml; charset=utf-8" \\
  -H "SOAPAction: \\"HelloWorld\\"" \\
  -d '<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header/><soap:Body><ns:HelloWorldRequest xmlns:ns="http://localhost/soapService"><ns:Name>TestUser</ns:Name></ns:HelloWorldRequest></soap:Body></soap:Envelope>'`);
    console.log('=== END SAMPLE SOAP REQUEST ===\n');
  });
  
  // Add error handling for HTTPS server
  httpsServer.on('error', (error) => {
    console.error('HTTPS Server Error:', error);
  });
  
  // Log incoming HTTPS connections for debugging
  httpsServer.on('connection', (socket) => {
    console.log('New HTTPS connection from:', socket.remoteAddress);
  });
}

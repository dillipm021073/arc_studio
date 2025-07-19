import http from 'http';
import { URL } from 'url';

const server = http.createServer((req, res) => {
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

  if (pathname === '/helloWorld') {
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
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Simple HTTP server running at http://localhost:${PORT}/helloWorld`);
  console.log('Endpoints:');
  console.log('  GET    http://localhost:4000/helloWorld');
  console.log('  POST   http://localhost:4000/helloWorld');
  console.log('  PUT    http://localhost:4000/helloWorld');
  console.log('  DELETE http://localhost:4000/helloWorld');
});

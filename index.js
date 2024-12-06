const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const PORT_HTTP = 4001; // For HTTP and WS
const PORT_HTTPS = 4000; // For HTTPS and WSS
const AUTHENTICATION_KEY = 'AUTH_KEY_CHANGE_ME';

const RPC_ENDPOINTS = {
  'rpc-endpoint-00': 'https://remote-rpc-endpoint-00/',
};

const WS_RPC_ENDPOINTS = {
  'ws-endpoint-00': 'wss://remote-ws-endpoint-00/',
};

const authenticate = (req, res, next) => {
  const apiKey = req.query.apiKey;
  if (!apiKey || apiKey !== AUTHENTICATION_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use(bodyParser.json());
app.use(authenticate);

// HTTP and HTTPS endpoints for HTTP RPC
app.post('/rpc/:endpoint', async (req, res) => {
  const endpoint = req.params.endpoint;
  const destinationUrl = RPC_ENDPOINTS[endpoint];

  if (!destinationUrl) {
    return res.status(400).json({ error: `Unsupported RPC endpoint: ${endpoint}` });
  }

  try {
    const response = await axios.post(destinationUrl, req.body, { timeout: 20000 });
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to relay request' });
  }
});

// HTTP Server
const httpServer = http.createServer(app);

// HTTPS Server
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

// WebSocket Servers
const wsServer = new WebSocket.Server({ server: httpServer });
const wssServer = new WebSocket.Server({ server: httpsServer });

const handleWebSocketConnection = (socket, secure) => {
  console.log(`WebSocket connection established (${secure ? 'wss' : 'ws'}).`);

  socket.on('message', async (message) => {
    try {
      const { endpoint, payload } = JSON.parse(message);

      if (!WS_RPC_ENDPOINTS[endpoint]) {
        socket.send(JSON.stringify({ error: `Unsupported WebSocket RPC endpoint: ${endpoint}` }));
        return;
      }

      const destinationSocket = new WebSocket(WS_RPC_ENDPOINTS[endpoint]);
      destinationSocket.on('open', () => destinationSocket.send(JSON.stringify(payload)));
      destinationSocket.on('message', (data) => socket.send(data));
      destinationSocket.on('error', (err) => socket.send(JSON.stringify({ error: err.message })));
    } catch (error) {
      console.error('WebSocket error:', error);
      socket.send(JSON.stringify({ error: 'Failed to process WebSocket message' }));
    }
  });

  socket.on('close', () => {
    console.log(`WebSocket connection closed (${secure ? 'wss' : 'ws'}).`);
  });
};

wsServer.on('connection', (socket) => handleWebSocketConnection(socket, false));
wssServer.on('connection', (socket) => handleWebSocketConnection(socket, true));

// Start servers
httpServer.listen(PORT_HTTP, () => {
  console.log(`HTTP and WS server listening on port ${PORT_HTTP}`);
});

httpsServer.listen(PORT_HTTPS, () => {
  console.log(`HTTPS and WSS server listening on port ${PORT_HTTPS}`);
});

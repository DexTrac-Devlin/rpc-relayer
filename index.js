const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
// Update the below line to change the listening port.
// Be sure to adjust your docker run command to publish the port.
const PORT = 4000;
// Adjust the below value to change your authentication key
const AUTHENTICATION_KEY = 'AUTH_KEY_CHANGE_ME';

const RPC_ENDPOINTS = {
  // Update the below to configure the relayer URL path and the destination RPC endpoint
  // Example:
  // 'url-path': 'remote-rpc-endpoint'
  'rpc-endpoint-00': 'https://remote-rpc-endpoint-00/',
  'rpc-endpoint-01': 'https://remote-rpc-endpoint-01/',
  // ... add other endpoints as needed
};

const authenticate = (req, res, next) => {
    const apiKey = req.query.apiKey;
    if (!apiKey || apiKey !== AUTHENTICATION_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(authenticate);

// Add Axios interceptors for logging
axios.interceptors.request.use(request => {
    console.log('Starting Request', request);
    return request;
});

axios.interceptors.response.use(response => {
    console.log('Response:', response);
    return response;
}, error => {
    console.log('Error:', error);
    return Promise.reject(error);
});

// Adjust the below line to change the HTTP timeout.
// Default is 20,000 miliseconds, or 20 seconds
const RELAYER_HTTP_TIMEOUT = 20000;

app.post('/rpc/:endpoint', async (req, res) => {
    const endpoint = req.params.endpoint;
    const destinationUrl = RPC_ENDPOINTS[endpoint];

    if (!destinationUrl) {
        return res.status(400).json({ error: `Unsupported RPC endpoint: ${endpoint}` });
    }

    try {
        const response = await axios.post(destinationUrl, req.body, {
            timeout: RELAYER_HTTP_TIMEOUT
        });
        res.json(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(504).json({ error: 'Request timed out' }); // 504 Gateway Timeout
        } else {
            res.status(500).json({ error: 'Failed to relay request' });
        }
    }
});

// Load your HTTPS certificate and private key
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Create an HTTPS service identical to the HTTP service using the Express app instance
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log(`RPC relay server is running securely on port ${PORT}`);
});

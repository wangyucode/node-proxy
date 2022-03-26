const fs = require('fs');
const http = require('http');
const https = require('https');

const hostname = '127.0.0.1';
const port = 8081;
const token = fs.readFileSync('./token').toString();

const server = http.createServer((req, res) => {
    if (req.url === '/proxy' && req.method === 'POST') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            sendRequest(res, JSON.parse(data));
        });
    } else {
        responseError(res, http.STATUS_CODES[400]);
    }
});

function sendRequest(res2Client, data) {
    if (token !== data.token) {
        responseError(res2Client, 'Invalid token');
        return
    }

    const options = {
        method: data.method || 'GET'
    };
    const httpClient = data.url.startsWith('https') ? https : http;
    try {
        const req = httpClient.request(data.url, options, res => {
            const log = `${new Date()} requst to ${data.url}, status=${res.statusCode}\n`;
            fs.appendFile('logs', log, (e) => e && console.error(e));
            console.log(log);
            if (res.statusCode == 301) {
                sendRequest(res2Client, { ...data, url: res.headers.location });
            } else {
                res2Client.writeHead(res.statusCode, res.headers);
                res.pipe(res2Client);
            }
        });
        req.on('error', error => responseError(res2Client, error));
        if (data.method === 'POST' && data.payload) req.write(JSON.stringify(data.payload));
        req.end();
    } catch (error) {
        responseError(res2Client, error);
    }
}

function responseError(res, error) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 400;
    res.end(JSON.stringify(error));
}

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

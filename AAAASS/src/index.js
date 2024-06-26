// websockets require
const https = require('https');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const uuidv4 = require('uuid').v4;
const httpsOptions = {
    key: fs.readFileSync('privkey1.pem'),
    cert: fs.readFileSync('cert1.pem')
};
const server = https.createServer(httpsOptions);
const port = 8091;
const clients = {};
const wss = new WebSocketServer({ server });

server.listen(port, () => {
    console.log(`Websocket server started on port ${port}`);
    console.log(server.address());
});

wss.on('connection', (ws) => {
    const id = uuidv4();
    clients[id] = ws;
    console.log('Client connected with id:', id);
    ws.on('message', (message) => {
        console.log('received: %s', message);
        for (const key in clients) {
            clients[key].send(message);
        }
    });

    ws.on('close', () => {
        delete clients[id];
    });
});

// API to receive flight updates
const express = require('express');
const app = express();

app.use(express.json());

app.post('/update-flight', (req, res) => {
    const flightUpdate = req.body;
    console.log('Received flight update:', flightUpdate);

    for (const key in clients) {
        clients[key].send(JSON.stringify(flightUpdate));
    }

    res.status(200).send('Update sent to clients');
});

server.on('request', app);
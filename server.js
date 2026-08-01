const express = require('express');
const http = require('http');
const { PeerServer } = require('peer');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const PORT = 3000;

const server = http.createServer(app);

// PeerServer на том же сервере
const peerServer = PeerServer({
  server: server,
  path: '/myapp',
  allow_discovery: true
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PeerJS at /myapp`);
});
const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

let serverFriendRequests = [];
let serverFriends = {};
let peerIds = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/friend-requests/:userId', (req, res) => {
  const pending = serverFriendRequests.filter(r => r.to === req.params.userId && r.status === 'pending');
  res.json(pending);
});

app.post('/api/friend-request', (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  if (serverFriendRequests.find(r => r.from === from && r.to === to && r.status === 'pending'))
    return res.status(409).json({ error: 'Request already sent' });
  const newReq = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    from, to, status: 'pending', createdAt: new Date().toISOString()
  };
  serverFriendRequests.push(newReq);
  res.status(201).json(newReq);
});

app.post('/api/accept-request', (req, res) => {
  const { requestId, userId } = req.body;
  const idx = serverFriendRequests.findIndex(r => r.id === requestId && r.status === 'pending');
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const friendReq = serverFriendRequests[idx];
  friendReq.status = 'accepted';
  if (!serverFriends[friendReq.from]) serverFriends[friendReq.from] = [];
  if (!serverFriends[friendReq.to]) serverFriends[friendReq.to] = [];
  if (!serverFriends[friendReq.from].includes(friendReq.to)) serverFriends[friendReq.from].push(friendReq.to);
  if (!serverFriends[friendReq.to].includes(friendReq.from)) serverFriends[friendReq.to].push(friendReq.from);
  res.json({ success: true });
});

app.post('/api/reject-request', (req, res) => {
  const idx = serverFriendRequests.findIndex(r => r.id === req.body.requestId && r.status === 'pending');
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  serverFriendRequests.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/friends/:userId', (req, res) => {
  res.json(serverFriends[req.params.userId] || []);
});

app.post('/api/peerid', (req, res) => {
  const { userId, peerId } = req.body;
  if (!userId || !peerId) return res.status(400).json({ error: 'userId and peerId required' });
  peerIds[userId] = peerId;
  res.json({ success: true });
});

app.get('/api/peerid/:userId', (req, res) => {
  const peerId = peerIds[req.params.userId];
  if (!peerId) return res.status(404).json({ error: 'User not connected' });
  res.json({ peerId });
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
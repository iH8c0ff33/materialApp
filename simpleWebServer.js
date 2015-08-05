var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var db = require('sequelize');
var crypt = require('crypto');

var mydb = new db('mydb', 'Daniele', 'fuckinEvilBadC0ff33', {
  dialect: 'postgres'
});
var users = mydb.define('users', {
  username: {
    type: db.STRING(32)
  },
  chatName: {
    type: db.STRING(24)
  },
  password: {
    type: db.STRING(64)
  }
}, {
  freezeTableName: true
});

app.listen(3000, '192.168.43.224');

function handler (req, res) {
  if (req.url.slice(-1) === '/') {
    console.log('[HTTP] '+req.socket.remoteAddress+' |200| '+req.url+'index.html+');
    fs.readFile(__dirname+req.url+'index.html', function (err, data) {
      if (err) {
        console.log('[HTTP] '+req.socket.remoteAddress+' |404| '+req.url+'index.html+');
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h2>ERROR 404<br>NOT FOUND</h2><br><p>The requested file ("'+req.url+'index.html") was not found on this server</p>');
      } else {
        res.writeHead(200);
        res.end(data);
      }
    });
  } else {
    fs.readFile(__dirname+req.url, function (err, data) {
      if (err) {
        console.log('[HTTP] '+req.socket.remoteAddress+' |404| '+req.url);
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h2>ERROR 404<br>NOT FOUND</h2><br><p>The requested file ("'+req.url+'") was not found on this server</p>');
      } else {
        console.log('[HTTP] '+req.socket.remoteAddress+' |200| '+req.url);
        res.writeHead(200);
        res.end(data);
      }
    });
  }
}

var clients = {};

function parseCommand(command, author) {
  console.log('[CHAT] '+socket.client.conn.remoteAddress+' |COM| '+author+': '+command);
}

function emitMessage(name, message) {
  io.sockets.emit('message', {
    name: name,
    text: message
  });
}

io.on('connection', function (socket) {
  if (socket.client.conn.remoteAddress in clients) {
    console.log('[CHAT] '+socket.client.conn.remoteAddress+' |ACK| name: '+clients[socket.client.conn.remoteAddress].name);
    socket.emit('authentication', {
      name: clients[socket.client.conn.remoteAddress].name,
      authenticated: true
    });
    emitMessage(clients[socket.client.conn.remoteAddress].name, 'Has connected');
  } else {
    console.log('[CHAT] '+socket.client.conn.remoteAddress+' |ADD| name: Default Name');
    socket.emit('authentication', {
      name: 'Default Name',
      authenticated: true
    });
    clients[socket.client.conn.remoteAddress] = {
      name: 'Default Name'
    };
    emitMessage(clients[socket.client.conn.remoteAddress].name, 'Has connected');
  }
  socket.on('disconnect', function () {
    emitMessage(clients[socket.client.conn.remoteAddress].name, 'Disconnected');
  });
  socket.on('message', function (data) {
    if (data.text.slice(0, 1) === '/') {
      parseCommand(data.text.slice(1), clients[socket.client.conn.remoteAddress].name);
    } else {
      console.log('[CHAT] '+socket.client.conn.remoteAddress+' |MES| name: '+clients[socket.client.conn.remoteAddress].name);
      emitMessage(clients[socket.client.conn.remoteAddress].name, data.text);
    }
  });
  socket.on('namechange', function (data) {
    if (data.name !== clients[socket.client.conn.remoteAddress].name) {
      console.log('[CHAT] '+socket.client.conn.remoteAddress+' |CHG| name: '+data.name);
      emitMessage(clients[socket.client.conn.remoteAddress].name, 'Changed his name to '+data.name);
      clients[socket.client.conn.remoteAddress].name = data.name;
      socket.emit('toast', {
        duration: '3000',
        text: 'Name changed to '+data.name
      });
    }
  });
});

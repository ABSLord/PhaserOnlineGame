/**
 * Created by Antonio on 14.05.2017.
 */

var express = require('express')
    , app = express(app)
    , server = require('http').createServer(app);


// serve static files from the current directory
app.use(express.static(__dirname));

//get EurecaServer class
var EurecaServer = require('eureca.io').EurecaServer;

//create an instance of EurecaServer
var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState']});
var clients = {};

//attach eureca.io to our http server
eurecaServer.attach(server);

//detect client connection
eurecaServer.onConnect(function (conn) {
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);

    //the getClient method provide a proxy allowing us to call remote client functions
    var remote = eurecaServer.getClient(conn.id);

    //register the client
    clients[conn.id] = {id:conn.id, remote:remote};

    //here we call setId (defined in the client side)
    remote.setId(conn.id);
});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {
    console.log('Client disconnected ', conn.id);

    var removeId = clients[conn.id].id;

    delete clients[conn.id];

    for (var c in clients) {
        var remote = clients[c].remote;

        //here we call kill() method defined in the client side
        remote.kill(conn.id);
    }
});

eurecaServer.exports.handshake = function(x, y) {
    var conn = this.connection;
    clients[conn.id].x = x;
    clients[conn.id].y = y;
    for (var c in clients) {
        var remote = clients[c].remote;
        for (var cc in clients) {
            remote.spawnEnemy(clients[cc].id, clients[cc].x, clients[cc].y);
        }
    }
};
eurecaServer.exports.handleKeys = function (cursor) {
    console.log("handlekeys");
    var conn = this.connection;
    var updatedClient = clients[conn.id];

    for (var c in clients)
    {
        var remote = clients[c].remote;
        remote.updateState(updatedClient.id, cursor);

        //keep last known state so we can send it to new connected clients
        clients[c].laststate = cursor;
    }
};
server.listen(8000);
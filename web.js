// this is the remote server

var express = require("express");
var app = express();
var port = Number(process.env.PORT || 5000);

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("map");
});

// make the application listen to the port 
// we pass the ExpressJS server to Socket.io. In effect, our real time
// communication will still happen on the same port.
var io = require('socket.io').listen(app.listen(port, function() {
            console.log("Listening on " + port);
        }));

// Upon a successful connection, we send the complete list of plants for
// which we have the geographic coordinates, and register three handlers that
// will be used as receivers of client changes. The client will emit
// messages of type 'move', 'insert', 'delete'.
io.sockets.on('connection', function (socket) {
    socket.emit('collection', { message: '' });
    socket.on('move', function (data) {
        io.sockets.emit('move', data);
    });
    socket.on('insert', function (data) {
        io.sockets.emit('insert', data);
    });
    socket.on('delete', function (data) {
        io.sockets.emit('delete', data);
    });
});


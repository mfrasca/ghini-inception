// this is the remote server

var express = require("express");
var app = express();
var port = Number(process.env.PORT || 5000);

var fs = require('fs');

String.prototype.formatU = function() {
    var str = this.toString();
    if (!arguments.length)
        return str;
    var args = typeof arguments[0];
    args = (("string" == args || "number" == args) ? arguments : arguments[0]);
    for (var arg in args)
        str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
    return str;
};

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

    // initialize client's help menu
    fs.readFile("private/res/elements-help.txt", "binary", function(err, file) {
        if(err) {
            return;
        }
        var result = [];
        var i = 0;
        var arrayOfLines = file.split(/[\r\n]/);
        for(; i<arrayOfLines.length; i++) {
            var item = {};
            // header: 0:name, 1:anchor, 2:title, 3:icon
            var header = arrayOfLines[i].split(',');
            item.name = header[0];
            item.anchor = header[1];
            item.title = header[2];
            item.icon = header[3];

            // add the dialog box to the document body

            // read the content of the dialog box from the file.
            var content = [];
            for(i++; i<arrayOfLines.length; i++) {
                content.push(arrayOfLines[i]);
                if (arrayOfLines[i] === "")
                    break;
            }
            item.content = content.join("");
            result.push(item);
        }
        socket.emit('init-help', result);
    });

    // initialize client's toggle menu
    fs.readFile("private/res/elements-toggle.txt", "binary", function(err, file) {
        if(err) {
            return;
        }
        var result = [];
        var i = 0;
        var arrayOfLines = file.split(/[\r\n]/);
        for(; i<arrayOfLines.length; i++) {
            var group = {};
            var parts = arrayOfLines[i].split(",");
            group.layerName = parts[0];
            group.color = parts[1];
            group.icon = parts[2];
            var format = parts[3];
            group.items = [];
            for (i++; i < arrayOfLines.length; i++) {
                parts = arrayOfLines[i].split(",");
                if(parts.length === 1)
                    break;
                group.items.push({ lat: parseFloat(parts[0]), 
                                  lng: parseFloat(parts[1]),
                                  content: format.formatU(parts),
                                });
            }

            result.push(group);
        }
        socket.emit('init-toggle', result);
    });

    fs.readFile("private/res/some_trees.txt", "binary", function(err, file) {
        if(err) {
            return;
        }
        var collection = [];
        var arrayOfLines = file.match(/[^\r\n]+/g);
        for (var i = 0; i < arrayOfLines.length; i++) {
            var item = {};
            var parts = arrayOfLines[i].split(",");

            // title could be either accession or accession.plant,
            // depending on whether or not there are more than one plant
            // in that accesion.
            item.title = parts[0];
            var plantParts = item.title.split(".");
            plantParts.push("1");
            item.plant = "{0}.{1}.{2}".formatU(plantParts)
            item.accession = "{0}.{1}".formatU(plantParts);
            item.latlng = [parseFloat(parts[2]), parseFloat(parts[3])];
            item.zoom = parseInt(parts[1]);
            item.family = parts[4];
            item.genus = parts[5];
            item.species = parts[6];
            item.vernacular = parts[7];
            socket.emit('add-plant', item);
        }
    });

    socket.on('add-plant', function(data) {
        socket.broadcast.emit('add-plant', data);
    });

    socket.on('move', function (data) {
        // inform all other clients of the move.
        socket.broadcast.emit('move', data);
    });
    socket.on('insert', function (data) {
        io.sockets.emit('insert', data);
    });
    socket.on('delete', function (data) {
        io.sockets.emit('delete', data);
    });
});


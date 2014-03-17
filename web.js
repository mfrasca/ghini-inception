// this is the remote server

var express = require("express");
var app = express();
var port = Number(process.env.PORT || 5000);

var fs = require('fs');

var pg = require('pg');

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
    console.log(process.env.DATABASE_URL);
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


    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("SELECT a.code||'.'||p.code as plant,a.code AS accession, genus.genus, species.sp AS species, family.family, p.position_lon AS lng, p.position_lat AS lat, p.zoom FROM plant AS p, accession AS a, species, genus, family WHERE species.genus_id=genus.id AND genus.family_id=family.id AND p.accession_id=a.id AND a.species_id=species.id AND p.zoom IS NOT NULL ORDER BY a.code, p.code", 
                     function(err, result) {
                         done();
                         if(err)
                             return console.error(err);
                         for(var i=0; i<result.rows.length; i++)
                             socket.emit('add-plant', result.rows[i]);
                     });
    });

    socket.on('add-plant', function(data) {
        socket.broadcast.emit('add-plant', data);
    });

    socket.on('move', function (data) {
        // inform all other clients of the move.
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query("UPDATE plant SET position_lat={0}, position_lon={1} WHERE code='{3}' AND accession_id=(SELECT id FROM accession WHERE code='{2}')".formatU([data.lat, data.lng, data.accession, data.plant_short]),
                         function(err, result) {
                             done();
                             if(err)
                                 return console.error(err);
                         });
        });
        socket.broadcast.emit('move', data);
    });
    socket.on('insert', function (data) {
        io.sockets.emit('insert', data);
    });
    socket.on('delete', function (data) {
        io.sockets.emit('delete', data);
    });
});


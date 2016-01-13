// This file is part of ghini and ghini is part of bauble.
// http://github.com/mfrasca/ghini
// http://github.com/Bauble/bauble.classic
//
// bauble is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option)
// any later version.
//
// bauble is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
// details.
//
// You should have received a copy of the GNU General Public License along
// with bauble.  If not, see <http://www.gnu.org/licenses/>.
//
// this is the remote server

var config = require('./config');
var express = require("express");
var app = express();
var port = Number(process.env.PORT || config.port);
var dburl = process.env.DATABASE_URL || config.database_url;

var fs = require('fs');

var pgp = require('pg-promise')(/*options*/);
var db = pgp(dburl);

var client = new pgp.pg.Client(dburl);
client.connect();
client.query('LISTEN "watchers"');
client.on('notification', function(data) {
    console.log(data.payload);
});

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

app.set('views', __dirname + '/views');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("map");
    console.log(dburl);
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
                                  content: format.formatU(parts)
                                });
            }

            result.push(group);
        }
        socket.emit('init-toggle', result);
    });

    db.query("SELECT a.code||'.'||p.code as plant, a.code AS accession, g.genus, s.sp AS species, f.family, "+
             "p.position_lon AS lng, p.position_lat AS lat, p.zoom, coalesce(vn.name, '') as vernacular "+
             "FROM plant AS p, accession AS a, genus AS g, family AS f, "+
             "species AS s LEFT JOIN default_vernacular_name dvn ON dvn.species_id=s.id "+
             "LEFT JOIN vernacular_name vn ON vn.id=dvn.vernacular_name_id "+
             "WHERE s.genus_id=g.id AND g.family_id=f.id AND p.accession_id=a.id AND a.species_id=s.id "+
             "AND p.zoom IS NOT NULL ORDER BY a.code, p.code")
        .then(function(data) {
            for(var i=0; i<data.length; i++)
                socket.emit('add-plant', data[i]);
        })
        .catch(function(error) {
            return console.error(error);
        });

    socket.on('add-plant', function(data) {
        db.query("UPDATE plant "+
                 "SET position_lat=${lat}, position_lon=${lng}, zoom=${zoom} "+
                 "WHERE code=${plant_short} AND accession_id="+
                 "(SELECT id FROM accession WHERE code=${accession})",
                 data)
        .catch(function(error) {
            return console.error(error);
        });
        socket.broadcast.emit('add-plant', data);
    });

    socket.on('move', function (data) {
        // inform all other clients of the move.
        db.query("UPDATE plant SET position_lat=${lat}, position_lon=${lng} WHERE code=${plant_short} AND accession_id=(SELECT id FROM accession WHERE code=${accession})", data)
        .catch(function(error) {
            return console.error(error);
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


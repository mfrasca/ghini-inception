// this javascript element is part of bauble.classic
// http://github.com/mfrasca/bauble.classic

// bauble.classic is free software: you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 2 of the
// License, or (at your option) any later version.

// bauble.classic is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with bauble.classic.  If not, see
// <http://www.gnu.org/licenses/>.


//
// GLOBAL VARIABLES
var map = null;

// properties of 'listOf' are accessions, species, genera, familiae, and
// their values are the list of the matching markers.
var listOf = {};

// properties of 'taxonOf' are accessions and the associated value is
// the list of taxa at rank family, genus, species.
var taxonOf = {};

// the normal and highlighting icons...
var icon;

// all markers!!!
var markers = [];
// highlighted markers!
markers.highlighted = [];

// the layers on which we group plants, indexed by zoom level.
var plant_layer = [];

// layers of which we can toggle the visibility
var toggleLayer = {};

//
// GLOBAL FUNCTIONS

function openHighlightModal(e) {
    $('#highlightModal').modal('show');
    map.closePopup();
    computeHighlightOptions(e.target.options.accession);
}

function fireHighlightModal() {
    resetHighlightOptions();
    if(map._popup) {
        var accession = map._popup.options.marker.options.accession;
        $('#keyword').val(accession);
    }
    computeHighlightOptions($("#keyword").val());
    $('#highlightModal').modal('show');
    return false;
}

function resetHighlightOptions() {
    $("#highlightOptions").empty();
    while(markers.highlighted.length)
        markers.highlighted.pop().setIcon(icon.gray);
}

function computeHighlightOptions(name) {
    $("#keyword").val(name);
    resetHighlightOptions();
    if(name === "") {
        return;
    }
    var div = $('#highlightOptions');

    function addRadioButton(taxon, text) {
        var label = $('<label/>');
        div.append(label);
        var elem = $('<input/>',
                     { type: 'radio',
                       name: 'taxon',
                       value: taxon,
                     });
        label.append(elem);
        label.append(" " + text);
    }

    if (name in taxonOf) {
        addRadioButton(taxonOf[name].family, taxonOf[name].family);
        addRadioButton(taxonOf[name].genus, taxonOf[name].genus);
        addRadioButton(taxonOf[name].genus + " " + taxonOf[name].species, taxonOf[name].species);
        addRadioButton(name, name);
    }
}

function doHighlight() {
    var whatToHighlight = $("input[name=taxon]:checked").val();
    console.log(whatToHighlight);
    console.log(listOf[whatToHighlight]);
    for (var i = 0; i<listOf[whatToHighlight].length; i++) {
        var marker = listOf[whatToHighlight][i];
        marker.setIcon(icon.black);
        markers.highlighted.push(marker);
    }
}

var lastEvent;
function fireAddPlant(e) {
    lastEvent = e;
    $('#addendum').val("2014.0");
    $('#addPlantModal').modal('show');
    return false;
}

function doAddPlant() {
    var threshold = map.getZoom();
    var layer = plant_layer[threshold];
    if (layer === null)
        return;
    if ($('#addendum').val() === "")
        return;

    var plant = $('#addendum').val();
    var location = [lastEvent.latlng.lat, lastEvent.latlng.lng];
    var accession = "{0}.{1}".formatU(plant.split("."));

    // create a marker in the given location and add it to the map
    var marker = L.marker(location, { icon: icon.gray,
                                      draggable: 'true',
                                      accession: accession,
                                      plant: plant,
                                      title: plant,
                                      zoom: threshold,
                                    });
    marker.addTo(layer).bindPopup(plant, {marker: marker});
    marker.on('dragend', onDragend);
    markers.push(marker);

    addToDom(plant, threshold, location);
}

// add info about named plant to DOM (so we can easily copy it)
function addToDom(name, threshold, location) {
    // is it already there? (id contains dots, so we select carefully)
    var paragraph = $(document.getElementById(name));
    if (paragraph.length === 0) {
        paragraph = $('<p/>', { id: name });
        $('#accessions').append(paragraph);
    }
    paragraph.html(name + "," + threshold + "," + location);
}

function onDragend(event) {
    var marker = event.target;
    addToDom(marker.options.plant, marker.options.zoom, [marker.getLatLng().lat, marker.getLatLng().lng]);
}

function toggleLayerCheck(anchor, layerName) {
    var layer = toggleLayer[layerName];
    var check = anchor.childNodes[0];
    if(map.hasLayer(layer)) {
        map.removeLayer(layer);
        check.className = "icon-remove icon-black";
    } else {
        map.addLayer(layer);
        check.className = "icon-ok icon-black";
    }
}

// MIT-licensed code by Benjamin Becquet
// https://github.com/bbecquet/Leaflet.PolylineDecorator
L.RotatedMarker = L.Marker.extend({
    options: { angle: 0 },
    _setPos: function(pos) {
        L.Marker.prototype._setPos.call(this, pos);
        if (L.DomUtil.TRANSFORM) {
            // use the CSS transform rule if available
            this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
        } else if (L.Browser.ie) {
            // fallback for IE6, IE7, IE8
            var rad = this.options.angle * L.LatLng.DEG_TO_RAD,
            costheta = Math.cos(rad),
            sintheta = Math.sin(rad);
            this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
                costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
        }
    }
});

L.rotatedMarker = function(pos, options) {
    return new L.RotatedMarker(pos, options);
};
// MIT-licensed code - end

// read a file from the server (asynchronously)
function getFileFromServer(url, doneCallback) {
    var xhr;

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = handleStateChange;
    xhr.open("GET", url, true);
    xhr.send();

    function handleStateChange() {
        if (xhr.readyState === 4) {
            doneCallback(xhr.status == 200 ? xhr.responseText : null);
        }
    }
}

// set by zoomstart, examined by zoomend.
var previous_zoom = 0;

function onZoomstart() {
    // remember the previous zoom, so you know whether you're zooming
    // in, or out.
    previous_zoom = map.getZoom();
}

function onZoomend() {
    // are we zooming out?
    if (previous_zoom > map.getZoom()) {
        map.removeLayer(plant_layer[previous_zoom]);
    } else { // then we are zooming in!
        map.addLayer(plant_layer[map.getZoom()]);
    }
}

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

// to be called at document ready!
function init() {

    // ---------------------------
    // initialize global variables

    // create a map in the "map" div
    map = L.map('map');

    // create one layer for each zoom level
    for (var i = 0; i<24; i++) {
        plant_layer[i] = L.layerGroup();
    }

    icon = {
        'gray': L.icon({
            iconUrl: './res/bullet-lightgray.png',
            iconSize:     [16, 16], // size of the icon
            iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
            popupAnchor:  [0, -4] // point from which the popup should open relative to the iconAnchor
        }),
        'black': L.icon({
            iconUrl: './res/bullet-black.png',
            iconSize:     [16, 16], // size of the icon
            iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
            popupAnchor:  [0, -4] // point from which the popup should open relative to the iconAnchor
        }),
    };

    // add the scale control
    L.control.scale().addTo(map);

    // go to cuchubo garden
    map.setView([9.2348, -74.42276], 20);
    for (i=1; i<=map.getZoom(); i++)
        map.addLayer(plant_layer[i]);

    // create an OpenStreetMap tile layer
    L.tileLayer(
        // 'http://{s}.tile.osm.org/{z}/{x}/{y}.png', // osm server (most frequently updated)
        // 'http://a.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', // black & white
        // 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', // mapquest
        // 'http://cuchubo.wdfiles.com/local--files/tiles-{z}/{z}.{y}.{x}.png', // our tiles on wikidot
        'tiles-{z}/{z}.{y}.{x}.png', // local tiles on rune
        { attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Mario Frasca',
          minZoom: 19,
          maxZoom: 22,
        }).addTo(map);

    L.tileLayer(
        'http://{s}.tile.osm.org/{z}/{x}/{y}.png', // osm server (most frequently updated)
        // 'http://a.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', // black & white
        // 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', // mapquest
        // 'http://cuchubo.wdfiles.com/local--files/tiles-{z}/{z}.{y}.{x}.png', // our tiles on wikidot
        'tiles-{z}/{z}.{y}.{x}.png', // local tiles on rune
        { attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          minZoom: 12,
          maxZoom: 18,
        }).addTo(map);


    // associate callbacks to events
    map.on('contextmenu', fireAddPlant);
    map.on('zoomend', onZoomend);
    map.on('zoomstart', onZoomstart);
    $("#keyword").val("");
    $("#keyword").on('change', function(e){computeHighlightOptions($("#keyword").val());});
    $("#addendum").on('change', function(e){return false;});

    map.on('popupopen', function(e) {
        map._popup.options.minWidth = $('div.leaflet-popup-content img').width() + 10;
        map._popup.update();
        $('div.leaflet-popup-content img').onload = function() {
            map._popup.options.minWidth = $('div.leaflet-popup-content img').width() + 10;
            map._popup.update();
        };
        $('div.leaflet-popup-content a.thumbnail').click(function (e) {
            $('#showPhotoModal h3').html($(this).attr('title-text'));
            $('#showPhotoModal img').attr('src', $(this).attr('data-img-url'));
            $('#showPhotoModal').modal('show');
        });
        return false;
    });

    // read the elements that fall under the 'help' menu.
    getFileFromServer("./res/elements-help.txt", function(text) {
        if (text === null) {
            alert("an error while reading data");
        } else {
            var i = 0;
            var arrayOfLines = text.split(/[\r\n]/);
            for(; i<arrayOfLines.length; i++) {
                // header: 0:name, 1:anchor, 2:title, 3:icon
                var header = arrayOfLines[i].split(',');

                // add the dialog box to the document body
                var div = $("<div/>", { id: header[0] + "Modal",
                                        class: "modal hide fade",
                                        style: "display: none;",
                                      });
                $(document.body).append(div);
                var header_div = $('<div/>', { class: 'modal-header', });
                var body_div = $('<div/>', { class: 'modal-body', });
                div.append(header_div).append(body_div);

                header_div.append($('<a/>', { class: 'close', 'data-dismiss': 'modal'}).text('\&#x2715;'));
                header_div.append($('<h3/>').text(header[2]));

                // add the reference to the dialog box to the help menu.
                var list_item = $('<li/>');
                var anchor = $('<a/>', { onclick: "$('#" + header[0] + "Modal').modal('show'); return false;", href: "#", });
                var icon = $('<i/>', { class: "icon-" + header[3] + " icon-black" });
                $("#help-menu-list").append(list_item);
                list_item.append(anchor);
                anchor.append(icon);
                anchor.append(" ");
                anchor.append(header[1]);

                // read the content of the dialog box from the file.
                var content = [];
                for(i++; i<arrayOfLines.length; i++) {
                    content.push(arrayOfLines[i]);
                    if (arrayOfLines[i] === "")
                        break;
                }
    
                body_div.html(content.join(""));
            }
        }
    });

    // read the elements that can be toggled and that are to be presented
    // under the 'toggle' menu
    getFileFromServer("./res/elements-toggle.txt", function(text) {
        if (text === null) {
            alert("an error while reading data");
        } else {
            var arrayOfLines = text.split(/[\r\n]/);
            var i = 0;
            while(i < arrayOfLines.length) {
                var parts = arrayOfLines[i++].split(",");
                var layerName = parts[0];
                toggleLayer[layerName] = L.layerGroup();
                var layer = toggleLayer[layerName];

                var list_item = $('<li/>');
                $('#toggle-menu-list').append(list_item);
                var anchor = $('<a/>',
                               { href: '#',
                                 onclick: 'toggleLayerCheck(this, "' + layerName + '"); return false;',
                               });
                list_item.append(anchor);
                var icon_element = $('<i/>', { class: 'icon-remove icon-black' });
                anchor.append(icon_element);
                anchor.append(" " + layerName);

                var icon = L.AwesomeMarkers.icon({ color: parts[1], icon: parts[2] });
                var format = parts[3];

                for (i; i < arrayOfLines.length; i++) {
                    parts = arrayOfLines[i].split(",");
                    if (parts.length == 1)
                        break;
                    // image_name, title, lat, lon
                    var marker = L.marker([parseFloat(parts[0]), parseFloat(parts[1])],
                                          { icon: icon });
                    marker.addTo(layer).bindPopup(format.formatU(parts));
                }
                i++;
            }
        }
    });

    // read the data and create the markers
    getFileFromServer("./res/some_trees.txt", function(text) {
        if (text === null) {
            alert("An error occurred");
        }
        else {
            // `text` is the file text
            var arrayOfLines = text.match(/[^\r\n]+/g);
            for (var i = 0; i < arrayOfLines.length; i++) {
                var parts = arrayOfLines[i].split(",");
                var plant = parts[0];
                var accession = "{0}.{1}".formatU(plant.split("."));
                var zoom = parseInt(parts[1]);
                var marker = L.marker([parseFloat(parts[2]), parseFloat(parts[3])],
                                      { icon: icon.gray,
                                        draggable: 'true',
                                        accession: accession,
                                        plant: plant,
                                        title: plant,
                                        zoom: zoom,
                                      });
                markers.push(marker);
                var family = parts[4];
                var genus = parts[5];
                var species = parts[6];
                var vernacular = parts[7];
                marker.addTo(plant_layer[zoom]).bindPopup('<b>{0}</b><br/>{1}<br/><a target="wikipedia" href="http://en.wikipedia.org/wiki/{2}_{3}">{2}_{3} ({4})</a>'.formatU([plant, vernacular, genus, species, family]), {marker: marker});
                marker.on('dragend', onDragend);
                // marker.on('mouseover', function(e){e.target.openPopup();});
                marker.on('contextmenu', openHighlightModal);

                parts[0] = accession;
                if(!(accession in taxonOf) )
                    taxonOf[accession] = {};
                taxonOf[accession].family = family;
                taxonOf[accession].genus = genus;
                taxonOf[accession].species = species;
                parts[6] = parts[5] + " " + parts[6];
                for (var j = 0; j < 8; j++) {
                    if (!(parts[j] in listOf)) {
                        listOf[parts[j]] = [];
                    }
                    listOf[parts[j]].push(marker);
                    if (j === 0) j += 3;
                }
            }
        }
    });

}

ghini
=====

a web based interface to botanical garden databases

rationale
---------

ghini, the name is inspired to Luca Ghini, has the aim to offer a web-based
interface to a database complying to the ITF2 reccomendations.

the idea is born in august 2012, after Mario Frasca (mathematician) and
Saskia Bantjes (agronomist, environmentalist) get in contact with the
cuchubo garden in Mompox. the wish to describe it, the thankful words by the
president of the foundation named after the cuchubo garden, pushes the two
to seek formal help at the botanical garden of the utrecht university, where
they get support by the conservator Eric Gouda.

current plan
============

this program adds geographic awareness to bauble.classic

interaction between server and client is quite simple:

on startup, the client waits for the document to be ready, then informs the
server that it needs the coordinates of the plants. requests a 'refresh'.

on receiving a 'refresh' request, the server sends the requesting client the
complete list of plants with geographic coordinates.

clients may modify documents, on change they send the server the modified
document.

on any change in the database, the server broadcasts, to all clients, the
modified document. it may be a 'insert - document' or 'update - lookup -
document', where 'lookup' is a set of properties that uniquely identify a
document in the database.

future is unwritten, but check the issues page.

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

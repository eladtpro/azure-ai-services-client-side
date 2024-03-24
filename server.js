const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require("socket.io");
const { useAzureSocketIO } = require("@azure/web-pubsub-socket.io");

console.log(`PORT: ${process.env.PORT}`);

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.WEBSITE_HOSTNAME
const port = process.env.PORT
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url, true)
            const { pathname } = parsedUrl

            if (pathname === '/api/config') {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                    translateKey: process.env.TRANSLATE_KEY,
                    translateRegion: process.env.TRANSLATE_REGION,
                    translateEndpoint: process.env.TRANSLATE_ENDPOINT,
                    speechKey: process.env.SPEECH_KEY,
                    speechRegion: process.env.SPEECH_REGION,
                    languageKey: process.env.LANGUAGE_KEY,
                    languageRegion: process.env.LANGUAGE_REGION,
                    languageEndpoint: process.env.LANGUAGE_ENDPOINT,
                    socketEndpoint: process.env.SOCKET_ENDPOINT,
                    port
                }, null, 2));
            }
            else {
                await handle(req, res, parsedUrl)
            }
        } catch (err) {
            console.error('Error occurred handling', req.url, err)
            res.statusCode = 500
            res.end('internal server error')
        }
    })
        .once('error', (err) => {
            console.error(err)
            process.exit(1)
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`)
        })
})

// SOCKET.IO
let io = new Server(process.env.SOCKET_PORT);
let entries = [];

function validateEntry(entry) {
    const requiredProperties = ['type', 'timestamp', 'id'];
    return entry && requiredProperties.every(prop => entry.hasOwnProperty(prop));
}

// Use the following line to integrate with Web PubSub for Socket.IO
useAzureSocketIO(io, {
    hub: "Hub", // The hub name can be any valid string.
    connectionString: process.env.SOCKET_CONNECTION_STRING
});

function broadcast(entry) {
    io.emit('broadcast', entry);
}

function addEntry(entry) {
    if(!validateEntry(entry)) return;
    if (entries.findIndex((e) => e.id === entry.id) !== -1) return;
    console.log(entry);
    entries.push(entry);
    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    broadcast(entry)
}

// Emit welcome message on connection
io.on('connection', function (socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('connected', { message: `Socket connected with id:  ${socket.id}` });

    socket.on('message', addEntry);
    socket.on('sync', () =>
        socket.emit('sync', entries.map(entry => entry.toJSON())));
    socket.on('clear', () => entries = []);
    socket.on('disconnect', () => addEntry({ type: 'disconnect', timestamp: new Date().toISOString() }));
});

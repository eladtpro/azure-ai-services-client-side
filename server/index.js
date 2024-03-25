const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
require('./socket');

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
});
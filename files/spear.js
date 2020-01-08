/**
 * spear
 * a tiny, horribly inefficient web server, implemented in pure javascript
 * 
 * (c) Rin 2020
 */

const net = require('net')
const fs = require('fs')
const zlib = require('zlib')
const ini = require('./ini')
const config = ini.parse(fs.readFileSync('./config.ini').toString())
const methodPathRegex = /(GET|POST|PUT|DELETE|OPTIONS) (.+) HTTP\/1.1/

const TYPES_TO_DEFLATE = ['png', 'pdf']
const PLAIN_TEXT = ['html', 'txt', 'css', 'js']

const filesDir = fs.readdirSync('files')
const files = {}
for (let i of filesDir) {
	let name = /(.+)\.(.+)/.exec(i)
	let type = name[2]
	let file = fs.readFileSync('files/'+i)
	if (TYPES_TO_DEFLATE.includes(type)) {
		console.log(`deflating ${i}`)
		file = zlib.deflateSync(file)
	}
	files[i] = {content: file, type}
}

const CONTENT_TYPES = {
	'html': 'text/html',
	'png': 'image/png',
	'css': 'text/css',
	'js': 'text/javascript',
	'pdf': 'application/pdf'
}

const RESPONSE_PHRASES = {
	"404": "Not Found",
	"200": "OK",
	"500": "Internal Server Error",
    "621": "xd"
}

function makePromise(obj, evt) {
	return new Promise((res, rej) => {
		obj.on(evt, res)
	})
}

function makeHeader(code, headers) {
	var head = []
	for (let i in headers) {
		head.push(`${i}: ${headers[i]}`)
	}
	return `HTTP/1.0 ${code} ${RESPONSE_PHRASES[code]}\r\n${head.join('\r\n')}\r\n\r\n`
}

function makeResponse(code, headers, body) {
	let buf = Buffer.from(makeHeader(code, headers))
	return Buffer.concat([buf, body])
}

const server = net.createServer(s => {
	console.log('connection! client request follows.\n');
	makePromise(s, 'data').then(reqbuf => {
		var request = reqbuf.toString()
		var pathmatch = methodPathRegex.exec(request)
		if (!pathmatch) throw new Error('bad HTTP request!')
		var method = pathmatch[1]
		var path = pathmatch[2]
		if (path === '/error') throw new Error('induced by user')
		var fileGot = path.slice(1)
		if (!fileGot) fileGot = 'index.html'
		console.log(request)
		console.log('--- response ---')
		if (!files[fileGot]) {
			let response = makeResponse('404', {'Content-Type': 'text/plain'}, Buffer.from('not found'));
			console.log(response.toString())
			s.write(response)
			s.end()
			return
		}
		var response
		var headers = {"Content-Type": CONTENT_TYPES[files[fileGot].type]}
		if (TYPES_TO_DEFLATE.includes(files[fileGot].type)) {
			headers['Content-Encoding'] = 'deflate'
		}
		if (files[fileGot]) {
			response = makeResponse('200', headers, Buffer.from(files[fileGot].content));
		}
		console.log(makeHeader('200', headers)+'data redacted');
		s.write(response)
		s.end()
	}).catch(e => {
		console.log(e)
		var response = makeResponse('500', {'Content-Type': 'text/plain'}, e);
		console.log(response)
		s.write(response)
		s.end()
	})
})

console.log(config)

let host = config.server.str_host
let port = config.server.int_port

server.on('listening', () => console.log(`ready on http://${host}:${port}`))

server.listen({host, port})
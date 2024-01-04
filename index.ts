import cors from 'cors'
import express from 'express'
import path from 'path'
import { Server } from 'socket.io'

interface ServerToClientEvents {
	updateChat: (username: string, data: string) => void
	updateUsers: (usernames: string[]) => void
	serverNotification: (data: {
		username: string
		connected?: boolean
		toSelf?: boolean
	}) => void
}

interface ClientToServerEvents {
	sendChat: (data: string) => void
	addUser: (username: string) => void
}

interface SocketData {
	username: string
}

const app = express()
const server = require('http').Server(app)

const io = new Server<
	ClientToServerEvents,
	ServerToClientEvents,
	{},
	SocketData
>(server, {
	cors: {
		origin: 'http://localhost:3000',
	},
})

app.use(cors())
app.use('/public', express.static('public'))

app.get('/', function (_req, res) {
	res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const usernames = [] as string[]

io.sockets.on('connection', function (socket) {
	socket.on('sendChat', function (data) {
		io.sockets.emit('updateChat', socket.data.username, data)
	})

	socket.on('addUser', function (username) {
		socket.data.username = username

		usernames.push(username)

		socket.emit('serverNotification', {
			connected: true,
			toSelf: true,
			username: username,
		})

		socket.broadcast.emit('serverNotification', {
			connected: true,
			username: username,
		})

		io.sockets.emit('updateUsers', usernames)
	})

	socket.on('disconnect', function () {
		usernames.splice(usernames.indexOf(socket.data.username), 1)

		io.sockets.emit('updateUsers', usernames)

		socket.broadcast.emit('serverNotification', {
			username: socket.data.username,
		})
	})
})

server.listen(process.env.PORT || 3000, () =>
	console.log('listening on port 3000, http://localhost:3000')
)

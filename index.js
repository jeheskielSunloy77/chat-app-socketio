const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
	cors: {
		origin: 'http://localhost:3000',
	},
})
const usernames = {}

app.use(cors())
app.use('/public', express.static('public'))

app.get('/', function (_req, res) {
	res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

io.sockets.on('connection', function (socket) {
	socket.on('sendchat', function (data) {
		io.sockets.emit('updateChat', socket.username, data)
	})

	socket.on('addUser', function (username) {
		socket.username = username

		usernames[username] = username

		socket.emit('serverNotification', {
			connected: true,
			to_self: true,
			username: username,
		})

		socket.broadcast.emit('serverNotification', {
			connected: true,
			username: username,
		})

		io.sockets.emit('updateUsers', usernames)
	})

	socket.on('disconnect', function () {
		delete usernames[socket.username]

		io.sockets.emit('updateUsers', usernames)

		socket.broadcast.emit('serverNotification', { username: socket.username })
	})
})

http.listen(process.env.PORT || 3000, () =>
	console.log('listening on port 3000, http://localhost:3000')
)

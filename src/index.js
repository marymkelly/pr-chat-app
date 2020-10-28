const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
app.use(express.static(path.join(__dirname, '../public')))

let count = 0;
let message = 'Welcome!';

io.on('connection', (socket) => {
	console.log('New Websocket Connection!');

	socket.on('join', (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options })

		if(error) {
			return callback(error);
		}

		socket.join(user.room)

		socket.emit('message', generateMessage('admin', `Welcome ${user.username}`));
		socket.broadcast.to(user.room).emit('message',  generateMessage('admin', `${user.username} has joined!`));
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		})
		callback();
	})
	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit('message', generateMessage(user.username, message));
		callback('Message delivered');
	})

	socket.on('sendLocation', (pos, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://www.google.com/maps?q=${pos.lat},${pos.lng}`))
		callback('Location shared');
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if(user){
			io.to(user.room).emit('message', generateMessage('admin', `${user.username} has disconnected`));
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}
	})
})

app.get('/', (req, res) => {
	res.render('index', {title: 'Index'});
}) 

app.get('*', (req, res) => {
	res.redirect('/');
})

server.listen(port, () => {
	console.log('listening on: ', port);
})

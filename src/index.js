const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')
// const hbs = require('hbs')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// server (emit) --> client (receive) - Acknowledgement --> server
// client (emit) --> server (receive) - Acknowledgement --> client

io.on('connection', (socket) => {
    console.log('New socket connection')
    
    socket.on('join', (options, callback) => {

      const {error, user} = addUser({id: socket.id, ...options})

      if(error) {
        return callback(error)
      }

      socket.join(user.room)
      
      // socket.emit('message', generateMessage('Admin', `Welcome to ${user.room}!`))  
      socket.emit('message', generateMessage(`Bem-vindo a ${user.room}!`))  
      // socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined ${user.room}!`))
      socket.broadcast.to(user.room).emit('message', generateMessage( `${user.username} entrou em ${user.room}!`))

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })

      callback()
      
    })

    socket.on('sendmessage', (message, callback) => {
      const filter = new Filter()  
      const user = getUser(socket.id)
      
      if(filter.isProfane(message)) {
        return callback('Profanidade não é permitida!')
      }

      io.to(user.room).emit('message', generateMessage(user.username, message))
      
      callback()
    })

    socket.on('sendLocation', (coords, callback) => {
      const user = getUser(socket.id)

      if(!coords) {
        return callback('Localização inválida!')
      }
      
      io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.pt/maps?q=${coords.lat},${coords.lon}`))
      callback()
    })

    socket.on('disconnect', () => {
      const user = removeUser(socket.id)

      if(user) {
        // io.to(user.room).emit('message', generateMessage('Admin', `User ${user.username} has left ${user.room} !`))
        io.to(user.room).emit('message', generateMessage(`${user.username} saiu de ${user.room} !`))
      }

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })

    })
})


server.listen(port, () => {
  console.log(`Servidor ligado na porta: ${port}`)
})

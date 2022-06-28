const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { spawn } = require('child_process');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000/",
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
});

const sequence = ['red', 'green', 'orange', 'blue']
const messages = []
var peopleInRoom = {}

io.on("connection", (socket) => {
    
    var player = ''
    var room = ''

    console.log(`User Connected: ${socket.id}`);
  
    socket.on("join_room", (data) => {
        room = data
        if(peopleInRoom.room === undefined) {
            peopleInRoom = {
                ...peopleInRoom,
                room: 1
            }
            player = 1
        } else if(peopleInRoom.room === 1) {
            peopleInRoom = {
                ...peopleInRoom,
                room: 2
            }
            player = 2
        } else {
            peopleInRoom = {
                ...peopleInRoom,
                room: 3
            }
        }

        if(peopleInRoom.room <= 2) {
            console.log(peopleInRoom.room)
            socket.join(data);
            console.log('joined room: ', data)
            socket.emit("user_logged_in")
            socket.emit("people_in_room", peopleInRoom)
            socket.emit("data_game", (messages))
            socket.emit('what_player', (player))

            if(peopleInRoom.room === 2) {
                io.to(data).emit("people_joined")
            }
      } 
    });

    socket.on("result", (data) => {
        const python = spawn('python', ['maxi.py', data])
        const resResult = []

        python.stdout.on('data', async (res) => {
            console.log('nu körs python fil')
            dataForResponse = await res.toString()
            messages.push(dataForResponse)
            socket.to(room).emit("res_result", messages)
            console.log(messages)
        })
    
        python.on('close', (code) => {
            console.log('nu har python programmet kört klart', code)
        })

    })
});

httpServer.listen(8080, () => {
    console.log('server started')
});
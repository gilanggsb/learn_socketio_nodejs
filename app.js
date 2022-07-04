const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {

})




app.get('/', (req, res) => {
    res.sendFile('views/index.html', { root: __dirname })
})

let countUserOnline = 0;
io.on('connection', socket => {
    socket.on('join', param => {
        countUserOnline++;
        console.log(`user join ${param} user ${countUserOnline}`);
        io.emit('countUserOnline', countUserOnline);
    });

    socket.on('message', param => {
        console.log(`user mengirim pesan ${param}`);
        io.emit('receive_message', param);
    });

    socket.on('disconnect', param => {
        console.log(`user disconnect ${param}`);
        if (countUserOnline > -1) {
            countUserOnline--;
        }
        io.emit('countUserOnline', countUserOnline);
    });
})

server.listen(3000);
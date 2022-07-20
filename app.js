const historyData = require("./dummyJson");
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {});
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("CONNECT ON SOCKETIO");
  // res.sendFile('./views/index.html', { root: __dirname })
});

let countUserOnline = historyData.userOnline;
io.on("connection", (socket) => {
  socket.on("join_chat", (param) => {
    countUserOnline++;
    historyData.userOnline = countUserOnline;
    io.emit("lastAct", historyData);
  });

  socket.on("send_message", (param) => {
    historyData.data.chatData.push(param);
    console.log(`cek useronline on map ${historyData.userOnline}`);
    io.emit("receive_message", param);
  });

  socket.on("send_file", (param) => {
    historyData.data.chatData.push(param);
    io.emit("receive_file", param);
  });
  socket.on("request_unmute", (param) => {
    historyData.data.chatData.push(param);
    io.emit("receive_unmute", param);
  });

  socket.on("leave_chat", (param) => {
    if (countUserOnline > 0) {
      countUserOnline--;
    }
    console.log(`user disconnect ${countUserOnline}`);
    io.emit("countUserOnline", countUserOnline);
  });
});

server.listen(port, () => {
  console.log("App is running on port " + port);
});

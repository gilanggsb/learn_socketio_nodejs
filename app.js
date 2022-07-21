const historyData = require("./dummyJson");
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {});
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("CONNECT ON SOCKETIO");
});

let countUserOnline = historyData.userOnline;
io.on("connection", (socket) => {
  socket.on("join_chat", (param) => {
    countUserOnline++;
    historyData.userOnline = countUserOnline;
    io.emit("last_data", historyData);
  });

  socket.on("send_message", (param) => {
    historyData.data.chatData.push(param);
    io.emit("receive_message", param);
  });

  socket.on("send_file", (param) => {
    historyData.data.chatData.push(param);
    io.emit("receive_file", param);
  });

  socket.on("delete_chat", (param) => {
    const chatData = historyData.data.chatData;
    chatData.splice(chatData.length - param.deleteCount, param.deleteCount);
    io.emit("chat_deleted", param);
  });

  socket.on("request_call", (param) => {
    historyData.data.chatData.push(param);
    io.emit("receive_call", param);
  });

  socket.on("leave_chat", (param) => {
    if (countUserOnline > 0) {
      countUserOnline--;
    }
    historyData.userOnline = countUserOnline;
    io.emit("countUserOnline", countUserOnline);
  });
});

server.listen(port, () => {
  console.log("App is running on port " + port);
});

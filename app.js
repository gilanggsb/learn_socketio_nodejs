const { emit } = require("process");
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
  console.log(`ini socket ${socket.id}`);
  socket.on("joinRoom", (param) => {
    countUserOnline++;
    historyData.userOnline = countUserOnline;
    io.emit("getAllHistorical", historyData);
  });

  socket.on("chatMessage", (param) => {
    let message;
    historyData.data.chatData.map((chat) => {
      if (chat.chat_type == param.chat_type && chat.user_id == param.user_id) {
        message = chat;
        message.data.message = param.message;
        message.infoAssign = param.infoAssign;
        return;
      }
    });

    historyData.data.chatData.push(message);
    io.emit("message", message);
  });
  socket.on("callFunction", (param) => {
    let murid, guru;
    let result = [];
    historyData.data.chatData.map((chat) => {
      if (param.chat_type == 4 && chat.chat_type == 4) {
        murid = chat;
        murid.id_user = param.user_id;
        murid.counter = param.counter;
        murid.data.message = param.message;
        murid.infoAssign = param.infoAssign;
      }
      if (param.chat_type == 2 && chat.chat_type == 2) {
        guru = chat;
        guru.id_user = param.user_id;
        guru.counter = param.counter;
        guru.data.message = param.message;
        guru.infoAssign = param.infoAssign;
      }
    });
    historyData.data.chatData.push(murid, guru);
    result.push(murid, guru);
    io.emit("notif", result);
  });
  socket.on("delete_chat", (param) => {
    const chatData = historyData.data.chatData;
    chatData.splice(chatData.length - param.deleteCount, param.deleteCount);
    io.emit("chat_deleted", param);
  });

  socket.on("sendFile", (param) => {
    let resultFile;
    historyData.data.chatData.map((chat)=>{
      if(chat.chat_type === param.chat_type && chat.user_id == param.user_id){
        resultFile = chat;
        resultFile.data.url = param.url;
        resultFile.data.fileName = param.fileName;
        return;
      }
    });
    historyData.data.chatData.push(resultFile);
    io.emit("notif", resultFile);
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

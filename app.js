const { stat } = require("fs");
const { type } = require("os");
const { emit } = require("process");
const historyDatas = require("./dummyJson");
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {});
const port = process.env.PORT || 8080;
let historyData;

app.get("/", (req, res) => {
  res.send("CONNECT ON SOCKETIO");
});
historyData = cloneObject(historyDatas);
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
    for (var chat of historyData.data.chatData) {
      if (chat.user_id == param.user_id) {
        message = cloneObject(chat);
        message.user_role = param.user_role;
        message.data.message = param.message;
        message.infoAssign = param.infoAssign;
        message.chat_type = param.chat_type;
        break;
      }
    }
    historyData.data.chatData.push(message);
    io.emit("message", message);
  });
  socket.on("delete_chat", (param) => {
    const chatData = historyData.data.chatData;
    chatData.splice(chatData.length - param.deleteCount, param.deleteCount);
    io.emit("chat_deleted", param);
  });

  socket.on("callFunction", (param) => {
    let murid, guru;
    let result = [];
    for (const chat of historyData.data.chatData) {
      if (
        chat.user_id == param.infoAssign.id_user_student &&
        murid == undefined
      ) {
        murid = cloneObject(chat);
        murid.action.counter = param.counter;
        murid.data.message = param.message;
        murid.chat_type = 4;
        murid.infoAssign = param.infoAssign;
      }
      if (
        chat.user_id == param.infoAssign.id_user_teacher &&
        guru == undefined
      ) {
        guru = cloneObject(chat);
        guru.action.counter = param.counter;
        guru.data.message = param.message;
        guru.chat_type = 2;
        guru.infoAssign = param.infoAssign;
      }
      if (
        (murid != null && guru != null) ||
        (murid != undefined && guru != undefined)
      )
        break;
    }
    historyData.data.chatData.push(murid, guru);
    result.push(murid, guru);
    io.emit("notif", result);
  });

  socket.on("sendFile", (param) => {
    let resultFile;
    for (var chat of historyData.data.chatData) {
      if (chat.user_id === param.user_id) {
        resultFile = cloneObject(chat);
        resultFile.data.url = param.url;
        resultFile.chat_type = param.chat_type;
        resultFile.data.fileName = param.fileName;
        break;
      }
    }
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
  socket.on("reset_data", (param) => {
    console.log(
      `reset sebelum static data length ${historyDatas.data.chatData.length} history ${historyData.data.chatData.length}`
    );
    historyData = cloneObject(historyDatas);
    console.log(
      `reset sesudah static data length ${historyDatas.data.chatData.length} history ${historyData.data.chatData.length}`
    );
    // historyData.userOnline = countUserOnline;
    io.emit("response_reset", "sukses");
  });
});

function cloneObject(obj) {
  let temp = JSON.stringify(obj);
  return JSON.parse(temp);
}

server.listen(port, () => {
  console.log("App is running on port " + port);
});

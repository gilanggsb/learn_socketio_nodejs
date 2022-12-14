const { stat } = require("fs");
const { type } = require("os");
const { emit } = require("process");
const historyDatas = require("./dummyJson");
const requestDataPag = require("./dataPagination");
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {});
const port = process.env.PORT || 8080;
let historyData;

historyData = cloneObject(historyDatas);
let countUserOnline = historyData.userOnline;

app.get("/", (req, res) => {
  res.send("CONNECT ON SOCKETIO");
});
io.on("connection", (socket) => {
  console.log(`ini socket ${socket.id}`);
  socket.on("joinRoom", (param) => {
    countUserOnline++;
    historyData.userOnline = countUserOnline;
    io.emit("getAllHistorical", historyData);
  });
  socket.on("getPaginationData", (param) => {
    console.log(`getPaginationData ${JSON.stringify(param)}`);
    try {
      let resultData = [];
      let objReqPag;
      let limit = 0;
      validateData(param);
      limit = param.limit;
      if (param.limit == 0) {
        limit = historyData.data.chatData.length - param.offset;
      }
      for (let data of requestDataPag) {
        if (
          param.user_id == data.user_id &&
          param.chat_type == data.chat_type
        ) {
          data.offset = param.offset;
          data.limit = limit;
          objReqPag = data;
          break;
        }
      }
      if (objReqPag == undefined) {
        param.limit = limit;
        requestDataPag.push(createReqPag(param));
      }
      resultData = getDataPag(param.offset, limit);
      console.log(`cek lastData ${resultData.length}`);
      for (var [index, data] of resultData.entries()) {
        console.log(
          `idMessage ${data.id_message} data result : \n${data.data.message}\n`
        );
      }
      io.emit("onPaginationData", resultData);
    } catch (error) {
      console.log(`socketError ${error.message}`);
      io.emit("socketError", error);
    }
  });

  socket.on("chatMessage", (param) => {
    console.log(`ini chatMessage ${JSON.stringify(param)}`);
    try {
      validateData(param);
      let message;
      for (let chat of historyData.data.chatData) {
        if (chat.chat_type === 1) {
          message = createSocketObject(param, chat);
          break;
        }
      }
      historyData.data.chatData.push(message);
      io.emit("message", message);
    } catch (error) {
      console.log(`socket Error ${error}`);
      io.emit("socketError", error);
    }
  });
  socket.on("callFunction", (param) => {
    console.log(`ini callFunction ${JSON.stringify(param)}`);
    try {
      validateData(param);
      let murid, guru;
      let result = [];
      for (const chat of historyData.data.chatData) {
        if (chat.chat_type === 4 && murid == undefined) {
          murid = createSocketObject(param, chat);
          murid.chat_type = 4;
        }
        if (chat.chat_type === 2 && guru == undefined) {
          guru = createSocketObject(param, chat);
          guru.chat_type = 2;
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
    } catch (error) {
      console.log(`socket Error ${error}`);
      io.emit("socketError", error);
    }
  });

  socket.on("sendFile", (param) => {
    console.log(`ini sendFile ${JSON.stringify(param)}`);
    try {
      validateData(param);
      let resultFile;
      for (var chat of historyData.data.chatData) {
        if (chat.chat_type === 3) {
          resultFile = createSocketObject(param, chat);
          break;
        }
      }
      historyData.data.chatData.push(resultFile);
      io.emit("notif", resultFile);
    } catch (error) {
      console.log(`socket Error ${error}`);
      io.emit("socketError", error);
    }
  });

  socket.on("leave_chat", (param) => {
    console.log(`ini leave chat ${JSON.stringify(param)}`);
    if (countUserOnline > 0) {
      countUserOnline--;
    }
    historyData.userOnline = countUserOnline;
    io.emit("response_leave", historyData);
  });

  socket.on("delete_chat", (param) => {
    let result;
    const chatData = historyData.data.chatData;
    let diff = chatData.length - param.deleteCount;
    result = `Maaf, Sudah tidak bisa delete chat!!`;
    if (
      chatData.length > historyDatas.data.chatData.length &&
      diff >= historyDatas.data.chatData.length
    ) {
      result = { sebelumDelete: historyData.data.chatData.length };
      chatData.splice(chatData.length - param.deleteCount, param.deleteCount);
      result.sesudahDelete = historyData.data.chatData.length;
    }
    io.emit("response_deleted", result);
  });
  socket.on("reset_data", (param) => {
    let result = { sebelumReset: historyData.data.chatData.length };
    historyData = cloneObject(historyDatas);
    result.sesudahReset = historyData.data.chatData.length;
    io.emit("response_reset", result);
  });
});

function createReqPag(param) {
  return {
    user_id: param.user_id,
    user_name: param.user_name,
    chat_type: param.chat_type,
    offset: param.offset,
    limit: param.limit,
  };
}

function getDataPag(offset, limit) {
  const chatData = [...historyData.data.chatData];
  return chatData.slice(offset - 1, offset - 1 + limit);
}

function validateData(param) {
  if (param.user_id == null || param.user_id == undefined)
    throw "User ID tidak boleh Kosong!!!";
  if (param.user_name == null || param.user_name == undefined)
    throw "User Name tidak boleh Kosong!!!";
  if (param.chat_type == null || param.chat_type == undefined)
    throw "Chat Type tidak boleh Kosong!!!";
}

function createSocketObject(param, chat) {
  let tempObject = cloneObject(chat);
  let chatData = historyData.data.chatData;
  let lastIdMessage = chatData[chatData.length - 1].id_message;
  tempObject.id_message = lastIdMessage + 1;
  tempObject.timestamp = new Date().toISOString();

  if (chat.chat_type === param.chat_type) {
    tempObject.user_id = param.user_id;
    tempObject.user_name = param.user_name;
    tempObject.user_role = param.user_role;
  }
  if (
    param.user_id_zoom != null &&
    param.user_id_zoom != undefined &&
    chat.chat_type === param.chat_type
  )
    tempObject.user_id_zoom = param.user_id_zoom;
  if (param.avatar != null && param.avatar != undefined)
    tempObject.avatar = param.avatar;
  if (param.message != null && param.message != undefined)
    tempObject.data.message = param.message;
  if (param.url != null && param.url != undefined)
    tempObject.data.url = param.url;
  if (param.fileName != null && param.fileName != undefined)
    tempObject.data.fileName = param.fileName;
  if (param.counter != null && param.counter != undefined)
    tempObject.action.counter = param.counter;
  if (param.desc != null && param.desc != undefined)
    tempObject.action.desc = param.desc;
  if (param.infoAssign != null && param.infoAssign != undefined)
    tempObject.infoAssign = param.infoAssign;
  if (param.status != null && param.status != undefined)
    tempObject.status = param.status;
  return tempObject;
}

function cloneObject(obj) {
  let temp = JSON.stringify(obj);
  return JSON.parse(temp);
}

server.listen(port, () => {
  console.log("App is running on port " + port);
});

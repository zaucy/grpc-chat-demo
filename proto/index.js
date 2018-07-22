const chat_grpc_pb = require("./dist/node/chat_grpc_pb");
const chat_pb = require("./dist/node/chat_pb");

module.exports = Object.assign({}, chat_grpc_pb, chat_pb);

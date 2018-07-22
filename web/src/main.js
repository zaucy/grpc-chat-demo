require("./styles.scss");

const grpc = require("@grpc-gen/grpc-web");

const {
  ChatClient,
  JoinChannelRequest,
  LoginRequest,
} = require("@grpc-chat-demo/proto/web");

const client = new ChatClient(location.origin);
window.client = client;

const inputForm = document.querySelector('#input-form');
const inputEl = document.querySelector('#input');
const buttonEl = document.querySelector("#submit-btn");
const messagesEl = document.querySelector('#messages');

let username = "";
let channel = "";

function writeMessage(author, message) {
  let msgEl = document.createElement("div");
  let msgContentEl = document.createElement("div");
  let authorEl = document.createElement("div");

  msgEl.classList.add("msg-wrap");
  authorEl.classList.add("author");
  msgContentEl.classList.add("msg");

  authorEl.textContent = author;
  msgContentEl.textContent = message;
  msgEl.appendChild(authorEl);
  msgEl.appendChild(msgContentEl);
  messagesEl.insertBefore(msgEl, messagesEl.firstElementChild);
}

function handleHelp() {
  writeMessage('[SYSTEM]', [
    '/login <username>',
    '/join <channel>',
  ].join('\n'));
}

function handleLogin(arg0) {
  username = arg0;

  const request = new LoginRequest();

  request.setUsername(username);

  const stream = client.login(request, {}, (err, response) => {
    if(err) {
      writeMessage('[ERROR]', err.message);
    } else {
      writeMessage('[SYSTEM]', "Logged in as " + username);
    }
  });
}

function handleJoin(arg0) {
  channel = arg0;

  const request = new JoinChannelRequest();
  request.setChannelName(channel);

  const stream = client.joinChannel(request);

  stream.on('status', (status) => {
    writeMessage('[SYSTEM]', 'status ' + status);
  });

  stream.on('data', msg => {
    writeMessage(msg.getAuthor(), msg.getText());
  });

  stream.on('error', (err) => {
    writeMessage('[ERROR]', err.message);
  });

  stream.on('end', () => {
    writeMessage('[SYSTEM]', 'Channel stream end');
  });

  console.log('stream:', stream);
  window.currentStream = stream;
}

function handleCommand(command, args) {
  switch(command) {
    case 'help':
      return handleHelp();
    case 'login':
      if(args.length !== 1) {
        writeMessage('[SYSTEM]', 'usage: /login <username>');
        return;
      }
      return handleLogin(args[0]);
    case 'join':
      if(args.length !== 1) {
        writeMessage('[SYSTEM]', 'usage: /join <channel>');
        return;
      }
      return handleJoin(args[0]);
    case 'shrug':
      return writeMessage(username, `¯\\_(ツ)_/¯`);
    default:
      writeMessage('[SYSTEM]', `Unknown command '${command}'`);
  }
}

inputForm.onsubmit = (e) => {
  e.preventDefault();

  const value = inputEl.value;

  if(value[0] === '/') {
    let args = value.substr(1).split(/\s+/g);
    args = args.filter(arg => !!arg);
    args = args.map(arg => arg.trim());

    let command = args[0];
    args.splice(0, 1);
    handleCommand(command, args);
  } else {
    writeMessage(username, inputEl.value);
  }

  inputEl.value = "";
};

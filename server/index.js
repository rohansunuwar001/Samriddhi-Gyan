// server/index.js

import app from "./app.js";
import { ServerApp } from "./core/server.app.js";
import { io, userSocketMap } from "./utils/socket.js";

export { io, userSocketMap };

const PORT = process.env.PORT || 10000;
const serverApp = new ServerApp(app, PORT);

serverApp.start();
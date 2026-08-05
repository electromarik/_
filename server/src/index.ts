import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { registerSocketHandlers } from "./socket/index.js";
import { setIo } from "./socket/io.js";

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.clientOrigin, credentials: true },
});

setIo(io);
registerSocketHandlers(io);

httpServer.listen(env.port, () => {
  console.log(`Messenger server listening on http://localhost:${env.port}`);
});

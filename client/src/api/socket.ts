import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./client";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket) {
    socket.disconnect();
  }
  socket = io(API_BASE_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

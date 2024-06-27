import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"], // Change this to your frontend's origin
        methods: ["GET", "POST"],
    },
});

const userSocketMap = {}; // {userId: socketId}
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId != "undefined") userSocketMap[userId] = socket.id;

    // io.emit() is used to send events to all the connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // socket.on() is used to listen to the events. can be used both on client and server side
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    // Handle incoming messages
    socket.on("sendMessage", (messageData) => {
        const { senderId, receiverId, message } = messageData;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", messageData);
        }
    });

    socket.on("typing", ({ userId, conversationId, isTyping }) => {
        socket.to(conversationId).emit("typing", { userId, isTyping });
    });
});

export { app, io, server };

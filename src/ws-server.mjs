import { WebSocketServer } from 'ws'; 
import { createRoom, joinRoom, getPlayers, getRoom, removePlayer } from './rooms.mjs'; // Import named exports

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "createRoom") {
      const { roomCode, playerId } = createRoom(data.playerName);
      console.log(`Room ${roomCode} created`);

      ws.roomCode = roomCode;
      ws.playerId = playerId;

      ws.send(
        JSON.stringify({
          type: "roomCreated",
          roomCode: roomCode,
          playerId: playerId,
        })
      );

      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && client.roomCode === roomCode) {
          client.send(
            JSON.stringify({
              type: "playerList",
              roomCode,
              players: getPlayers(roomCode),
            })
          );
        }
      });
    }

    if (data.type === "join") {
      const { roomCode, playerName } = data;
      const playerId = joinRoom(roomCode, playerName);

      if (playerId) {
        ws.roomCode = roomCode;
        ws.playerId = playerId;

        ws.send(
          JSON.stringify({
            type: "playerId",
            playerId,
          })
        );

        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN && client.roomCode === roomCode) {
            client.send(
              JSON.stringify({
                type: "playerList",
                roomCode,
                players: getPlayers(roomCode),
              })
            );
          }
        });
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Room not found",
          })
        );
      }
    }

    if (data.type === "updateName") {
      const { roomCode, playerId, newName } = data;
      const room = getRoom(roomCode);
      if (room) {
        const player = room.players.find((p) => p.id === playerId);
        if (player) {
          player.name = newName;

          wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN && client.roomCode === roomCode) {
              client.send(
                JSON.stringify({
                  type: "playerList",
                  roomCode,
                  players: getPlayers(roomCode),
                })
              );
            }
          });
        }
      }
    }

    if (data.type === "ready") {
      const { roomCode, playerId } = data;
      const room = getRoom(roomCode);
      if (room) {
        const player = room.players.find((p) => p.id === playerId);
        if (player) {
          player.ready = !player.ready;
          wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN && client.roomCode === roomCode) {
              client.send(
                JSON.stringify({
                  type: "playerList",
                  roomCode,
                  players: getPlayers(roomCode),
                })
              );
            }
          });
        }
      }
    }

  });

  ws.on("close", () => {
    console.log("Client disconnected");

    const { roomCode, playerId } = ws;
    if (roomCode && playerId) {
      removePlayer(roomCode, playerId);

      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && client.roomCode === roomCode) {
          client.send(
            JSON.stringify({
              type: "playerList",
              roomCode,
              players: getPlayers(roomCode),
            })
          );
        }
      });
    }
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
import { nanoid } from "nanoid";

let rooms = {};

export function createRoom(playerName) {
  const roomCode = nanoid(6);
  const playerId = nanoid(12);
  const player = { id: playerId, name: playerName, ready: false};

  rooms[roomCode] = { players: [player] };

  return { roomCode, playerId };
}

export function joinRoom(roomCode, playerName) {
  if (rooms[roomCode]) {
    const playerId = nanoid(12);
    const player = { id: playerId, name: playerName, ready: false };
    rooms[roomCode].players.push(player);

    return playerId;
  }
  return null;
}

export function getPlayers(roomCode) {
  return rooms[roomCode]?.players || [];
}

export function getRoom(roomCode) {
  return rooms[roomCode] || null;
}

export function removePlayer(roomCode, playerId) {
  if (rooms[roomCode]) {
    rooms[roomCode].players = rooms[roomCode].players.filter(
      (player) => player.id !== playerId,
    );
  }
}
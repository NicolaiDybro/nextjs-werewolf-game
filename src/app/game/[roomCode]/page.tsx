"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function GamePage({ params }: { params: { roomCode: string } }) {
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [playerName, setPlayerName] = useState("PlayerName"); // Replace with actual player name
  const [playerId, setPlayerId] = useState<string | null>(null);
  const { roomCode } = params;
  const socket = useRef<WebSocket | null>(null);
  const messageQueue = useRef<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!socket.current) {
      socket.current = new WebSocket("ws://localhost:8080");

      socket.current.onopen = () => {
        console.log("Connected to WebSocket");

        // Send queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();
          socket.current?.send(message);
        }

        // Send message that the player has joined
        socket.current?.send(
          JSON.stringify({
            type: "join",
            roomCode,
            playerName,
          })
        );
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        if (data.type === "playerList" && data.roomCode === roomCode) {
          setPlayers(data.players);
        }
        if (data.type === "playerId") {
          setPlayerId(data.playerId);
        }
      };

      socket.current.onclose = () => {
        console.log("Disconnected from WebSocket");
      };
    }

    // When the player leaves, send a message to the server
    return () => {
      if (socket.current && playerId) {
        const leaveMessage = JSON.stringify({
          type: "leave",
          roomCode,
          playerId,
        });
        if (socket.current.readyState === WebSocket.OPEN) {
          socket.current.send(leaveMessage);
        } else {
          messageQueue.current.push(leaveMessage);
        }
        socket.current.close(); // Close WebSocket connection
        socket.current = null; // Reset the socket reference
      }
    };
  }, [roomCode]);

  const sendMessage = (message: any) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(message);
    } else {
      messageQueue.current.push(message);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    if (playerId) {
      const message = JSON.stringify({
        type: "updateName",
        roomCode,
        playerId,
        newName,
      });
      sendMessage(message);
    }
  };

  const handleLeaveRoom = () => {
    if (socket.current && playerId) {
      const leaveMessage = JSON.stringify({
        type: "leave",
        roomCode,
        playerId,
      });
      if (socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(leaveMessage);
      } else {
        messageQueue.current.push(leaveMessage);
      }
      socket.current.close(); // Close WebSocket connection
      socket.current = null; // Reset the socket reference
    }
    router.push("/"); // Navigate to the index page
  };

  return (
    <div className="grid h-screen place-items-center">
      <main className="flex flex-col gap-8 items-center justify-center text-white">
        <h1 className="text-4xl font-bold">Room Code: {roomCode}</h1>

        <div className="flex m-2 space-x-4 items-center">
        <h3 className="">Dit navn:</h3>
        <input
          type="text"
          value={playerName}
          onChange={handleNameChange}
          className="border rounded text-black p-2"
        />
      </div>


        <h2 className="text-2xl">Players in the Game:</h2>
        <ul className="list-disc pl-8 text-lg">
        <ul className="list-disc pl-8 text-lg">
          {players.map((player) => (
            player.id === playerId ? (
              <li
                key={player.id}
                className="text-lg text-yellow-300"
              >
                {player.name} (You)
              </li>
            ) : (
              <li
                key={player.id}
                className="text-lg"
              >
                {player.name}
              </li>
              
            )
          ))}
        </ul>
        </ul>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          onClick={handleLeaveRoom}
        >
          LEAVE ROOM
        </button>
      </main>
    </div>
  );
}
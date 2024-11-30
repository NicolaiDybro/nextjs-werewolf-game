"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Loading from "@/app/loading";
import { Check, X } from "lucide-react";

export default function GamePage({ params }: { params: { roomCode: string } }) {
  const [players, setPlayers] = useState<{ ready: any; id: string; name: string }[]>([]);
  const [playerName, setPlayerName] = useState("PlayerName"); // Replace with actual player name
  const [playerId, setPlayerId] = useState<string | null>(null);
  const { roomCode } = params;
  const [loading, setLoading] = useState(true);
  const socket = useRef<WebSocket | null>(null);
  const messageQueue = useRef<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem("playerId");
    const storedRoomCode = sessionStorage.getItem("roomCode");

    if (storedPlayerId && storedRoomCode === roomCode) {
      setPlayerId(storedPlayerId);
    } else {
      sessionStorage.removeItem("playerId");
      sessionStorage.removeItem("roomCode");
    }

    if (!socket.current) {
      socket.current = new WebSocket("ws://localhost:8080");

      socket.current.onopen = () => {
        console.log("Connected to WebSocket");
        setLoading(false);

        // Send queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();
          socket.current?.send(message);
        }

        if (!storedPlayerId || storedRoomCode !== roomCode) {
          socket.current?.send(
            JSON.stringify({
              type: "join",
              roomCode,
              playerName,
            })
          );
        }
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        if (data.type === "error") {
          router.push("/");
        }
        if (data.type === "playerList" && data.roomCode === roomCode) {
          setPlayers(data.players);
        }
        if (data.type === "playerId") {
          setPlayerId(data.playerId);
        }
      };

      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Error",
          description: "Failed to connect to WebSocket. Redirecting to home.",
        });
        router.push("/");
      };

      socket.current.onclose = () => {
        router.push("/");
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

  const toggleReadyStatus = () => {
    if (socket.current && playerId) {
      const readyMessage = JSON.stringify({
        type: "ready",
        roomCode,
        playerId,
      });
      sendMessage(readyMessage);
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      toast({
        title: "Success",
        description: "Room code copied to clipboard",
      });
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  };

  if (loading) {
    return <Loading />;
  }

  const currentPlayer = players.find(player => player.id === playerId);

  return (
    <div className="grid h-screen place-items-center">
              <div className="relative w-96 h-96 flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full"></div>
          {players.map((player, index) => {
            const angle = (index / players.length) * 360;
            const x = Math.cos((angle * Math.PI) / 180) * 150;
            const y = Math.sin((angle * Math.PI) / 180) * 150;
            return (
              <div
                key={player.id}
                className="absolute flex flex-col items-center"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    player.id === playerId ? "bg-yellow-300" : "bg-gray-300"
                  }`}
                >
                  {player.ready ? (
                    <Check className="text-green-500" />
                  ) : (
                    <X className="text-red-500" />
                  )}
                </div>
                <span className="mt-2 text-center">{player.name}</span>
              </div>
            );
          })}
        </div>
      <main className="flex flex-col gap-8 items-center justify-center text-white">
        <h1 className="text-4xl font-bold flex items-center">
          <button onClick={handleLeaveRoom} className="text-white">
            <ArrowLeftEndOnRectangleIcon className="w-8 mr-4" />
          </button>
          Room Code:
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleCopyRoomCode}>{roomCode}</button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-4 text-indigo-foreground rounded font-bold">
                <p>Click to copy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h1>

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


        <button
          className={`${
            currentPlayer?.ready
              ? "bg-red-500 hover:bg-red-700"
              : "bg-green-500 hover:bg-green-700"
          } text-white font-bold py-2 px-4 rounded transition duration-300`}
          onClick={toggleReadyStatus}
        >
          {currentPlayer?.ready ? "CANCEL" : "READY"}
        </button>
      </main>
    </div>
  );
}
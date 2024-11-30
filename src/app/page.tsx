"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const { toast } = useToast()
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!socket.current) {
      socket.current = new WebSocket("ws://localhost:8080");

      socket.current.onopen = () => {
        console.log("Connected to WebSocket");
      };

      socket.current.onclose = () => {
        console.log("WebSocket connection closed");
      };

      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Error",
          description: "An error occurred while connecting to the server.",
        })
      };

      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.type === "roomCreated") {
          // Navigate to the game
          router.push(`/game/${data.roomCode}`);
        } else if (data.type === "playerId") {
          // Handle playerId message
          console.log("Player ID:", data.playerId);
        } else if (data.type === "playerList") {
          // Handle playerList message
          console.log("Player List:", data.players);
        } else {
          console.error("Error creating room:", data.message);
        }
      };
    }

    return () => {
      socket.current?.close();
    };
  }, [router]);

  function createRoom() {
    if (socket.current) {
      if (socket.current.readyState === WebSocket.OPEN) {
        try {
          socket.current.send(
            JSON.stringify({ type: "createRoom", name: "PlayerName" })
          );
        } catch (e) {
          toast({
            title: "Error",
            description: "Failed to send create room request.",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "The service is not open. Contact support.",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "The service is not available. Contact support.",
      });
    }
  }

  function joinRoom() {
    if (roomCode === "") {
      toast({
        title: "Error",
        description: "Please enter a room code.",
      });
      return;
    }
    router.push(`/game/${roomCode}`);

  }
  return (
    <div className="relative grid h-screen place-items-center">
      <div className="absolute inset-0 bg-cover bg-center bg-[url('/background.webp')] before:absolute before:inset-0 before:bg-black before:opacity-50"></div>
      <main className="relative flex flex-col gap-8 items-center justify-center text-white">
        <h1 className="text-6xl font-extrabold">WEREWOLF GAME</h1>
        <div className="flex m-4 gap-8">
          <Button variant={"green"} onClick={createRoom}>CREATE ROOM</Button>
          <Dialog>
            <DialogTrigger className="p-1 px-4 transition-all ease-in bg-blue-500 text-white shadow hover:bg-blue-500/80 rounded font-bold text-1xl">JOIN ROOM</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a game</DialogTitle>
                <DialogDescription>
                  Enter the room code to join a game.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Room Code"
                  className="border rounded text-black p-2"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
                <Button variant={"blue"} onClick={joinRoom}>Join</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
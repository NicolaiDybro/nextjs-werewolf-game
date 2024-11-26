"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
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
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
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
          alert("Failed to create room. Please try again.");
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
  return (
    <div className="grid h-screen place-items-center">
      <main className="flex flex-col gap-8 items-center justify-center text-white">
        <h1 className="text-6xl font-extrabold">WEREWOLF GAME</h1>
        <div className="flex m-4 gap-8">
        <Button variant={"green"} onClick={createRoom}>CREATE ROOM</Button>
          <Button variant={"blue"}>JOIN ROOM</Button>
        </div>
      </main>
    </div>
  );
}
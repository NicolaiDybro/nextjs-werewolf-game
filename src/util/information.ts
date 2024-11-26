interface Player {
  id: string;
  name: string;
}

interface Room {
  players: Player[];
}

export type { Player, Room };

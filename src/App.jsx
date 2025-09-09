import { useState, useEffect } from "react";
import io from "socket.io-client";

// 🔴 ZMIEŃ na swój backend z Render
const BACKEND_URL = "https://spy-game-server-sewf.onrender.com";
const socket = io(BACKEND_URL);

export default function App() {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [role, setRole] = useState(null);
  const [location, setLocation] = useState("");
  const [players, setPlayers] = useState({});
  const [isMaster, setIsMaster] = useState(false);

  const createGame = async () => {
    const res = await fetch(`${BACKEND_URL}/create`);
    const data = await res.json();
    setGameId(data.gameId);
    setIsMaster(true);
  };

  const joinGame = () => {
    socket.emit("joinGame", { gameId, name: playerName });
    setJoined(true);
  };

  const startGame = () => {
    socket.emit("startGame", { gameId, location });
  };

  useEffect(() => {
    socket.on("role", (data) => {
      setRole(data.role);
      if (data.location) setLocation(data.location);
    });

    socket.on("playersUpdate", (data) => {
      setPlayers(data);
    });

    return () => {
      socket.off("role");
      socket.off("playersUpdate");
    };
  }, []);

  if (!joined && !isMaster) {
    return (
      <div className="p-4 flex flex-col gap-2 max-w-sm mx-auto">
        <button
          onClick={createGame}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Stwórz grę
        </button>
        <input
          placeholder="Podaj kod gry"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          placeholder="Twoje imię"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={joinGame}
          className="p-2 bg-green-500 text-white rounded"
        >
          Dołącz do gry
        </button>
      </div>
    );
  }

  if (isMaster) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold">Kod gry: {gameId}</h1>
        <p>Udostępnij go graczom.</p>
        <h2 className="mt-4 font-bold">Gracze:</h2>
        <ul className="list-disc pl-6">
          {Object.values(players).map((p, i) => (
            <li key={i}>{p.name}</li>
          ))}
        </ul>
        <input
          placeholder="Wpisz lokalizację"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="p-2 border rounded mt-2 w-full"
        />
        <button
          onClick={startGame}
          className="p-2 bg-red-500 text-white rounded mt-2 w-full"
        >
          Rozpocznij grę
        </button>
      </div>
    );
  }

  if (role) {
    return (
      <div className="flex items-center justify-center h-screen">
        {role === "spy" ? (
          <h1 className="text-4xl font-bold text-red-600">SZPIEG</h1>
        ) : (
          <h1 className="text-3xl font-bold">Lokalizacja: {location}</h1>
        )}
      </div>
    );
  }

  return <p className="p-4">Czekasz na rozpoczęcie gry...</p>;
}
import { useState, useEffect } from "react";
import { db, ref, set, update, onValue } from "./firebase";
import { nanoid } from "nanoid";

export default function App() {
  const [gameId, setGameId] = useState("");
  const [playerId] = useState(() => nanoid(8));
  const [name, setName] = useState("");
  const [game, setGame] = useState(null);
  const [role, setRole] = useState(null);

  // 🔹 Tworzenie gry
  const createGame = async (location) => {
    const id = nanoid(6);
    await set(ref(db, "games/" + id), {
      location,
      players: {},
      status: "waiting"
    });
    setGameId(id);
  };

  // 🔹 Dołączanie gracza
  const joinGame = async (id, playerName) => {
    setGameId(id);
    await update(ref(db, `games/${id}/players/${playerId}`), {
      name: playerName,
      role: null
    });
  };

  // 🔹 Rozpoczęcie gry
  const startGame = async () => {
    if (!game) return;
    const ids = Object.keys(game.players || {});
    const spyIndex = Math.floor(Math.random() * ids.length);

    ids.forEach((id, index) => {
      update(ref(db, `games/${gameId}/players/${id}`), {
        role: index === spyIndex ? "spy" : "player"
      });
    });

    await update(ref(db, "games/" + gameId), { status: "in-progress" });
  };

  // 🔹 Nasłuchiwanie zmian w grze
  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = onValue(ref(db, "games/" + gameId), (snapshot) => {
      const data = snapshot.val();
      setGame(data);
      if (data?.players?.[playerId]?.role) {
        setRole(data.players[playerId].role);
      }
    });
    return () => unsubscribe();
  }, [gameId, playerId]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎭 Szpieg</h1>

      {!gameId && (
        <div className="space-y-2">
          <input
            className="border p-2 w-full"
            placeholder="Twoje imię"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="bg-green-500 text-white p-2 rounded w-full"
            onClick={() => createGame("Sala operacyjna")}
          >
            ➕ Stwórz nową grę
          </button>
          <button
            className="bg-blue-500 text-white p-2 rounded w-full"
            onClick={() => {
              const id = prompt("Podaj ID gry:");
              if (id && name) joinGame(id, name);
            }}
          >
            🔗 Dołącz do gry
          </button>
        </div>
      )}

      {game && (
        <div className="mt-4 space-y-2">
          <p>
            <b>ID gry:</b> {gameId}
          </p>
          <h2 className="text-xl">👥 Gracze:</h2>
          <ul className="list-disc list-inside">
            {Object.values(game.players || {}).map((p, i) => (
              <li key={i}>{p.name}</li>
            ))}
          </ul>

          {game.status === "waiting" && (
            <button
              className="bg-purple-500 text-white p-2 rounded w-full"
              onClick={startGame}
            >
              🚀 Rozpocznij grę
            </button>
          )}

          {role && game.status === "in-progress" && (
            <div className="mt-4 p-4 border rounded">
              {role === "spy" ? (
                <p className="text-red-600 font-bold text-xl">🕵️ Jesteś SZPIEGIEM!</p>
              ) : (
                <p>
                  📍 Lokalizacja:{" "}
                  <span className="font-bold">{game.location}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
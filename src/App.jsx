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
const createGame = async (playerName) => {
  const id = nanoid(6);
  await set(ref(db, "games/" + id), {
    createdAt: Date.now(),
    location: "",
    status: "waiting",
    hostId: playerId,
    players: {
      [playerId]: { name: playerName, role: null }
    }
  });
  setGameId(id);
  setName(playerName);
};

  // 🔹 Dołączanie gracza
 const joinGame = async (id, playerName) => {
  setGameId(id);
  setName(playerName);
  await update(ref(db, `games/${id}/players/${playerId}`), {
    name: playerName,
    role: null
  });
};

  // 🔹 Rozpoczęcie gry
  const startGame = async () => {
  if (!game || game.hostId !== playerId) return; // tylko host
  if (!game.location) {
    alert("Podaj lokalizację przed startem gry!");
    return;
  }

  const ids = Object.keys(game.players || {});
  const spyIndex = Math.floor(Math.random() * ids.length);

  ids.forEach((id, index) => {
    update(ref(db, `games/${gameId}/players/${id}`), {
      role: index === spyIndex ? "spy" : "player"
    });
  });

  await update(ref(db, "games/" + gameId), { status: "in-progress" });
};

const newRound = async () => {
  if (!game || game.hostId !== playerId) return;
  await update(ref(db, "games/" + gameId), {
    status: "waiting",
    location: ""
  });
  // czyścimy role graczy
  Object.keys(game.players || {}).forEach((id) => {
    update(ref(db, `games/${gameId}/players/${id}`), { role: null });
  });
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

      {game && game.status === "waiting" && (
  <div className="mt-4 space-y-2">
    {game.hostId === playerId && (
      <>
        <input
          className="border p-2 w-full"
          placeholder="Podaj lokalizację"
          value={game.location || ""}
          onChange={(e) =>
            update(ref(db, "games/" + gameId), { location: e.target.value })
          }
        />
        <button
          className="bg-purple-500 text-white p-2 rounded w-full"
          onClick={startGame}
        >
          🚀 Rozpocznij grę
        </button>
      </>
    )}

    {game.hostId !== playerId && (
      <p className="italic text-gray-600">⏳ Czekaj na mistrza gry...</p>
    )}

    {game.status === "in-progress" && role && (
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

{game && game.status === "in-progress" && game.hostId === playerId && (
  <button
    className="bg-orange-500 text-white p-2 rounded w-full mt-4"
    onClick={newRound}
  >
    🔄 Nowa runda (zmień lokalizację)
  </button>
)}
  </div>
)}
    </div>
  );
}
import { useState, useEffect } from "react";
import { db, ref, set, update, onValue, get, remove } from "./firebase";
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
      players: {}
    });
    setGameId(id);
    setName(playerName);
  };

  // 🔹 Dołączanie gracza (z walidacją ID)
  const joinGame = async (id, playerName) => {
    const gameRef = ref(db, `games/${id}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) {
      alert("Gra o podanym ID nie istnieje!");
      return;
    }

    setGameId(id);
    setName(playerName);
    await update(ref(db, `games/${id}/players/${playerId}`), {
      name: playerName,
      role: null
    });
  };

  // 🔹 Rozpoczęcie gry
  const startGame = async () => {
    if (!game || game.hostId !== playerId) return;
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

  // 🔹 Nowa runda
  const newRound = async () => {
    if (!game || game.hostId !== playerId) return;
    await update(ref(db, "games/" + gameId), {
      status: "waiting",
      location: ""
    });
    Object.keys(game.players || {}).forEach((id) => {
      update(ref(db, `games/${gameId}/players/${id}`), { role: null });
    });
  };

  // 🔹 Wyrzucenie gracza
  const kickPlayer = async (id) => {
    if (!game || game.hostId !== playerId) return;
    await remove(ref(db, `games/${gameId}/players/${id}`));
  };

  // 🔹 Nasłuchiwanie zmian
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
            onClick={() => createGame(name || "Mistrz gry")}
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
          <p><b>ID gry:</b> {gameId}</p>

          <h2 className="text-xl">👥 Gracze:</h2>
          <ul className="list-disc list-inside">
            {Object.entries(game.players || {}).map(([id, p]) => (
              <li key={id} className="flex justify-between items-center">
                {p.name}
                {game.hostId === playerId && id !== playerId && (
                  <button
                    className="text-red-500 ml-2 text-sm"
                    onClick={() => kickPlayer(id)}
                  >
                    ❌ Wyrzuć
                  </button>
                )}
              </li>
            ))}
          </ul>

          {role && game.status === "in-progress" && (
            <div className="mt-4 p-4 border rounded">
              {role === "spy" ? (
                <p className="text-red-600 font-bold text-xl">🕵️ Jesteś SZPIEGIEM!</p>
              ) : (
                <p>📍 Lokalizacja: <span className="font-bold">{game.location}</span></p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Panel hosta – zawsze widoczny dla mistrza gry */}
{game && game.hostId === playerId && (
  <div className="mt-4 space-y-2">
    <input
      className="border p-2 w-full"
      placeholder="Podaj lokalizację"
      value={game.location || ""}
      onChange={(e) =>
        update(ref(db, "games/" + gameId), { location: e.target.value })
      }
    />

    {game.location && (
      <p>
        📍 Aktualna lokalizacja: <span className="font-bold">{game.location}</span>
      </p>
    )}

    {game.status === "waiting" && (
      <button
        className="bg-purple-500 text-white p-2 rounded w-full"
        onClick={startGame}
      >
        🚀 Rozpocznij grę
      </button>
    )}

    <button
      className="bg-orange-500 text-white p-2 rounded w-full mt-2"
      onClick={newRound}
    >
      🔄 Nowa runda
    </button>
  </div>
)}

{/* Panel gracza – komunikaty dla nie-hostów */}
{game && game.hostId !== playerId && (
  <div className="mt-4 space-y-2">
    {game.status === "waiting" && (
      <p className="italic text-gray-600">⏳ Czekaj na mistrza gry...</p>
    )}

    {game.status === "in-progress" && !role && (
      <p className="italic text-gray-600">⏳ Przydzielanie ról...</p>
    )}
  </div>
)}

    </div>
  );
}

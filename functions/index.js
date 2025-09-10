/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

exports.cleanupGames = functions.pubsub
  .schedule("every 30 minutes") // uruchamia się co pół godziny
  .onRun(async (context) => {
    const now = Date.now();
    const fiveHours = 5 * 60 * 60 * 1000; // 5 godzin w ms
    const cutoff = now - fiveHours;

    const snapshot = await db.ref("games").once("value");

    snapshot.forEach((gameSnap) => {
      const game = gameSnap.val();
      if (game.createdAt && game.createdAt < cutoff) {
        console.log(`Usuwam starą grę: ${gameSnap.key}`);
        gameSnap.ref.remove();
      }
    });

    return null;
  });

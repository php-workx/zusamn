import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

export const health = functions.https.onRequest((req, res) => {
  res.json({ ok: true, method: req.method, service: "zusamn-functions" });
});

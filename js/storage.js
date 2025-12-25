import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";

export async function loadCharacter(uid) {
  const ref = doc(db, "characters", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveCharacter(uid, data) {
  const ref = doc(db, "characters", uid);
  await setDoc(ref, data, { merge: true });
}

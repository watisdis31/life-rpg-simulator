import { storage } from "./firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ===============================
   IMAGE CROP + RESIZE (256x256)
================================ */

function resizeImage(file, size = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => (img.src = reader.result);
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);

      ctx.drawImage(
        img,
        (img.width - min) / 2,
        (img.height - min) / 2,
        min,
        min,
        0,
        0,
        size,
        size,
      );

      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    };
  });
}

/* ===============================
   STORAGE ACTIONS
================================ */

export async function uploadAvatar(userId, file) {
  const blob = await resizeImage(file);

  // ✅ MUST match Storage rules
  const avatarRef = ref(storage, `avatars/${userId}`);

  await uploadBytes(avatarRef, blob);
  return await getDownloadURL(avatarRef);
}

export async function clearAvatar(userId) {
  const avatarRef = ref(storage, `avatars/${userId}`);

  try {
    await deleteObject(avatarRef);
  } catch {
    // ok if avatar doesn't exist
  }
}

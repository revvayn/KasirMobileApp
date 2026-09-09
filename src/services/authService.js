import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const usersCollection = collection(db, 'users');

// Ambil dokumen role user (admin/kasir). Dokumen dijamin ada oleh ini.
export const getRole = async (uid) => {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role || null : null;
};

// Login email/password. Mengembalikan { uid, email }.
export const signIn = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return { uid: cred.user.uid, email: cred.user.email };
};

export const signOut = async () => {
  await fbSignOut(auth);
};

// Paksa buat dokumen users/{uid} bila belum ada.
// User PERTAMA yang masuk dianggap admin (koleksi users kosong).
export const ensureUserRole = async (uid, email) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return snap.data().role || 'kasir';

  const usersSnap = await getDocs(usersCollection);
  const isFirstUser = usersSnap.empty;
  const role = isFirstUser ? 'admin' : 'kasir';
  await setDoc(userRef, {
    email: email || '',
    role,
    displayName: email || '',
    createdAt: serverTimestamp(),
  });
  return role;
};

// Buat akun kasir/admin baru dari panel Admin.
export const createKasirUser = async ({ email, password, displayName, role }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName: displayName || email,
    role,
    createdAt: serverTimestamp(),
  });
  return uid;
};

// Registrasi publik untuk bootstrap: user pertama otomatis admin,
// selanjutnya jadi kasir (dikontrol ensureUserRole).
export const registerUser = async ({ email, password, displayName }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const role = await ensureUserRole(uid, email);
  await setDoc(
    doc(db, 'users', uid),
    { displayName: displayName || email, role },
    { merge: true }
  );
  return { uid, email, role };
};

// Daftar semua pengguna (panel Admin).
export const listUsers = async () => {
  const snap = await getDocs(usersCollection);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Ganti role atau nama tampilan pengguna (panel Admin).
export const updateUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

export { updatePassword };
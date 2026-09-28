// database.js — Firestore (Firebase Modular SDK via CDN)
// Jika config di bawah belum diisi, aplikasi memakai data dummy (tersimpan di memori saja).

const firebaseConfig = {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_PROJECT_ID.firebaseapp.com",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_PROJECT_ID.appspot.com",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID",
};

const COLLECTION = "unitKeluar";
export const isFirebaseReady = !firebaseConfig.apiKey.startsWith("ISI_");

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
let _fs = null, _db = null;

async function fs() {
  if (_fs) return _fs;
  const { initializeApp } = await import(FB + "firebase-app.js");
  _fs = await import(FB + "firebase-firestore.js");
  _db = _fs.getFirestore(initializeApp(firebaseConfig));
  return _fs;
}

// ---------- Data dummy (dipakai saat Firebase belum dikonfigurasi) ----------
function fotoDummy(label, hue) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="480" height="360" fill="hsl(${hue},55%,86%)"/><text x="240" y="185" font-family="Arial" font-size="26" fill="hsl(${hue},50%,30%)" text-anchor="middle">${label}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
const customers = ["PT Sumber Makmur", "CV Karya Tani", "PT Bumi Lestari", "UD Sinar Jaya", "PT Nusantara Agro", "CV Maju Bersama", "PT Tirta Abadi", "PT Cahaya Timur", "UD Berkah Tani", "PT Mitra Konstruksi", "CV Harapan Baru", "PT Samudra Logistik"];
const statuses = ["Selesai", "Proses", "Perlu Tindak Lanjut"];
let dummy = customers.map((nama, i) => {
  const nb = "NB-" + String(1234 + i).padStart(6, "0");
  const n = i % 5 === 3 ? 0 : 2 + (i % 6);
  return {
    id: "dummy" + i,
    nomorNB: nb,
    nomorRangka: "MHK" + (4100000 + i * 137),
    nomorMesin: "ENG" + (880000 + i * 211),
    namaCustomer: nama,
    tanggalKeluar: `${i < 9 ? 2026 : 2025}-${String((i % 9) + 1).padStart(2, "0")}-${String(5 + i).padStart(2, "0")}`,
    status: statuses[i % 3 === 2 ? 2 : i % 4 === 1 ? 1 : 0],
    dibuatOleh: ["Rina", "Budi", "Admin"][i % 3],
    foto: Array.from({ length: n }, (_, k) => fotoDummy(`${nb} • Foto ${k + 1}`, (i * 30 + k * 12) % 360)),
    createdAt: new Date(2026, 8, 25 - i).toISOString(),
  };
});
dummy[0].tanggalKeluar = "2026-09-25";

// ---------- Fungsi utama ----------
export async function loadUnits() {
  if (!isFirebaseReady) return [...dummy];
  const f = await fs();
  const snap = await f.getDocs(f.query(f.collection(_db, COLLECTION), f.orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveUnit(unit) {
  const data = { ...unit, createdAt: unit.createdAt || new Date().toISOString() };
  if (!isFirebaseReady) {
    const item = { id: "local" + Date.now(), ...data };
    dummy.unshift(item);
    return item.id;
  }
  const f = await fs();
  const ref = await f.addDoc(f.collection(_db, COLLECTION), data);
  return ref.id;
}

export async function updateUnit(id, data) {
  if (!isFirebaseReady) {
    dummy = dummy.map((u) => (u.id === id ? { ...u, ...data } : u));
    return;
  }
  const f = await fs();
  await f.updateDoc(f.doc(_db, COLLECTION, id), data);
}

export async function deleteUnit(id) {
  if (!isFirebaseReady) {
    dummy = dummy.filter((u) => u.id !== id);
    return;
  }
  const f = await fs();
  await f.deleteDoc(f.doc(_db, COLLECTION, id));
}

export async function getUnitByNB(nomorNB) {
  if (!isFirebaseReady) return dummy.find((u) => u.nomorNB === nomorNB) || null;
  const f = await fs();
  const snap = await f.getDocs(f.query(f.collection(_db, COLLECTION), f.where("nomorNB", "==", nomorNB)));
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

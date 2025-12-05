// == 1. KONFIGURASI FIREBASE (GANTI DENGAN KODE ANDA) ==
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore(); // Inisialisasi Cloud Firestore (atau Realtime Database jika Anda memilihnya)
// const auth = app.auth(); // Uncomment jika Anda mengaktifkan Auth

// == 2. FUNGSI UTAMA (MEMUAT PRODUK) ==

const productListDiv = document.getElementById("product-list");

async function loadProducts() {
  try {
    // Hapus pesan loading
    const loadingMessage = document.getElementById("loading-message");
    if (loadingMessage) loadingMessage.remove();

    // Ambil data dari koleksi 'ikan_hias' di Firestore
    const snapshot = await db.collection("ikan_hias").get();

    if (snapshot.empty) {
      productListDiv.innerHTML =
        '<p class="text-center col-span-full text-gray-500">Belum ada produk ikan yang tersedia.</p>';
      return;
    }

    // Tampilkan setiap produk
    snapshot.forEach((doc) => {
      const product = doc.data();
      const productElement = createProductCard(product);
      productListDiv.appendChild(productElement);
    });
  } catch (error) {
    console.error("Error memuat produk: ", error);
    productListDiv.innerHTML =
      '<p class="text-center col-span-full text-red-500">Gagal memuat data. Periksa koneksi Firebase Anda.</p>';
  }
}

// Fungsi untuk membuat elemen kartu produk
function createProductCard(product) {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-lg shadow-xl overflow-hidden transform transition duration-300 hover:scale-105";

  // Asumsi product memiliki field: nama, harga, deskripsi, imageUrl
  card.innerHTML = `
        <img src="${
          product.imageUrl ||
          "https://via.placeholder.com/400x300.png?text=Ikan+Hias"
        }" alt="${product.nama}" class="w-full h-48 object-cover">
        <div class="p-4">
            <h3 class="text-xl font-semibold text-gray-800 truncate">${
              product.nama
            }</h3>
            <p class="text-gray-600 mt-1 mb-3">${product.deskripsi.substring(
              0,
              50
            )}...</p>
            <p class="text-2xl font-bold text-blue-600 mb-4">Rp ${product.harga.toLocaleString(
              "id-ID"
            )}</p>
            <button class="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-300">
                + Keranjang
            </button>
        </div>
    `;
  return card;
}

// Jalankan fungsi saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", loadProducts);

// == 3. LOGIKA AUTH (OPSIONAL) ==
// const authBtn = document.getElementById('auth-btn');
// authBtn.addEventListener('click', () => {
//     // Di sini Anda bisa memicu modal login/pendaftaran
//     alert('Fungsi Autentikasi akan diimplementasikan di sini!');
// });

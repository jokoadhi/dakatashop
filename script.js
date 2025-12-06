/**
 * =================================================================
 * SCRIPT.JS - MULTI-SELLER E-COMMERCE LOGIC LENGKAP
 * =================================================================
 * Fitur: Auth, CRUD Produk, Management Dashboard (12 Bulan), Profil Toko.
 */

// -----------------------------------------------------------------
// BAGIAN 1: KONFIGURASI DAN INISIALISASI FIREBASE
// -----------------------------------------------------------------

// GANTI DENGAN KONFIGURASI FIREBASE ASLI ANDA
const firebaseConfig = {
  apiKey: "AIzaSyBTGj6kOk76-YelKgEb0Xi94f6PctrAec4",
  authDomain: "dakata-shop.firebaseapp.com",
  projectId: "dakata-shop",
  storageBucket: "dakata-shop.firebasestorage.app",
  messagingSenderId: "998662275226",
  appId: "1:998662275226:web:0147761d90d2bf7572df23",
};

const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const auth = app.auth();

// -----------------------------------------------------------------
// BAGIAN 2: VARIABEL GLOBAL & DEKLARASI DOM
// -----------------------------------------------------------------

// 🔥 KONFIGURASI CLOUDINARY 🔥
const CLOUDINARY_CLOUD_NAME = "daw7yn6jp";
const CLOUDINARY_UPLOAD_PRESET = "dakata-upload-preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

let currentUser = null;
let isRegisterMode = false;
let editingProductId = null;
let currentPeriodFilter = 12; // Default 12 Bulan (1 Tahun)

// 🔥 DEKLARASI VARIABEL DOM UTAMA 🔥
let productListDiv,
  mainBanner,
  authBtn,
  authModal,
  authForm,
  authTitle,
  authSubmitBtn,
  toggleAuthMode,
  closeModalBtn,
  authError,
  uploadBtn,
  uploadModal,
  uploadForm,
  closeUploadModalBtn,
  uploadError,
  uploadModalTitle,
  uploadSubmitBtn,
  productImageFile,
  imagePreview,
  imagePreviewContainer,
  sellerControls,
  sellerGreeting;

// 🔥 DEKLARASI VARIABEL MANAGEMENT 🔥
let manageBtn,
  managementView,
  totalSaldo,
  totalTerjual,
  totalTransaksi,
  transactionHistory,
  productListWrapper;

// 🔥 DEKLARASI VARIABEL GRAFIK 🔥
let salesChartCanvas;

// 🔥 DEKLARASI VARIABEL PROFIL 🔥
let profileBtn,
  profileModal,
  closeProfileModalBtn,
  updateShopForm,
  shopNameInput,
  shopNameError,
  shopNameSubmitBtn,
  updatePasswordForm,
  newPasswordInput,
  passwordError,
  passwordSubmitBtn;

// 🔥 HELPER LOADING ANIMATION 🔥
const loadingSpinner = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

function setLoading(buttonElement, isLoading, originalText, loadingText) {
  if (isLoading) {
    buttonElement.disabled = true;
    buttonElement.innerHTML = loadingSpinner + (loadingText || "Memproses...");
    buttonElement.classList.add("flex", "items-center", "justify-center");
  } else {
    buttonElement.disabled = false;
    buttonElement.innerHTML = originalText;
    buttonElement.classList.remove("flex", "items-center", "justify-center");
  }
}

// -----------------------------------------------------------------
// BAGIAN 3: FUNGSI UTAMA (MEMUAT & MENAMPILKAN PRODUK)
// -----------------------------------------------------------------

// 🔥 FUNGSI PEMBANTU: Mendapatkan data penjual dari Firestore 🔥
async function getSellerData(uid) {
  try {
    const doc = await db.collection("sellers").doc(uid).get();
    if (doc.exists) {
      return doc.data();
    } else {
      // Buat dokumen baru jika tidak ada (untuk user lama)
      const defaultShopName =
        currentUser.email.split("@")[0].charAt(0).toUpperCase() +
        currentUser.email.split("@")[0].slice(1) +
        " Store";
      await db.collection("sellers").doc(uid).set({
        email: currentUser.email,
        shopName: defaultShopName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return { shopName: defaultShopName };
    }
  } catch (error) {
    console.error("Error fetching seller data:", error);
    return { shopName: "Toko Rahasia" };
  }
}

async function loadProducts() {
  if (!productListDiv) return;

  try {
    productListDiv.innerHTML = "";

    const loadingMessageElement = document.createElement("div");
    loadingMessageElement.id = "loading-message";
    loadingMessageElement.className =
      "p-6 bg-white rounded-xl shadow-lg text-center col-span-full";
    loadingMessageElement.innerHTML =
      '<p class="text-lg text-gray-500">Memuat katalog produk...</p><div class="mt-3 h-2 w-1/4 bg-gray-200 rounded animate-pulse mx-auto"></div>';
    productListDiv.appendChild(loadingMessageElement);

    const snapshot = await db.collection("products").get();

    const currentLoadingMessage = document.getElementById("loading-message");
    if (currentLoadingMessage) currentLoadingMessage.remove();

    if (snapshot.empty) {
      productListDiv.innerHTML =
        '<p class="text-center col-span-full text-xl py-10 text-gray-500 italic">Belum ada produk dalam koleksi ini. Silakan tambahkan item baru.</p>';
      return;
    }

    // PENGAMBILAN DATA PENJUAL YANG EFISIEN
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const ownerIds = [...new Set(products.map((p) => p.ownerId))];
    const sellerNamesMap = {};

    const sellerPromises = ownerIds.map(async (ownerId) => {
      const sellerDoc = await db.collection("sellers").doc(ownerId).get();
      if (sellerDoc.exists) {
        sellerNamesMap[ownerId] = sellerDoc.data().shopName || "Toko Rahasia";
      } else {
        sellerNamesMap[ownerId] = "Toko Tidak Dikenal";
      }
    });

    await Promise.all(sellerPromises);
    // AKHIR PENGAMBILAN DATA PENJUAL

    products.forEach((product) => {
      product.shopName = sellerNamesMap[product.ownerId] || "Toko Unknown"; // Suntikkan nama toko

      const productElement = createProductCard(product);
      productListDiv.appendChild(productElement);
    });
  } catch (error) {
    console.error("Error memuat produk: ", error);
    productListDiv.innerHTML =
      '<p class="text-center col-span-full text-xl py-10 text-red-500">Koneksi ke database gagal. Periksa Firebase atau jaringan Anda.</p>';
  }
}
function createProductCard(product) {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-xl shadow-2xl overflow-hidden transform transition duration-500 hover:scale-[1.03] hover:shadow-yellow-400/50 cursor-pointer border border-gray-100";

  const price =
    typeof product.harga === "number"
      ? product.harga
      : parseInt(product.harga) || 0;

  const isOwner = currentUser && product.ownerId === currentUser.uid;
  const shopName = product.shopName || "Toko Terpercaya"; // Ambil nama toko

  const ownerControls = isOwner
    ? `
        <div class="mt-3 flex space-x-2 border-t pt-3">
            <button data-id="${product.id}" class="edit-btn text-sm font-semibold text-blue-500 hover:text-blue-700">Edit Produk</button>
            <button data-id="${product.id}" class="delete-btn text-sm font-semibold text-red-500 hover:text-red-700">Hapus Produk</button>
        </div>
    `
    : "";

  const cartButton = isOwner
    ? ""
    : `
      <button class="bg-yellow-400 text-gray-900 font-bold text-sm py-2 px-4 rounded-full shadow-md hover:bg-yellow-500 transition duration-300 flex items-center space-x-1">
          <span>Tambahkan</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.376 5.504a1 1 0 00.95.787h8.14a1 1 0 00.95-.787l1.41-5.645a1 1 0 00-.01-.042L17.778 3H19a1 1 0 100-2H3z" />
              <path d="M5.5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
      </button>
  `;

  // 🔥 LOGIKA KONDISIONAL UNTUK NAMA TOKO 🔥
  const shopNameDisplay = isOwner
    ? "" // Jika isOwner adalah TRUE (penjual), maka kembalikan string kosong (sembunyikan)
    : `
      <p class="text-xs font-semibold text-gray-700 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1h1a2 2 0 012 2v2a2 2 0 01-2 2h-2.586l.293.293A1 1 0 0111 11.414V14h3a1 1 0 010 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3v-2.586l-.293-.293A1 1 0 017.586 9H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1h3zM8 6a1 1 0 00-1 1v1a1 1 0 102 0V7a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          Dijual oleh: <span class="ml-1 font-bold text-blue-600">${shopName}</span>
      </p>
    `;

  card.innerHTML = `
        <div class="relative h-56 w-full">
            <img src="${
              product.imageUrl ||
              "https://via.placeholder.com/400x300.png?text=Produk+Pilihan"
            }" 
                 alt="${product.nama}" 
                 class="w-full h-full object-cover transition duration-300 group-hover:opacity-90">
            <span class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                ${isOwner ? "MILIK ANDA" : "Baru"}
            </span>
        </div>

        <div class="p-5">
            <h3 class="text-2xl font-bold text-gray-900 mb-1 truncate">${
              product.nama
            }</h3>
            
            <p class="text-sm text-gray-500 mb-2">${
              product.deskripsi
                ? product.deskripsi.substring(0, 60) + "..."
                : "Deskripsi tidak tersedia."
            }</p>
            
            ${shopNameDisplay} <div class="flex justify-between items-center mt-4 border-t pt-3">
                <p class="text-3xl font-extrabold text-blue-600">
                    Rp ${price.toLocaleString("id-ID")}
                </p>
                ${cartButton}
            </div>
            ${ownerControls}
        </div>
    `;

  if (isOwner) {
    card
      .querySelector(".delete-btn")
      .addEventListener("click", handleDeleteProduct);
    card.querySelector(".edit-btn").addEventListener("click", handleEditClick);
  }

  return card;
}

// -----------------------------------------------------------------
// BAGIAN 4: FUNGSI AUTENTIKASI (LOGIN/REGISTER)
// -----------------------------------------------------------------

async function handleSubmitAuth(e) {
  e.preventDefault();
  authError.classList.add("hidden");

  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  const originalText = isRegisterMode ? "Daftar" : "Masuk";

  setLoading(
    authSubmitBtn,
    true,
    originalText,
    isRegisterMode ? "Mendaftar..." : "Masuk..."
  );

  try {
    if (isRegisterMode) {
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      // Buat dokumen user di Firestore dengan nama toko default
      const defaultShopName =
        email.split("@")[0].charAt(0).toUpperCase() +
        email.split("@")[0].slice(1) +
        " Store";
      await db.collection("sellers").doc(userCredential.user.uid).set({
        email: email,
        shopName: defaultShopName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }

    authModal.classList.add("hidden");
  } catch (error) {
    console.error("Auth Error:", error.code, error.message);
    authError.textContent = `Gagal: ${error.message}`;
    authError.classList.remove("hidden");
  } finally {
    setLoading(authSubmitBtn, false, originalText);
  }
}

// Update UI berdasarkan status Auth (PENTING)
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const sellerData = await getSellerData(user.uid);
    const shopName = sellerData.shopName || user.email.split("@")[0];

    // SEMBUNYIKAN BANNER UTAMA SAAT LOGIN
    if (mainBanner) mainBanner.classList.add("hidden");

    // --- TAMPILAN HEADER (Login/Logout & Profil) ---
    authBtn.textContent = `Hai, ${user.email.split("@")[0]} (Logout)`;
    authBtn.classList.remove(
      "bg-gold-accent",
      "text-navy-blue",
      "hover:bg-white"
    );
    authBtn.classList.add("bg-red-500", "text-white", "hover:bg-red-600");

    if (profileBtn) profileBtn.classList.remove("hidden"); // Tampilkan tombol profil

    // --- TAMPILAN SELLER CONTROLS CARD ---
    if (sellerControls) {
      sellerControls.classList.remove("hidden");
      sellerGreeting.textContent = `Halo, ${shopName}!`; // Sapa dengan nama toko
    }

    // PASTIKAN TAMPILAN PRODUK MUNCUL DAN MANAGEMENT TERSEMBUNYI SAAT LOGIN
    if (productListWrapper) productListWrapper.classList.remove("hidden");
    if (managementView) managementView.classList.add("hidden");
    if (manageBtn)
      manageBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
        </svg>
        Management
    `;

    // Hapus instansi grafik lama (jika ada) saat status auth berubah
    if (window.salesChartInstance) {
      window.salesChartInstance.destroy();
    }
  } else {
    currentUser = null;

    // TAMPILKAN KEMBALI BANNER UTAMA SAAT LOGOUT
    if (mainBanner) mainBanner.classList.remove("hidden");

    // --- TAMPILAN HEADER (Masuk) ---
    authBtn.textContent = "Masuk";
    authBtn.classList.remove("bg-red-500", "text-white", "hover:bg-red-600");
    authBtn.classList.add("bg-gold-accent", "text-navy-blue", "hover:bg-white");

    if (profileBtn) profileBtn.classList.add("hidden"); // Sembunyikan tombol profil

    // --- SEMBUNYIKAN SELLER CONTROLS CARD & MANAGEMENT VIEW ---
    if (sellerControls) sellerControls.classList.add("hidden");
    if (managementView) managementView.classList.add("hidden");

    // Daftar produk tetap tampil untuk semua user
    if (productListWrapper) productListWrapper.classList.remove("hidden");
  }

  loadProducts();
});

// -----------------------------------------------------------------
// BAGIAN 5: FUNGSI KONTROL PRODUK OLEH PEMILIK (UPLOAD, EDIT, & HAPUS)
// -----------------------------------------------------------------

function handleEditClick(e) {
  e.stopPropagation();
  const productId = e.currentTarget.dataset.id;
  editingProductId = productId;

  uploadModalTitle.textContent = "Edit Produk";
  uploadSubmitBtn.textContent = "Simpan Perubahan";

  if (uploadModal) uploadModal.classList.remove("hidden");
  if (uploadError) uploadError.classList.add("hidden");
  if (uploadForm) uploadForm.reset();

  db.collection("products")
    .doc(productId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const product = doc.data();
        document.getElementById("product-nama").value = product.nama;
        document.getElementById("product-harga").value = product.harga;
        document.getElementById("product-desc").value = product.deskripsi;

        imagePreview.src = product.imageUrl;
        imagePreviewContainer.classList.remove("hidden");

        productImageFile.removeAttribute("required");
      }
    })
    .catch((error) => {
      console.error("Error fetching document for edit:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat mengambil data produk.",
      });
    });
}

async function handleSubmitProduct(e) {
  e.preventDefault();
  uploadError.classList.add("hidden");

  if (!currentUser) {
    uploadError.textContent = "Error: Anda harus login sebagai penjual.";
    uploadError.classList.remove("hidden");
    return;
  }

  const isEditing = editingProductId !== null;
  const originalText = uploadSubmitBtn.textContent;
  const loadingText = isEditing ? "Memperbarui..." : "Mengupload...";

  const nama = document.getElementById("product-nama").value;
  const harga = parseInt(document.getElementById("product-harga").value);
  const deskripsi = document.getElementById("product-desc").value;
  const file = productImageFile.files[0];

  if (isNaN(harga) || harga <= 0) {
    uploadError.textContent = "Harga harus berupa angka positif.";
    uploadError.classList.remove("hidden");
    return;
  }
  if (!isEditing && !file) {
    uploadError.textContent = "Anda harus memilih foto produk.";
    uploadError.classList.remove("hidden");
    return;
  }

  setLoading(uploadSubmitBtn, true, originalText, loadingText);

  try {
    let imageUrl;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", `dakata_shop/${currentUser.uid}`);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error.message || "Gagal mengupload file ke Cloudinary."
        );
      }

      const cloudinaryData = await response.json();
      imageUrl = cloudinaryData.secure_url;
    } else if (isEditing) {
      imageUrl = imagePreview.src;
    }

    const productData = {
      nama: nama,
      harga: harga,
      deskripsi: deskripsi,
      ownerId: currentUser.uid,
    };

    if (imageUrl) {
      productData.imageUrl = imageUrl;
    }

    if (isEditing) {
      productData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").doc(editingProductId).update(productData);
    } else {
      productData.stock = 1;
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").add(productData);
    }

    uploadForm.reset();
    imagePreviewContainer.classList.add("hidden");
    uploadModal.classList.add("hidden");
    editingProductId = null;
    uploadModalTitle.textContent = "Upload Produk Baru";
    productImageFile.setAttribute("required", "required");

    loadProducts();

    Swal.fire({
      icon: "success",
      title: isEditing ? "Berhasil Diperbarui!" : "Produk Berhasil Diupload!",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
  } catch (error) {
    console.error("Error submit produk: ", error);
    uploadError.textContent = `Gagal memproses produk: ${error.message}. Cek Cloudinary API atau koneksi Firestore.`;
    uploadError.classList.remove("hidden");
  } finally {
    setLoading(uploadSubmitBtn, false, originalText);
  }
}

async function handleDeleteProduct(e) {
  e.stopPropagation();

  const deleteBtn = e.currentTarget;
  const productId = deleteBtn.dataset.id;
  if (!currentUser || !productId) {
    Swal.fire({
      icon: "error",
      title: "Akses Ditolak",
      text: "Silakan login sebagai penjual untuk melakukan aksi ini.",
    });
    return;
  }

  const originalHtml = deleteBtn.innerHTML;
  const originalClassName = deleteBtn.className;

  const result = await Swal.fire({
    title: "Hapus Produk?",
    text: "Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    setLoading(deleteBtn, true, originalHtml, "Menghapus...");

    try {
      await db.collection("products").doc(productId).delete();

      Swal.fire("Dihapus!", "Produk Anda berhasil dihapus.", "success");

      loadProducts();
    } catch (error) {
      deleteBtn.innerHTML = originalHtml;
      deleteBtn.className = originalClassName;

      Swal.fire(
        "Gagal!",
        "Gagal menghapus produk. Pastikan Anda pemiliknya dan aturan Firebase sudah benar.",
        "error"
      );
      console.error("Error deleting document: ", error);
    }
  }
}

// -----------------------------------------------------------------
// BAGIAN 6: FUNGSI MANAGEMENT (RIWAYAT TRANSAKSI & SALDO)
// -----------------------------------------------------------------

function toggleManagementView() {
  if (!currentUser) return;

  if (managementView.classList.contains("hidden")) {
    // Tampilkan Management View
    managementView.classList.remove("hidden");
    productListWrapper.classList.add("hidden");
    manageBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 4v1h10V7H5zm0 3v1h10v-1H5zm0 3v1h10v-1H5z" clip-rule="evenodd" />
            </svg>
            Lihat Produk
        `;

    loadTransactionHistory();
  } else {
    // Tampilkan Produk View
    managementView.classList.add("hidden");
    productListWrapper.classList.remove("hidden");
    manageBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
            </svg>
            Management
        `;
  }
}

async function loadTransactionHistory() {
  if (!currentUser) return;

  transactionHistory.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat riwayat transaksi...</td></tr>`;

  // Filter 12 bulan terakhir
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - currentPeriodFilter);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // --- SIMULASI DATA TRANSAKSI INTERNAL ---
  const simulatedTransactions = [
    // Desember 2025
    {
      id: "TX007",
      product: "Smart Watch",
      price: 800000,
      status: "Completed",
      date: "2025-12-05",
    },
    {
      id: "TX004",
      product: "Topi Baseball",
      price: 75000,
      status: "Completed",
      date: "2025-12-01",
    },

    // November 2025
    {
      id: "TX003",
      product: "Sepatu Lari Sport",
      price: 450000,
      status: "Completed",
      date: "2025-11-30",
    },
    {
      id: "TX002",
      product: "Celana Jeans Wanita",
      price: 280000,
      status: "Pending",
      date: "2025-11-29",
    },
    {
      id: "TX001",
      product: "Baju Batik Pria",
      price: 150000,
      status: "Completed",
      date: "2025-11-28",
    },

    // Oktober 2025
    {
      id: "TX006",
      product: "Power Bank",
      price: 120000,
      status: "Completed",
      date: "2025-10-20",
    },
    {
      id: "TX005",
      product: "Headset Gaming",
      price: 600000,
      status: "Completed",
      date: "2025-10-15",
    },

    // September 2025
    {
      id: "TX011",
      product: "Kemeja",
      price: 200000,
      status: "Completed",
      date: "2025-09-20",
    },
    {
      id: "TX010",
      product: "Tas Punggung",
      price: 300000,
      status: "Completed",
      date: "2025-09-10",
    },

    // (Tambah data simulasi untuk mencapai 12 bulan jika perlu)
  ];

  // FILTER DATA BERDASARKAN currentPeriodFilter (Sekarang 12)
  const filteredTransactions = simulatedTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= today;
  });

  // Inisialisasi penghitung
  let saldo = 0;
  let terjual = 0;
  let totalTx = 0;

  // DATA GRAFIK: Mengelompokkan penjualan berdasarkan Periode (Bulan/Tahun)
  const salesByPeriod = {};
  const rows = [];

  filteredTransactions.forEach((tx) => {
    const isCompleted = tx.status === "Completed";
    totalTx += 1;

    if (isCompleted) {
      saldo += tx.price;
      terjual += 1;

      const [year, month] = tx.date.split("-");
      const period = `${year}-${month}`;

      salesByPeriod[period] = (salesByPeriod[period] || 0) + tx.price;
    }

    const statusClass = isCompleted
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";

    rows.push(`
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${
                  tx.id
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                  tx.product
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp ${tx.price.toLocaleString(
                  "id-ID"
                )}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${tx.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                  tx.date
                }</td>
            </tr>
        `);
  });

  // Update Statistik
  totalSaldo.textContent = `Rp ${saldo.toLocaleString("id-ID")}`;
  totalTerjual.textContent = terjual;
  totalTransaksi.textContent = totalTx;

  transactionHistory.innerHTML =
    rows.join("") ||
    `<tr><td colspan="5" class="text-center py-4 text-gray-500">Tidak ada riwayat transaksi.</td></tr>`;

  renderSalesChart(salesByPeriod);
}

// FUNGSI BARU: RENDERING GRAFIK PENJUALAN
function renderSalesChart(salesData) {
  if (!salesChartCanvas) return;

  const rawLabels = Object.keys(salesData).sort();
  const chartLabels = rawLabels.map((period) => {
    const [year, month] = period.split("-");
    return `${month}/${year.slice(2)}`;
  });
  const chartValues = rawLabels.map((period) => salesData[period]);

  // HAPUS GRAFIK LAMA JIKA ADA
  if (window.salesChartInstance) {
    window.salesChartInstance.destroy();
  }

  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded.");
    return;
  }

  // RENDERING GRAFIK MENGGUNAKAN CHART.JS
  const ctx = salesChartCanvas.getContext("2d");
  window.salesChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Penjualan Bersih (Rp)",
          data: chartValues,
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Pendapatan (Rp)" },
          ticks: {
            callback: function (value) {
              if (value >= 1000000) {
                return "Rp " + (value / 1000000).toFixed(1) + "M";
              }
              if (value === 0) return "Rp 0";
              return "Rp " + value / 1000 + "k";
            },
          },
        },
        x: {
          title: { display: true, text: "Periode (Bulan/Tahun)" },
        },
      },
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += "Rp " + context.parsed.y.toLocaleString("id-ID");
              }
              return label;
            },
          },
        },
      },
    },
  });
}

// -----------------------------------------------------------------
// BAGIAN 7: FUNGSI PENGATURAN PROFIL & AKUN
// -----------------------------------------------------------------

async function openProfileModal() {
  if (!currentUser) return;

  const sellerData = await getSellerData(currentUser.uid);
  if (shopNameInput) shopNameInput.value = sellerData.shopName || "";

  if (shopNameError) shopNameError.classList.add("hidden");
  if (passwordError) passwordError.classList.add("hidden");
  if (newPasswordInput) newPasswordInput.value = "";
  if (profileModal) profileModal.classList.remove("hidden");
}

async function handleUpdateShopName(e) {
  e.preventDefault();
  if (shopNameError) shopNameError.classList.add("hidden");

  const newShopName = shopNameInput.value.trim();
  if (newShopName.length < 3) {
    if (shopNameError) {
      shopNameError.textContent = "Nama toko minimal 3 karakter.";
      shopNameError.classList.remove("hidden");
    }
    return;
  }

  const originalText = "Simpan Nama Toko";
  setLoading(shopNameSubmitBtn, true, originalText, "Menyimpan...");

  try {
    await db.collection("sellers").doc(currentUser.uid).update({
      shopName: newShopName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    if (sellerGreeting) sellerGreeting.textContent = `Halo, ${newShopName}!`;
    if (shopNameInput) shopNameInput.value = newShopName;

    Swal.fire({
      icon: "success",
      title: "Nama Toko Diperbarui!",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
    loadProducts(); // Muat ulang produk untuk update nama toko di card
  } catch (error) {
    console.error("Error updating shop name:", error);
    if (shopNameError) {
      shopNameError.textContent = `Gagal update nama toko: ${error.message}`;
      shopNameError.classList.remove("hidden");
    }
  } finally {
    setLoading(shopNameSubmitBtn, false, originalText);
  }
}

async function handleUpdatePassword(e) {
  e.preventDefault();
  if (passwordError) passwordError.classList.add("hidden");

  const newPassword = newPasswordInput.value;
  if (newPassword.length < 6) {
    if (passwordError) {
      passwordError.textContent = "Sandi baru minimal 6 karakter.";
      passwordError.classList.remove("hidden");
    }
    return;
  }

  const originalText = "Ganti Sandi";
  setLoading(passwordSubmitBtn, true, originalText, "Mengganti...");

  try {
    await currentUser.updatePassword(newPassword);

    // Jika berhasil, logout user untuk keamanan
    await auth.signOut();
    if (profileModal) profileModal.classList.add("hidden");

    Swal.fire({
      icon: "success",
      title: "Kata Sandi Berhasil Diganti!",
      text: "Silakan login kembali dengan sandi baru Anda.",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  } catch (error) {
    console.error("Error updating password:", error);
    let errorMessage = error.message;

    if (error.code === "auth/requires-recent-login") {
      errorMessage =
        "Aksi ini memerlukan login ulang. Mohon keluar (Logout) dan Masuk (Login) kembali. Setelah login, coba ganti sandi lagi.";

      Swal.fire({
        icon: "warning",
        title: "Aksi Sensitif",
        text: "Anda harus login ulang sebelum mengganti sandi. Mohon klik Logout, lalu Login kembali, dan coba ganti sandi lagi.",
        confirmButtonText: "Mengerti",
      });
    }

    if (passwordError) {
      passwordError.textContent = `Gagal ganti sandi: ${errorMessage}`;
      passwordError.classList.remove("hidden");
    }
  } finally {
    setLoading(passwordSubmitBtn, false, originalText);
  }
}

// -----------------------------------------------------------------
// BAGIAN 8: EKSEKUSI AWAL DAN EVENT LISTENERS
// -----------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // INISIALISASI SEMUA VARIABEL DOM DI SINI
  productListDiv = document.getElementById("product-list");
  mainBanner = document.getElementById("main-banner");
  authBtn = document.getElementById("auth-btn");
  authModal = document.getElementById("auth-modal");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  authSubmitBtn = document.getElementById("auth-submit-btn");
  toggleAuthMode = document.getElementById("toggle-auth-mode");
  closeModalBtn = document.getElementById("close-modal-btn");
  authError = document.getElementById("auth-error");

  uploadBtn = document.getElementById("upload-btn");
  uploadModal = document.getElementById("upload-modal");
  uploadForm = document.getElementById("upload-form");
  closeUploadModalBtn = document.getElementById("close-upload-modal-btn");
  uploadError = document.getElementById("upload-error");
  uploadModalTitle = document.getElementById("upload-modal-title");
  uploadSubmitBtn = document.getElementById("upload-submit-btn");

  productImageFile = document.getElementById("product-image-file");
  imagePreview = document.getElementById("image-preview");
  imagePreviewContainer = document.getElementById("image-preview-container");

  sellerControls = document.getElementById("seller-controls");
  sellerGreeting = document.getElementById("seller-greeting");

  // INISIALISASI VARIABEL MANAGEMENT & GRAFIK
  manageBtn = document.getElementById("manage-btn");
  managementView = document.getElementById("management-view");
  totalSaldo = document.getElementById("total-saldo");
  totalTerjual = document.getElementById("total-terjual");
  totalTransaksi = document.getElementById("total-transaksi");
  transactionHistory = document.getElementById("transaction-history");
  productListWrapper = document.getElementById("product-list-wrapper");
  salesChartCanvas = document.getElementById("salesChart");

  // INISIALISASI VARIABEL PROFIL BARU
  profileBtn = document.getElementById("profile-btn");
  profileModal = document.getElementById("profile-modal");
  closeProfileModalBtn = document.getElementById("close-profile-modal-btn");
  updateShopForm = document.getElementById("update-shop-form");
  shopNameInput = document.getElementById("shop-name");
  shopNameError = document.getElementById("shop-name-error");
  shopNameSubmitBtn = document.getElementById("shop-name-submit-btn");
  updatePasswordForm = document.getElementById("update-password-form");
  newPasswordInput = document.getElementById("new-password");
  passwordError = document.getElementById("password-error");
  passwordSubmitBtn = document.getElementById("password-submit-btn");
  // --- EVENT LISTENERS ---

  // 1. Produk Upload/Edit
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      editingProductId = null;
      uploadModalTitle.textContent = "Upload Produk Baru";
      uploadSubmitBtn.textContent = "Simpan Produk";
      if (uploadForm) uploadForm.reset();
      if (imagePreviewContainer) imagePreviewContainer.classList.add("hidden");
      if (productImageFile)
        productImageFile.setAttribute("required", "required");
      if (uploadModal) uploadModal.classList.remove("hidden");
    });
  }
  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener("click", () => {
      uploadModal.classList.add("hidden");
      editingProductId = null;
      uploadModalTitle.textContent = "Upload Produk Baru";
      uploadSubmitBtn.textContent = "Simpan Produk";
      if (productImageFile)
        productImageFile.setAttribute("required", "required");
    });
  }
  if (uploadForm) uploadForm.addEventListener("submit", handleSubmitProduct);
  if (productImageFile) {
    productImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          imagePreviewContainer.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      } else {
        imagePreviewContainer.classList.add("hidden");
      }
    });
  }

  // 2. Autentikasi
  if (authBtn) {
    authBtn.addEventListener("click", () => {
      if (!currentUser) {
        authModal.classList.remove("hidden");
      } else {
        // 🔥 PENYESUAIAN LOGOUT DENGAN KONFIRMASI SWEETALERT2 🔥
        Swal.fire({
          title: "Yakin ingin keluar?",
          text: "Anda harus login lagi untuk mengakses fitur penjual.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Ya, Keluar!",
          cancelButtonText: "Batal",
        }).then((result) => {
          if (result.isConfirmed) {
            // Jika pengguna menekan "Ya, Keluar!"
            auth
              .signOut()
              .then(() => {
                Swal.fire({
                  icon: "success",
                  title: "Sampai Jumpa!",
                  text: "Anda berhasil keluar.",
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                });
              })
              .catch((error) => {
                console.error("Logout Error:", error);
                Swal.fire(
                  "Gagal!",
                  "Gagal keluar. Silakan coba lagi.",
                  "error"
                );
              });
          }
        });
        // -----------------------------------------------------
      }
    });
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      authModal.classList.add("hidden");
      authError.classList.add("hidden");
    });
  }
  if (toggleAuthMode) {
    toggleAuthMode.addEventListener("click", () => {
      isRegisterMode = !isRegisterMode;
      if (isRegisterMode) {
        authTitle.textContent = "Daftar Akun Penjual";
        authSubmitBtn.textContent = "Daftar";
        toggleAuthMode.textContent = "Sudah punya akun? Masuk!";
      } else {
        authTitle.textContent = "Masuk Penjual";
        authSubmitBtn.textContent = "Masuk";
        toggleAuthMode.textContent = "Belum punya akun? Daftar sekarang!";
      }
    });
  }
  if (authForm) authForm.addEventListener("submit", handleSubmitAuth);

  // 3. Management
  if (manageBtn) {
    manageBtn.addEventListener("click", toggleManagementView);
  }

  // 4. Profil
  if (profileBtn) {
    profileBtn.addEventListener("click", openProfileModal);
  }
  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener("click", () => {
      profileModal.classList.add("hidden");
    });
  }
  if (updateShopForm) {
    updateShopForm.addEventListener("submit", handleUpdateShopName);
  }
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener("submit", handleUpdatePassword);
  }

  // loadProducts() dipanggil otomatis oleh auth.onAuthStateChanged
});

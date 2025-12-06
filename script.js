/**
 * =================================================================
 * SCRIPT.JS - MULTI-SELLER E-COMMERCE LOGIC LENGKAP
 * =================================================================
 * Fitur: Auth, CRUD Produk (dengan Cropper.js & Cloudinary), Detail Produk,
 * Management Dashboard (Chart.js), Profil Toko.
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

// 🔥 DEKLARASI VARIABEL DETAIL PRODUK 🔥
let productDetailView,
  productListWrapperElement,
  backToProductsBtn,
  detailProductName,
  detailProductPrice,
  detailProductDescription,
  detailProductImage,
  detailShopNameText,
  detailOwnerMessage,
  // 🔥 VARIABEL KUANTITAS 🔥
  qtyDecrementBtn,
  qtyIncrementBtn,
  productQuantityInput,
  detailStockInfo,
  quantityControlsWrapper; // <-- DIPISAHKAN OLEH KOMA DARI DETAILSTOCKINFO

// 🔥 VARIABEL BARU UNTUK CROPPER 🔥
let cropperInstance;
let imageToCrop; // Elemen <img> di modal crop
let cropModal, closeCropModalBtn, applyCropBtn;
let croppedFileBlob = null; // Menyimpan hasil crop sebelum upload

// 🔥 DEKLARASI VARIABEL MANAGEMENT 🔥
let manageBtn,
  managementView,
  totalSaldo,
  totalTerjual,
  totalTransaksi,
  transactionHistory,
  productListWrapper;

// 🔥 VARIABEL BARU UNTUK TOGGLE SANDI LOGIN 🔥
let authPasswordInput,
  toggleAuthPasswordBtn,
  authEyeIconOpen,
  authEyeIconClosed;

// 🔥 DEKLARASI VARIABEL GRAFIK 🔥
let salesChartCanvas;
let salesChartInstance; // Deklarasi untuk menyimpan instansi chart

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

// 🔥 DEKLARASI VARIABEL BARU UNTUK TOGGLE SANDI 🔥
let togglePasswordBtn, eyeIconOpen, eyeIconClosed;

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

// 🔥 FUNGSI BARU: Mengatur tampilan saat kembali ke daftar produk 🔥
function handleBackToProductsClick() {
  if (productDetailView) productDetailView.classList.add("hidden");
  if (managementView) managementView.classList.add("hidden"); // Pastikan Management View tersembunyi

  // Tampilkan kembali Daftar Produk
  if (productListWrapperElement)
    productListWrapperElement.classList.remove("hidden");

  // LOGIKA KONTROL BANNER: Banner hanya muncul jika user BUKAN penjual
  // Asumsi: sellerControls adalah elemen unik yang terlihat hanya oleh penjual.
  const isSellerLoggedIn = currentUser && sellerControls;

  if (isSellerLoggedIn) {
    // Jika Penjual, pastikan Banner disembunyikan
    if (mainBanner) mainBanner.classList.add("hidden");
  } else {
    // Jika Pembeli/Belum Login, tampilkan Banner
    if (mainBanner) mainBanner.classList.remove("hidden");
  }

  // Muat ulang produk
  loadProducts();
}

// 🔥 FUNGSI BARU: Mengelola penambahan/pengurangan kuantitas 🔥
function handleQuantityChange(increment) {
  if (!productQuantityInput || !detailStockInfo) return;

  let currentQty = parseInt(productQuantityInput.value);

  // Ambil stok dari detailStockInfo (Contoh: "Stok: 100")
  const maxStockText = detailStockInfo.textContent.match(/Stok: (\d+)/);
  const maxStock = maxStockText ? parseInt(maxStockText[1]) : 1000;

  let newQty = currentQty + (increment ? 1 : -1);

  // Batasan minimal (1)
  if (newQty < 1) {
    newQty = 1;
  }

  // Batasan maksimal (Stok)
  if (newQty > maxStock) {
    newQty = maxStock;
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "warning",
        title: "Stok Habis!",
        text: `Anda hanya dapat membeli hingga ${maxStock} unit.`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  }

  productQuantityInput.value = newQty;

  // Nonaktifkan tombol '-' jika Qty = 1
  if (qtyDecrementBtn) {
    qtyDecrementBtn.disabled = newQty === 1;
  }
  // Nonaktifkan tombol '+' jika Qty = Max Stock
  if (qtyIncrementBtn) {
    qtyIncrementBtn.disabled = newQty >= maxStock;
  }
}

// 🔥 FUNGSI BARU: Menampilkan detail produk saat card diklik 🔥
function handleProductCardClick(e) {
  const card = e.currentTarget;
  // Jika yang diklik adalah tombol edit/hapus, abaikan
  if (
    e.target.classList.contains("edit-btn") ||
    e.target.classList.contains("delete-btn")
  ) {
    return;
  }

  const productId = card.dataset.id;
  if (!productId) return;

  // Sembunyikan daftar produk, tampilkan detail view
  if (productListWrapperElement)
    productListWrapperElement.classList.add("hidden");
  if (managementView && !managementView.classList.contains("hidden"))
    managementView.classList.add("hidden");

  // 🔥 PERUBAHAN BARU: Sembunyikan Banner Utama 🔥
  if (mainBanner) mainBanner.classList.add("hidden");

  if (productDetailView) productDetailView.classList.remove("hidden");

  loadProductDetails(productId);
}
// 🔥 FUNGSI BARU: Memuat data detail produk 🔥
async function loadProductDetails(productId) {
  // Reset tampilan
  detailProductName.textContent = "Memuat...";
  detailProductPrice.textContent = "Rp 0";
  detailProductDescription.textContent = "Sedang memuat deskripsi...";
  detailShopNameText.textContent = "Toko Rahasia";
  detailProductImage.src =
    "https://via.placeholder.com/600x400.png?text=Memuat...";
  if (detailOwnerMessage) detailOwnerMessage.classList.add("hidden");

  if (mainBanner) mainBanner.classList.add("hidden");
  // Reset Kuantitas ke 1 dan aktifkan/nonaktifkan tombol
  if (productQuantityInput) productQuantityInput.value = 1;
  if (qtyDecrementBtn) qtyDecrementBtn.disabled = true;
  if (qtyIncrementBtn) qtyIncrementBtn.disabled = false;

  // Tampilkan info stok default
  if (detailStockInfo)
    detailStockInfo.textContent = "Stok: Sedang diperiksa...";

  // Dapatkan Elemen Tombol Aksi (untuk disembunyikan)
  const actionButtons = document.getElementById("detail-action-buttons");

  try {
    const productDoc = await db.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      detailProductName.textContent = "Produk Tidak Ditemukan";
      return;
    }

    const product = productDoc.data();

    // Ambil nama toko
    const sellerData = await getSellerData(product.ownerId);
    const shopName = sellerData.shopName || "Toko Rahasia";

    const price =
      typeof product.harga === "number"
        ? product.harga
        : parseInt(product.harga) || 0;
    const isOwner = currentUser && product.ownerId === currentUser.uid;
    const stok = product.stock !== undefined ? product.stock : 1000; // Menggunakan field 'stock'

    detailProductName.textContent = product.nama;
    detailProductPrice.textContent = `Rp ${price.toLocaleString("id-ID")}`;
    detailProductDescription.textContent =
      product.deskripsi || "Tidak ada deskripsi tersedia.";

    // **Mengganti placeholder gambar dengan yang lebih baik**
    detailProductImage.src =
      product.imageUrl || "https://picsum.photos/600/400?grayscale&blur=2";
    detailProductImage.alt = product.nama;

    detailShopNameText.textContent = shopName;

    // 🔥 KONTROL RESPONSIF (PEMILIK vs PEMBELI) 🔥

    if (isOwner) {
      // Tampilkan pesan jika user adalah pemilik
      if (detailOwnerMessage) {
        detailOwnerMessage.textContent =
          "Anda adalah pemilik produk ini. Fitur beli/keranjang dinonaktifkan.";
        detailOwnerMessage.classList.remove("hidden");
      }

      // 1. Sembunyikan Tombol Beli/Keranjang
      if (actionButtons) actionButtons.classList.add("hidden");

      // 2. Sembunyikan Kontrol Kuantitas
      if (quantityControlsWrapper)
        quantityControlsWrapper.classList.add("hidden");

      // 3. Sembunyikan Info Stok
      if (detailStockInfo) detailStockInfo.classList.add("hidden");
    } else {
      // Tampilkan kembali elemen untuk pembeli
      if (detailOwnerMessage) detailOwnerMessage.classList.add("hidden");

      // 1. Tampilkan Tombol Beli/Keranjang
      if (actionButtons) actionButtons.classList.remove("hidden");

      // 2. Tampilkan Kontrol Kuantitas
      if (quantityControlsWrapper)
        quantityControlsWrapper.classList.remove("hidden");

      // 3. Tampilkan Info Stok dan update nilainya
      if (detailStockInfo) detailStockInfo.classList.remove("hidden");
      if (detailStockInfo) detailStockInfo.textContent = `Stok: ${stok}`; // Update teks stok

      // Kontrol tombol kuantitas berdasarkan stok (hanya untuk pembeli)
      if (stok <= 0) {
        if (qtyIncrementBtn) qtyIncrementBtn.disabled = true;
        if (productQuantityInput) productQuantityInput.value = 0;
      } else {
        if (qtyIncrementBtn) qtyIncrementBtn.disabled = false;
        if (productQuantityInput) productQuantityInput.value = 1; // Kembali ke 1
      }
    }
  } catch (error) {
    console.error("Error loading product details:", error);
    detailProductName.textContent = "Gagal Memuat Produk";
    detailProductDescription.textContent = "Terjadi kesalahan koneksi.";
    detailProductImage.src =
      "https://via.placeholder.com/600x400.png?text=Error";
    if (detailStockInfo) detailStockInfo.textContent = "Stok: Tidak diketahui";
  }
}
function createProductCard(product) {
  const card = document.createElement("div");
  // KEY CHANGE: flex flex-col h-full untuk tampilan card yang seragam
  card.className =
    "product-card bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden flex flex-col h-full cursor-pointer border border-gray-100";

  card.dataset.id = product.id;

  const price =
    typeof product.harga === "number"
      ? product.harga
      : parseInt(product.harga) || 0;

  const isOwner = currentUser && product.ownerId === currentUser.uid;
  const shopName = product.shopName || "Toko Terpercaya";

  // Kontrol Penjual (Tombol Edit/Hapus)
  const ownerControls = isOwner
    ? `
        <div class="mt-3 flex space-x-2 border-t border-gray-100 pt-3">
            <button data-id="${product.id}" class="edit-btn text-xs font-semibold text-blue-500 hover:text-blue-700">Edit</button>
            <button data-id="${product.id}" class="delete-btn text-xs font-semibold text-red-500 hover:text-red-700">Hapus</button>
        </div>
    `
    : "";

  // Tombol Beli/Keranjang (Hanya jika bukan pemilik)
  const cartButton = isOwner
    ? ""
    : `
      <button class="w-full bg-yellow-400 text-gray-900 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-500 transition duration-200 shadow-sm">
          Keranjang
      </button>
  `;

  // Tampilan Nama Toko (Hanya jika bukan pemilik)
  const shopNameDisplay = isOwner
    ? ""
    : `
      <p class="text-xs font-semibold text-gray-700">
          <span class="text-gold-accent font-semibold">Toko:</span> ${shopName}
      </p>
    `;

  card.innerHTML = `
    <div class="relative overflow-hidden h-36 sm:h-40"> 
        <img
            src="${
              product.imageUrl ||
              "https://via.placeholder.com/400x300.png?text=Produk+Pilihan"
            }" 
            alt="${product.nama}" 
            class="w-full h-full object-cover"
        />
        <span class="absolute top-2 right-2 ${
          isOwner ? "bg-blue-600" : "bg-red-500"
        } text-white text-xs font-semibold px-2 py-1 rounded-lg shadow">
            ${isOwner ? "MILIK ANDA" : "Baru"}
        </span>
    </div>

    <div class="p-3 flex flex-col flex-grow">
        
        <h3 class="text-base font-bold text-gray-900 mb-1 truncate">
            ${product.nama}
        </h3>
        
        <div class="text-xs text-gray-700 mb-2 flex-grow">
            <p class="line-clamp-2 leading-tight text-gray-500">
                ${
                  product.deskripsi
                    ? product.deskripsi.substring(0, 100)
                    : "Deskripsi tidak tersedia."
                }
            </p>
        </div>

        <div class="mt-auto pt-2 border-t border-gray-100">
            
            <div class="md:hidden"> 
                ${shopNameDisplay} 
            </div>

            <div class="flex justify-between items-baseline mb-2">
                <p class="text-xl font-extrabold text-red-600">
                    Rp ${price.toLocaleString("id-ID")}
                </p>
                
                <div class="hidden md:block">
                    ${shopNameDisplay} 
                </div>
            </div>

            ${isOwner ? ownerControls : cartButton}
        </div>
    </div>
`;

  if (isOwner) {
    // Pastikan event listener dipasang pada tombol yang benar
    const deleteBtn = card.querySelector(".delete-btn");
    const editBtn = card.querySelector(".edit-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteProduct);
    if (editBtn) editBtn.addEventListener("click", handleEditClick);
  }

  // Event listener untuk Detail Produk tetap sama
  card.addEventListener("click", handleProductCardClick);

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
    if (salesChartInstance) {
      salesChartInstance.destroy();
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
  croppedFileBlob = null; // Pastikan reset blob saat edit

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

        // Asumsi ada input stock di HTML
        const stockInput = document.getElementById("product-stock");
        if (stockInput) stockInput.value = product.stock || 0;

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

// 🔥 FUNGSI PEMBANTU BARU: Mengunggah File/Blob ke Cloudinary 🔥
async function uploadImageToCloudinary(fileOrBlob) {
  const formData = new FormData();
  formData.append("file", fileOrBlob);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `dakata_shop/${currentUser.uid}`); // Tambahkan folder

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error.message || "Gagal mengunggah gambar ke Cloudinary."
      );
    }
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
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
  const stock = parseInt(document.getElementById("product-stock").value || 0);

  // File dari input (hanya jika user memilih file baru tanpa melalui crop)
  const fileFromInput = productImageFile.files[0];

  if (isNaN(harga) || harga <= 0) {
    uploadError.textContent = "Harga harus berupa angka positif.";
    uploadError.classList.remove("hidden");
    return;
  }

  if (isNaN(stock) || stock < 0) {
    uploadError.textContent = "Stok harus berupa angka positif atau nol.";
    uploadError.classList.remove("hidden");
    return;
  }

  // LOGIKA BARU UNTUK MEMERIKSA FILE/BLOB (Prioritaskan blob hasil crop)
  const fileToProcess = croppedFileBlob || fileFromInput;

  if (!isEditing && !fileToProcess) {
    uploadError.textContent = "Anda harus memilih foto produk.";
    uploadError.classList.remove("hidden");
    return;
  }

  setLoading(uploadSubmitBtn, true, originalText, loadingText);

  try {
    let imageUrl;

    if (fileToProcess) {
      // 🔥 GUNAKAN FUNGSI PEMBANTU UNTUK UPLOAD BLOB/FILE 🔥
      imageUrl = await uploadImageToCloudinary(fileToProcess);
      croppedFileBlob = null; // Reset setelah berhasil diupload
    } else if (isEditing) {
      imageUrl = imagePreview.src;
    }

    const productData = {
      nama: nama,
      harga: harga,
      deskripsi: deskripsi,
      stock: stock, // Tambahkan stok
      ownerId: currentUser.uid,
    };

    if (imageUrl) {
      productData.imageUrl = imageUrl;
    }

    if (isEditing) {
      productData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").doc(editingProductId).update(productData);
    } else {
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").add(productData);
    }

    uploadForm.reset();
    imagePreviewContainer.classList.add("hidden");
    uploadModal.classList.add("hidden");
    editingProductId = null;
    uploadModalTitle.textContent = "Upload Produk Baru";
    // Penting: Kembalikan atribut required setelah upload berhasil
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
  // Catatan: Dalam aplikasi nyata, ini akan ditarik dari koleksi 'transactions' yang difilter berdasarkan currentUser.uid
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
    // Konversi angka bulan ke nama bulan (opsional, tapi lebih user-friendly)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  });
  const chartValues = rawLabels.map((period) => salesData[period]);

  // HAPUS GRAFIK LAMA JIKA ADA
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded.");
    return;
  }

  // RENDERING GRAFIK MENGGUNAKAN CHART.JS
  const ctx = salesChartCanvas.getContext("2d");
  salesChartInstance = new Chart(ctx, {
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
                return "Rp " + (value / 1000000).toFixed(1) + "Jt"; // Diubah M -> Jt
              }
              if (value === 0) return "Rp 0";
              return "Rp " + (value / 1000).toFixed(0) + "k"; // Ditambahkan toFixed(0)
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

  // Reset ikon mata saat modal dibuka
  if (newPasswordInput) newPasswordInput.setAttribute("type", "password");
  if (eyeIconOpen) eyeIconOpen.classList.add("hidden");
  if (eyeIconClosed) eyeIconClosed.classList.remove("hidden");
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

// 🔥 FUNGSI BARU: Menerapkan Hasil Crop Gambar 🔥
function handleCropApply() {
  if (!cropperInstance) return;

  // 1. Ambil kanvas dari hasil cropping (misalnya 600x600)
  const croppedCanvas = cropperInstance.getCroppedCanvas({
    width: 600,
    height: 600,
  });

  // 2. Konversi kanvas menjadi Blob (file baru)
  croppedCanvas.toBlob(
    (blob) => {
      croppedFileBlob = blob; // Simpan blob ke variabel global (di Bagian 2)

      // 3. Tampilkan preview menggunakan data URL dari blob baru
      const reader = new FileReader();
      reader.onload = (event) => {
        if (imagePreview) {
          imagePreview.src = event.target.result;
        }
        if (imagePreviewContainer) {
          imagePreviewContainer.classList.remove("hidden");
        }
      };
      reader.readAsDataURL(blob);

      // 4. Tutup modal dan hancurkan cropper
      if (cropModal) cropModal.classList.add("hidden");
      if (cropperInstance) cropperInstance.destroy();
      cropperInstance = null;

      // Atur input file menjadi tidak wajib (karena kita sudah punya blob)
      if (productImageFile) productImageFile.removeAttribute("required");
    },
    "image/jpeg",
    0.9
  ); // Format JPEG dengan kualitas 90%
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
  // 🔥 Diperlukan untuk preview setelah crop/edit 🔥
  imagePreview = document.getElementById("image-preview");
  imagePreviewContainer = document.getElementById("image-preview-container");

  sellerControls = document.getElementById("seller-controls");
  sellerGreeting = document.getElementById("seller-greeting");

  // 🔥 INISIALISASI VARIABEL CROPPER BARU 🔥
  imageToCrop = document.getElementById("image-to-crop");
  cropModal = document.getElementById("crop-modal");
  closeCropModalBtn = document.getElementById("close-crop-modal-btn");
  applyCropBtn = document.getElementById("apply-crop-btn");
  // ------------------------------------------

  // 🔥 INISIALISASI VARIABEL DETAIL PRODUK 🔥
  productDetailView = document.getElementById("product-detail-view");
  productListWrapperElement = document.getElementById("product-list-wrapper");
  backToProductsBtn = document.getElementById("back-to-products-btn");
  detailProductName = document.getElementById("detail-product-name");
  detailProductPrice = document.getElementById("detail-product-price");
  detailProductDescription = document.getElementById(
    "detail-product-description"
  );
  detailProductImage = document.getElementById("detail-product-image");
  detailShopNameText = document.getElementById("detail-shop-name-text");
  detailOwnerMessage = document.getElementById("detail-owner-message");

  // 🔥 INISIALISASI VARIABEL KUANTITAS BARU (SOLUSI UNTUK TOMBOL + / -) 🔥
  qtyDecrementBtn = document.getElementById("qty-decrement");
  qtyIncrementBtn = document.getElementById("qty-increment");
  productQuantityInput = document.getElementById("product-quantity");
  detailStockInfo = document.getElementById("detail-stock-info");
  quantityControlsWrapper = document.getElementById("detail-qty-control");
  // -------------------------------------------------

  // 🔥 INISIALISASI VARIABEL TOGGLE SANDI LOGIN (PASTIKAN ADA) 🔥
  authPasswordInput = document.getElementById("auth-password");
  toggleAuthPasswordBtn = document.getElementById(
    "toggle-auth-password-visibility"
  );
  authEyeIconOpen = document.getElementById("auth-eye-icon-open");
  authEyeIconClosed = document.getElementById("auth-eye-icon-closed");

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

  // 🔥 INISIALISASI VARIABEL TOGGLE SANDI 🔥
  togglePasswordBtn = document.getElementById("toggle-password-visibility");
  eyeIconOpen = document.getElementById("eye-icon-open");
  eyeIconClosed = document.getElementById("eye-icon-closed");

  // --- EVENT LISTENERS ---

  // 1. Produk Upload/Edit
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      editingProductId = null;
      croppedFileBlob = null; // Reset blob saat membuka modal upload baru
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
      croppedFileBlob = null; // Reset blob saat menutup modal
      uploadModalTitle.textContent = "Upload Produk Baru";
      uploadSubmitBtn.textContent = "Simpan Produk";
      if (productImageFile)
        productImageFile.setAttribute("required", "required");
    });
  }
  if (uploadForm) uploadForm.addEventListener("submit", handleSubmitProduct);

  // 🔥 1.1. Event Listener CROPPER (Disesuaikan dengan Debugging) 🔥
  if (productImageFile) {
    productImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log("1. File dipilih. Memulai FileReader...");
        // Hapus preview lama agar tidak misleading
        if (imagePreviewContainer)
          imagePreviewContainer.classList.add("hidden");

        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("2. Gambar berhasil dimuat oleh FileReader.");

          if (imageToCrop) {
            imageToCrop.src = event.target.result;
            console.log(
              "3. imageToCrop (img element) berhasil disetel src-nya."
            );
          } else {
            console.error(
              "ERROR: Elemen #image-to-crop tidak ditemukan (NULL)!"
            );
            return; // Hentikan proses jika elemen tidak ada
          }

          if (cropModal) {
            cropModal.classList.remove("hidden");
            console.log("4. cropModal berhasil ditampilkan.");
          } else {
            console.error("ERROR: Elemen #crop-modal tidak ditemukan (NULL)!");
            return; // Hentikan proses jika elemen tidak ada
          }

          // Inisialisasi Cropper.js (setelah gambar dimuat)
          setTimeout(() => {
            if (typeof Cropper === "undefined") {
              console.error("ERROR: Cropper.js library tidak dimuat!");
              return;
            }

            if (cropperInstance) cropperInstance.destroy();

            // Pastikan imageToCrop sudah ada di DOM sebelum inisialisasi
            if (imageToCrop) {
              cropperInstance = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 1,
              });
              console.log("5. Cropper.js berhasil diinisialisasi.");
            }
          }, 100);
        };
        reader.readAsDataURL(file);
      } else {
        if (imagePreviewContainer)
          imagePreviewContainer.classList.add("hidden");
        console.log("File selection dibatalkan.");
      }
    });
  }

  // 🔥 1.2. Event Listener untuk Crop Modal 🔥
  if (closeCropModalBtn) {
    closeCropModalBtn.addEventListener("click", () => {
      if (cropModal) cropModal.classList.add("hidden");
      if (cropperInstance) cropperInstance.destroy();
      if (productImageFile) productImageFile.value = ""; // Kosongkan input file
      croppedFileBlob = null; // Batalkan crop
    });
  }

  if (applyCropBtn) {
    applyCropBtn.addEventListener("click", handleCropApply);
  }
  // ------------------------------------------

  // 2. Autentikasi
  if (authBtn) {
    authBtn.addEventListener("click", () => {
      if (!currentUser) {
        authModal.classList.remove("hidden");

        // 🔥 Reset Sandi Login saat modal dibuka 🔥
        if (authPasswordInput)
          authPasswordInput.setAttribute("type", "password");
        if (authEyeIconOpen) authEyeIconOpen.classList.add("hidden");
        if (authEyeIconClosed) authEyeIconClosed.classList.remove("hidden");
        // ------------------------------------------
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

  // 🔥 5. Toggle Password Visibility (Profile) 🔥
  if (togglePasswordBtn && newPasswordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const type =
        newPasswordInput.getAttribute("type") === "password"
          ? "text"
          : "password";
      newPasswordInput.setAttribute("type", type);

      // Toggle ikon mata
      eyeIconOpen.classList.toggle("hidden");
      eyeIconClosed.classList.toggle("hidden");
    });
  }

  // 🔥 6. Toggle Password Visibility (Form Login) 🔥
  if (toggleAuthPasswordBtn && authPasswordInput) {
    toggleAuthPasswordBtn.addEventListener("click", () => {
      const type =
        authPasswordInput.getAttribute("type") === "password"
          ? "text"
          : "password";
      authPasswordInput.setAttribute("type", type);

      // Toggle ikon mata
      authEyeIconOpen.classList.toggle("hidden");
      authEyeIconClosed.classList.toggle("hidden");
    });
  }

  // 🔥 7. Event Listener untuk Tombol Kembali ke Daftar Produk (Detail View) 🔥
  if (backToProductsBtn) {
    backToProductsBtn.addEventListener("click", handleBackToProductsClick);
  }

  // 🔥 8. Event Listener untuk Tombol Kuantitas Produk (Detail View) 🔥
  if (qtyIncrementBtn) {
    qtyIncrementBtn.addEventListener("click", () => handleQuantityChange(true));
  }
  if (qtyDecrementBtn) {
    qtyDecrementBtn.addEventListener("click", () =>
      handleQuantityChange(false)
    );
  }

  // Inisialisasi awal: tombol decrement harus nonaktif jika kuantitas awal 1
  if (qtyDecrementBtn && productQuantityInput) {
    qtyDecrementBtn.disabled = parseInt(productQuantityInput.value) === 1;
  }

  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener("click", () => {
      // Logika untuk menyembunyikan modal upload
      uploadModal.classList.add("hidden");

      // Opsional: Reset form dan tampilkan kembali tombol upload
      uploadForm.reset();
      imagePreviewContainer.classList.add("hidden");
      productImageFile.setAttribute("required", "required");

      // Reset mode editing
      editingProductId = null;
      uploadModalTitle.textContent = "Upload Produk Baru";
      uploadSubmitBtn.textContent = "Simpan Produk";
    });
  }

  // loadProducts() dipanggil otomatis oleh auth.onAuthStateChanged
});

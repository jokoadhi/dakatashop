/**
 * =================================================================
 * SCRIPT.JS - MULTI-SELLER E-COMMERCE LOGIC LENGKAP (VERSI FINAL)
 * =================================================================
 */

/**
 * Menampilkan notifikasi peringatan bahwa aplikasi masih dalam tahap pengembangan.
 */
function showDevelopmentWarning() {
  // Cek apakah SweetAlert2 (Swal) tersedia sebelum dipanggil
  if (typeof Swal === "undefined") {
    console.warn(
      "SweetAlert2 (Swal) library tidak ditemukan. Lewati notifikasi."
    );
    return;
  }

  Swal.fire({
    icon: "warning", // Menggunakan ikon peringatan
    title: "⚠️ Aplikasi Dalam Tahap Pengembangan (Beta) ⚠️",
    html: `
            <p class="text-center">
                Mohon diperhatikan bahwa aplikasi ini masih berada dalam
                <b>tahap pengembangan dan pengujian (Beta)</b>.
            </p>
            <p class="mt-4 text-sm text-red-600 font-semibold text-center">
                Jika menemukan <b>bug, error, atau tampilan yang tidak sesuai</b>,
                mohon segera kontak developer melalui kontak yang tersedia.
            </p>
            <p class="mt-4 text-center">Kontribusi sangat kami hargai!</p>
        `,
    confirmButtonText: "Saya Mengerti",
    confirmButtonColor: "#22C55E", // Warna hijau (green-500)
    allowOutsideClick: false, // Wajibkan pengguna menekan tombol
    allowEscapeKey: false,
  });
}

// -----------------------------------------------------------------
// BAGIAN 1: VARIABEL GLOBAL, KONFIGURASI, DAN INISIALISASI FIREBASE
// -----------------------------------------------------------------

// 🔥 KONFIGURASI CLOUDINARY 🔥
const CLOUDINARY_CLOUD_NAME = "daw7yn6jp";
const CLOUDINARY_UPLOAD_PRESET = "dakata-upload-preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// --- VARIABEL GLOBAL SKRIP ---
let currentUser = null; // Menyimpan objek user yang sedang login
let editingProductId = null; // Menyimpan ID produk yang sedang diedit
let cropperInstance = null; // Menyimpan instance Cropper.js
let croppedFileBlob = null; // Menyimpan blob file gambar yang sudah di-crop
let isInitialLoad = true; // Flag untuk mencegah notifikasi login saat pemuatan awal
let salesChartInstance = null; // Menyimpan instance Chart.js
let currentPeriodFilter = 12; // Default 12 Bulan (1 Tahun)
let themeToggle;
const STORAGE_KEY = "themePreference";
const MAX_HISTORY_ITEMS = 5;
const SEARCH_HISTORY_KEY = "dakataShopSearchHistory";

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
// BAGIAN 2: DEKLARASI VARIABEL DOM
// -----------------------------------------------------------------

// 🔥 DEKLARASI VARIABEL DOM UTAMA 🔥
let productListDiv,
  mainBanner,
  productListTitleElement,
  authBtn,
  authModal,
  authForm,
  authTitle,
  authSubmitBtn,
  toggleAuthMode,
  toggleAuthLink,
  adminRegisterInfo,
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

// Data yang akan dibawa dari Detail Produk ke Formulir Order
let currentOrderQuantity = 1;
let currentOrderSellerPhone = "";
let currentOrderProductDetail = null;

let cartView;
let cartItemsContainer;
let cartTotalPrice;
let checkoutBtn;
let backToProductsFromCartBtn;
let productListView;

let cachedOrders = [];

// Variabel untuk menyimpan semua data produk yang dimuat dari Firebase
let ALL_PRODUCTS_CACHE = [];
let isHomePage = false;
let currentView = "products";
let isExiting = false; // Flag untuk mencegah popstate loop setelah konfirmasi keluar
let sellerSalesChartInstance = null;

// Variabel DOM baru
let orderDetailView;
let backToDetailBtn;
let orderForm;
let buyerNameInput;
let buyerPhoneInput;
let buyerAddressInput;
let orderSubmitBtn;
let orderError;
let orderProductSummary;
let orderTotalPrice;
let buyNowBtn;
let currentProductDetail = null;
let currentSellerPhone = "";
let isOrderSent = false;
let isMultiItemCheckout = false;

let searchBtn,
  searchOverlay,
  searchInput,
  closeSearchBtn,
  mainNav,
  logoLink,
  executeSearchBtn;

// 🔥 VARIABEL INPUT AUTH KHUSUS REGISTER 🔥
let authRoleGroup, authRoleInput;
let authPhoneInput, authAddressInput;
let authPhoneGroup, authAddressGroup; // Container div

// Variabel global untuk menyimpan fungsi unsubscribe listener order
let unsubscribeOrders = null;
let unsubscribeNotifications = null;

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
  qtyDecrementBtn,
  qtyIncrementBtn,
  productQuantityInput,
  detailStockInfo,
  quantityControlsWrapper;

// 🔥 VARIABEL UNTUK CROPPER 🔥
let imageToCrop;
let cropModal, closeCropModalBtn, applyCropBtn;

/// Struktur Data Keranjang
let cart = loadCartFromLocalStorage(); // Harus memanggil fungsi load di sini
let chartDataForSeller = {
  labels: [],
  datasets: [
    {
      label: "Penjualan Bersih (Rp)",
      data: [],
      backgroundColor: "#3b82f6", // blue-500
    },
  ],
};

// Elemen DOM Keranjang
let cartCount; // Badge jumlah item di header
let addToCartBtn; // Tombol 'Masukkan Keranjang' di Detail View

// 🔥 DEKLARASI VARIABEL MANAGEMENT 🔥
let manageBtn,
  managementView,
  totalSaldo,
  totalTerjual,
  totalTransaksi,
  transactionHistory,
  productListWrapper;

// 🔥 DEKLARASI VARIABEL ADMIN 🔥
let adminBtn, adminView, customerListTableBody, addUserBtn;

// 🔥 VARIABEL TOGGLE SANDI 🔥
let authPasswordInput,
  toggleAuthPasswordBtn,
  authEyeIconOpen,
  authEyeIconClosed;

// 🔥 DEKLARASI VARIABEL GRAFIK & PROFIL 🔥
let salesChartCanvas;
let profileBtn, profileModal, closeProfileModalBtn;

// 🔥 VARIABEL PROFIL TOKO & KONTAK 🔥
let updateShopForm, shopNameInput, shopNameError, shopNameSubmitBtn;
let updateContactForm,
  profilePhoneInput,
  profileAddressInput,
  contactSubmitBtn,
  contactError;

// 🔥 VARIABEL PROFIL SANDI 🔥
let updatePasswordForm, newPasswordInput, passwordError, passwordSubmitBtn;
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
async function getSellerData(uid) {
  try {
    const doc = await db.collection("sellers").doc(uid).get();

    if (doc.exists) {
      const data = doc.data();

      return {
        shopName: data.shopName,
        role: data.role || "biasa",
        phone: data.phone || "",
        address: data.address || "",
      };
    } else {
      const defaultShopName =
        currentUser.email.split("@")[0].charAt(0).toUpperCase() +
        currentUser.email.split("@")[0].slice(1) +
        " Store";

      const newSellerData = {
        email: currentUser.email,
        shopName: defaultShopName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        role: "biasa",
        phone: "",
        address: "",
      };

      await db.collection("sellers").doc(uid).set(newSellerData);

      return {
        shopName: defaultShopName,
        role: "biasa",
        phone: "",
        address: "",
      };
    }
  } catch (error) {
    console.error("Error fetching seller data:", error);
    return {
      shopName: "Toko Rahasia",
      role: "biasa",
      phone: "",
      address: "",
    };
  }
}
// Asumsi: cartItemsContainer, cartTotalPrice, handleRemoveFromCart sudah dideklarasikan global dan diinisialisasi
function renderCartItems() {
  if (!cartItemsContainer || !cartTotalPrice) return;

  // 1. Kosongkan wadah dan cari kembali pesan 'Keranjang Kosong'
  // NOTE: Jika emptyMessage dipindahkan ke luar container, cari di document.
  const emptyMessage = document.getElementById("empty-cart-message");

  cartItemsContainer.innerHTML = ""; // Bersihkan semua item lama dan pesan kosong

  let totalBelanja = 0;

  if (cart.length === 0) {
    // Tampilkan pesan kosong jika keranjang benar-benar kosong
    if (emptyMessage) {
      cartItemsContainer.appendChild(emptyMessage);
      emptyMessage.classList.remove("hidden");
    }
    cartTotalPrice.textContent = "Rp 0";

    // Nonaktifkan tombol checkout
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  // Sembunyikan pesan kosong jika ada item (hanya perlu jika pesan kosong ada di DOM)
  if (emptyMessage) emptyMessage.classList.add("hidden");

  // Aktifkan tombol checkout
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.disabled = false;

  // 2. Iterasi dan buat elemen HTML untuk setiap item
  cart.forEach((item) => {
    // Pastikan harga adalah angka
    const itemPrice = Number(item.price) || 0;

    const itemTotal = itemPrice * item.quantity;
    totalBelanja += itemTotal;

    // Gunakan URL gambar yang disimpan, dengan fallback
    const imageSource = item.image || "https://via.placeholder.com/64";

    const cartItemElement = document.createElement("div");
    cartItemElement.className =
      "flex items-center justify-between border-b pb-4 pt-4 first:pt-0";
    cartItemElement.innerHTML = `
            <div class="flex items-center space-x-4 flex-grow">
                <img 
                    src="${imageSource}" 
                    alt="${item.nama}" 
                    class="w-16 h-16 object-cover rounded-md flex-shrink-0"
                >
                <div class="flex-grow">
                    <p class="font-semibold text-gray-800 line-clamp-2">${
                      item.nama
                    }</p>
                    <p class="text-sm text-gray-500">${item.shopName}</p>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="text-sm font-bold text-red-600">Rp ${itemPrice.toLocaleString(
                          "id-ID"
                        )}</span>
                        <span class="text-xs text-gray-400">x ${
                          item.quantity
                        }</span>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col items-end space-y-2 ml-4">
                <span class="font-bold text-lg text-navy-blue whitespace-nowrap">
                    Rp ${itemTotal.toLocaleString("id-ID")}
                </span>
                <button 
                    data-id="${item.productId}" 
                    class="remove-from-cart-btn text-xs font-semibold text-red-500 hover:text-red-700 transition duration-200"
                >
                    Hapus
                </button>
            </div>
        `;
    cartItemsContainer.appendChild(cartItemElement);
  });

  // 3. Perbarui Total Belanja
  cartTotalPrice.textContent = `Rp ${totalBelanja.toLocaleString("id-ID")}`;

  // 4. Pasang Listener Hapus
  document.querySelectorAll(".remove-from-cart-btn").forEach((button) => {
    // 🔥 Pastikan handleRemoveFromCart tersedia sebelum dipasang
    if (typeof handleRemoveFromCart === "function") {
      button.addEventListener("click", handleRemoveFromCart);
    } else {
      console.error("Fungsi handleRemoveFromCart belum terdefinisi!");
    }
  });
}

function renderProductList(products) {
  if (!productListDiv) return;

  productListDiv.innerHTML = "";
  const currentUserId = currentUser ? currentUser.uid : null;

  if (products.length === 0) {
    const emptyMessage = currentUserId
      ? 'Anda belum menambahkan produk apa pun. Gunakan tombol "Upload Produk" untuk memulai.'
      : "Belum ada produk dalam koleksi ini. Silakan masuk sebagai penjual untuk menambahkan item baru.";

    productListDiv.innerHTML = `
            <div class="text-center py-10 col-span-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7m-4 5h4m-4 0v4m-4-4v4m-4-4v4" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada produk</h3>
                <p class="mt-1 text-sm text-gray-500">${emptyMessage}</p>
            </div>
        `;
    return;
  }

  productListDiv.className =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  products.forEach((product) => {
    const productElement = createProductCard(product);
    productListDiv.appendChild(productElement);
  });
}

async function loadProducts() {
  const productListDiv = document.getElementById("product-list"); // Asumsi ID elemen container Anda
  const productListTitleElement = document.getElementById("product-list-title"); // Asumsi ID elemen judul Anda

  if (!productListDiv) return;

  try {
    // 🔥🔥🔥 PENYESUAIAN GRID: Mobile 2, Tablet 4, Desktop 6 🔥🔥🔥
    productListDiv.className =
      "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4 p-4";
    // 🔥🔥🔥 AKHIR PENYESUAIAN GRID 🔥🔥🔥

    // 🔥 LOGIKA PENGGANTIAN JUDUL 🔥
    if (productListTitleElement) {
      // Cek langsung apakah elemen ditemukan
      if (currentUser && currentUser.uid) {
        // Pastikan currentUser ada dan memiliki UID
        // Mode Pengguna (Sudah Login)
        productListTitleElement.textContent = "Daftar Produk"; // Atau "Daftar Produk Anda"
      } else {
        // Mode Publik (Belum Login)
        productListTitleElement.textContent = "Pilihan Produk"; // Atau "Pilihan Produk Terbaik"
      }
    }
    // -----------------------------------------------------------

    productListDiv.innerHTML = "";

    const loadingMessageElement = document.createElement("div");
    loadingMessageElement.id = "loading-message";
    loadingMessageElement.className =
      "p-6 bg-white rounded-xl shadow-lg text-center col-span-full";
    loadingMessageElement.innerHTML =
      '<p class="text-lg text-gray-500">Memuat katalog produk...</p><div class="mt-3 h-2 w-1/4 bg-gray-200 rounded animate-pulse mx-auto"></div>';
    productListDiv.appendChild(loadingMessageElement);

    let productsRef = db.collection("products").orderBy("createdAt", "desc");

    if (currentUser && currentUser.uid) {
      productsRef = productsRef.where("ownerId", "==", currentUser.uid);
      console.log(
        "DEBUG: Mode Penjual. Filter produk berdasarkan UID:",
        currentUser.uid
      );
    } else {
      console.log("DEBUG: Mode Publik. Memuat semua produk.");
    }

    const snapshot = await productsRef.get();

    const currentLoadingMessage = document.getElementById("loading-message");
    if (currentLoadingMessage) currentLoadingMessage.remove();

    if (snapshot.empty) {
      const emptyMessage = currentUser
        ? "Anda belum menambahkan produk apa pun."
        : "Saat ini, belum ada produk yang tersedia. Silakan cek lagi nanti.";

      productListDiv.innerHTML = `<p class="text-center col-span-full text-xl py-10 text-gray-500 italic">${emptyMessage}</p>`;
      ALL_PRODUCTS_CACHE = [];
      return;
    }

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

    // ------------------------------------------------------------------
    // CACHING DAN KONVERSI KE PROPERTI 'nama'
    // ------------------------------------------------------------------
    ALL_PRODUCTS_CACHE = products.map((product) => {
      const transformedProduct = {
        ...product,
        shopName: sellerNamesMap[product.ownerId] || "Toko Unknown",
        nama: product.nama || product.name,
      };

      // Hapus properti 'name' yang lama (jika ada) untuk kebersihan
      delete transformedProduct.name;

      return transformedProduct;
    });
    // ------------------------------------------------------------------

    // Panggil fungsi render yang baru untuk menampilkan semua produk dari cache
    renderFilteredProducts(ALL_PRODUCTS_CACHE);
  } catch (error) {
    console.error("Error memuat produk: ", error);
    productListDiv.innerHTML =
      '<p class="text-center col-span-full text-xl py-10 text-red-500">Koneksi ke database gagal. Periksa Firebase atau jaringan Anda.</p>';
  }
}

function handleBackToProductsClick() {
  // 🔥 TAMBAHKAN PENYEMBUNYIAN CART VIEW
  if (productDetailView) productDetailView.classList.add("hidden");
  if (managementView) managementView.classList.add("hidden");
  if (adminView) adminView.classList.add("hidden");

  // 🔥 SEMBUNYIKAN TAMPILAN KERANJANG
  if (cartView) cartView.classList.add("hidden");

  // Tampilkan daftar produk utama
  if (productListWrapperElement)
    productListWrapperElement.classList.remove("hidden");

  const isSellerLoggedIn = currentUser && sellerControls;

  // Logika Menampilkan/Menyembunyikan Banner
  if (isSellerLoggedIn) {
    // Penjual tidak perlu banner
    if (mainBanner) mainBanner.classList.add("hidden");
  } else {
    // Pengguna publik/pembeli perlu banner (yang sempat disembunyikan di cartView)
    if (mainBanner) mainBanner.classList.remove("hidden");
  }

  // Reset Tampilan Tombol Management
  if (manageBtn) {
    manageBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
        </svg>
        Management
    `;
  }

  // Reset Tampilan Tombol Admin
  if (adminBtn) {
    adminBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        Admin (Pelanggan)
    `;
  }

  loadProducts();
}

function handleQuantityChange(increment) {
  if (!productQuantityInput || !detailStockInfo) return;

  let currentQty = parseInt(productQuantityInput.value);
  const maxStockText = detailStockInfo.textContent.match(/Stok: (\d+)/);
  const maxStock = maxStockText ? parseInt(maxStockText[1]) : 1000;

  let newQty = currentQty + (increment ? 1 : -1);

  if (newQty < 1) {
    newQty = 1;
  }

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

  if (qtyDecrementBtn) {
    qtyDecrementBtn.disabled = newQty === 1;
  }
  if (qtyIncrementBtn) {
    qtyIncrementBtn.disabled = newQty >= maxStock;
  }
}

function handleProductCardClick(e) {
  const card = e.currentTarget;
  if (
    e.target.classList.contains("edit-btn") ||
    e.target.classList.contains("delete-btn")
  ) {
    return;
  }

  const productId = card.dataset.id;
  if (!productId) return;

  if (productListWrapperElement)
    productListWrapperElement.classList.add("hidden");
  if (managementView) managementView.classList.add("hidden");
  if (adminView) adminView.classList.add("hidden");
  if (mainBanner) mainBanner.classList.add("hidden");

  if (productDetailView) productDetailView.classList.remove("hidden");

  loadProductDetails(productId);
}

// Asumsi variabel global di luar fungsi:
// let currentProductDetail = null;
// let currentSellerPhone = '';
// const detailProductName = document.getElementById("detail-product-name"); // dan seterusnya...

async function loadProductDetails(productId) {
  // --- INISIALISASI TAMPILAN AWAL ---
  const detailProductName = document.getElementById("detail-product-name");
  const detailProductPrice = document.getElementById("detail-product-price");
  const detailProductDescription = document.getElementById(
    "detail-product-description"
  );
  const detailShopNameText = document.getElementById("detail-shop-name-text");
  const detailProductImage = document.getElementById("detail-product-image");
  const detailStockInfo = document.getElementById("detail-stock-info");
  const detailOwnerMessage = document.getElementById("detail-owner-message");
  const detailShopAddressText = document.getElementById(
    "detail-shop-address-text"
  );
  const detailShopAddressWrapper = document.getElementById(
    "detail-shop-address-wrapper"
  );
  const actionButtons = document.getElementById("detail-action-buttons");
  const quantityControlsWrapper = document.getElementById("detail-qty-control");
  const productQuantityInput = document.getElementById(
    "product-quantity-input"
  );
  const qtyDecrementBtn = document.getElementById("qty-decrement-btn");
  const qtyIncrementBtn = document.getElementById("qty-increment-btn");
  const detailDiscountBadge = document.getElementById("detail-discount-badge");

  detailProductName.textContent = "Memuat...";
  detailProductPrice.innerHTML = "Rp 0";
  detailProductDescription.textContent = "Sedang memuat deskripsi...";
  detailShopNameText.textContent = "Toko Rahasia";

  if (detailShopAddressText)
    detailShopAddressText.textContent = "Memuat Alamat...";

  detailProductImage.src =
    "https://via.placeholder.com/600x400.png?text=Memuat...";
  if (detailOwnerMessage) detailOwnerMessage.classList.add("hidden");
  if (detailDiscountBadge) detailDiscountBadge.classList.add("hidden");

  if (mainBanner) mainBanner.classList.add("hidden");

  if (productQuantityInput) productQuantityInput.value = 1;
  if (qtyDecrementBtn) qtyDecrementBtn.disabled = true;
  if (qtyIncrementBtn) qtyIncrementBtn.disabled = false;

  if (detailStockInfo)
    detailStockInfo.textContent = "Stok: Sedang diperiksa...";

  // Reset variabel global (Asumsi variabel ini didefinisikan di luar fungsi)
  currentProductDetail = null;
  currentProduct = null;
  currentSellerPhone = "";

  try {
    const productDoc = await db.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      detailProductName.textContent = "Produk Tidak Ditemukan";
      if (detailStockInfo) detailStockInfo.textContent = "Stok: N/A";
      if (detailShopAddressWrapper)
        detailShopAddressWrapper.classList.add("hidden");
      return;
    }

    const product = productDoc.data();

    // Pastikan stok adalah angka
    const stok = product.stock !== undefined ? parseInt(product.stock) : 1000;

    const sellerData = await getSellerData(product.ownerId);
    const shopName = sellerData.shopName || "Toko Rahasia";
    const shopAddress = sellerData.address || "Lokasi tidak tersedia.";
    const sellerPhone = sellerData.phone || null;

    // 🔥🔥🔥 LOGIKA HARGA DISKON DI DETAIL PRODUK 🔥🔥🔥
    const hargaAsli =
      typeof product.harga === "number"
        ? product.harga
        : parseInt(product.harga) || 0;

    const hargaDiskon =
      typeof product.hargaDiskon === "number" &&
      product.hargaDiskon > 0 &&
      product.hargaDiskon < hargaAsli
        ? product.hargaDiskon
        : null;

    const isOnDiscount = hargaDiskon !== null;
    const finalPrice = isOnDiscount ? hargaDiskon : hargaAsli; // Harga yang digunakan untuk Order
    // 🔥🔥🔥 AKHIR LOGIKA HARGA DISKON 🔥🔥🔥

    const isOwner = currentUser && product.ownerId === currentUser.uid;

    // 🔥 PENGISIAN VARIABEL GLOBAL UNTUK FUNGSI ORDER 🔥
    const finalProductData = {
      ...product, // Salin semua data produk
      id: productDoc.id,
      price: finalPrice, // Harga yang akan dibayarkan (diskon atau asli)

      // 🔥 TAMBAHAN KRITIS: Menyimpan data harga asli dan diskon 🔥
      hargaAsli: hargaAsli,
      hargaDiskon: hargaDiskon,
      // ---------------------------------------------------------

      shopName: shopName,
      shopPhone: sellerPhone,
      ownerId: product.ownerId,
    };

    currentProductDetail = finalProductData;
    currentProduct = finalProductData;
    currentSellerPhone = sellerPhone;

    // --- UPDATE DATA PRODUK KE DOM ---
    detailProductName.textContent = product.nama;
    detailProductDescription.textContent =
      product.deskripsi || "Tidak ada deskripsi tersedia.";

    detailProductImage.src =
      product.imageUrl || "https://picsum.photos/600/400?grayscale&blur=2";
    detailProductImage.alt = product.nama;

    detailShopNameText.textContent = shopName;

    // 🔥🔥🔥 TAMPILAN HARGA (SESUAI DISKON) - FONT DISKON KEMBALI KE 4XL 🔥🔥🔥
    if (isOnDiscount) {
      detailProductPrice.innerHTML = `
            <div class="flex flex-col items-start w-full">
                
                <div class="flex justify-between items-center w-full mb-1">
                    <p class="text-xl text-gray-500 line-through">
                        Rp ${hargaAsli.toLocaleString("id-ID")}
                    </p>
                    <span class="text-base font-bold text-red-700 bg-red-200 px-3 py-1 rounded-full whitespace-nowrap">
                        Harga Diskon
                    </span>
                </div>
                
                <p class="text-4xl font-extrabold text-red-600 dark:text-red-400">
                    Rp ${hargaDiskon.toLocaleString("id-ID")}
                </p>
            </div>
        `;
      if (detailDiscountBadge) {
        detailDiscountBadge.classList.remove("hidden");
        detailDiscountBadge.textContent = "Diskon Spesial!";
      }
    } else {
      // Hanya tampilkan harga asli (Kembali ke 4XL)
      detailProductPrice.innerHTML = `
            <p class="text-4xl font-extrabold text-red-600 dark:text-red-400">
                Rp ${hargaAsli.toLocaleString("id-ID")}
            </p>
        `;
      if (detailDiscountBadge) {
        detailDiscountBadge.classList.add("hidden");
      }
    }
    // 🔥🔥🔥 AKHIR TAMPILAN HARGA 🔥🔥🔥

    // --- LOGIKA KEPEMILIKAN (PENJUAL) ---
    if (isOwner) {
      // Penjual (Pemilik Produk)
      if (detailOwnerMessage) {
        detailOwnerMessage.textContent =
          "Anda adalah pemilik produk ini. Hanya menampilkan informasi inventaris.";
        detailOwnerMessage.classList.remove("hidden");
      }

      if (actionButtons) actionButtons.classList.add("hidden");
      if (quantityControlsWrapper)
        quantityControlsWrapper.classList.add("hidden");

      if (detailShopAddressWrapper) {
        detailShopAddressWrapper.classList.add("hidden");
      }

      if (detailDiscountBadge) detailDiscountBadge.classList.add("hidden");

      if (detailStockInfo) {
        detailStockInfo.classList.remove("hidden");
        detailStockInfo.textContent = `Stok Saat Ini: ${
          stok > 0 ? stok : "Habis"
        }`;
        detailStockInfo.classList.add("font-bold", "text-lg", "text-green-600");
      }
    } else {
      // Pembeli (Bukan Pemilik Produk / Publik)
      if (detailOwnerMessage) detailOwnerMessage.classList.add("hidden");

      if (detailShopAddressWrapper) {
        detailShopAddressWrapper.classList.remove("hidden");
      }

      if (detailShopAddressText) {
        detailShopAddressText.textContent = shopAddress;
      }

      if (actionButtons) actionButtons.classList.remove("hidden");
      if (quantityControlsWrapper)
        quantityControlsWrapper.classList.remove("hidden");

      if (detailStockInfo) {
        detailStockInfo.classList.remove("hidden");
        detailStockInfo.textContent = `Stok: ${stok > 0 ? stok : "Habis"}`;
        detailStockInfo.classList.remove(
          "font-bold",
          "text-lg",
          "text-green-600"
        );
      }

      // Kontrol Kuantitas untuk Pembeli
      if (stok <= 0 || !sellerPhone) {
        if (qtyIncrementBtn) qtyIncrementBtn.disabled = true;
        if (productQuantityInput) productQuantityInput.value = 0;
        if (productQuantityInput) productQuantityInput.disabled = true;
        if (actionButtons) actionButtons.classList.add("hidden");

        if (detailStockInfo) {
          detailStockInfo.textContent = !sellerPhone
            ? "Toko tidak menyediakan kontak order."
            : "Stok: Habis";
          detailStockInfo.classList.add("text-red-500");
        }
      } else {
        if (qtyIncrementBtn) qtyIncrementBtn.disabled = false;
        if (productQuantityInput) productQuantityInput.value = 1;
        if (productQuantityInput) productQuantityInput.disabled = false;
        if (actionButtons) actionButtons.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error("Error loading product details:", error);
    // ... (Penanganan error) ...
    detailProductName.textContent = "Gagal Memuat Produk";
    detailProductDescription.textContent = "Terjadi kesalahan koneksi.";
    detailProductImage.src =
      "https://via.placeholder.com/600x400.png?text=Error";
    if (detailShopAddressWrapper) {
      detailShopAddressWrapper.classList.add("hidden");
    }
  }
}

// --- Fungsi untuk Mendapatkan Warna Teks Chart Sesuai Tema ---
function getChartTextColor() {
  // Cek apakah body memiliki class 'dark-mode'
  const isDarkMode = document.body.classList.contains("dark-mode");
  return isDarkMode ? "#f3f4f6" : "#1f2937"; // Menggunakan warna dari --text-color
}

// FUNGSI BARU: MENDAPATKAN WARNA UNTUK GRAFIK
function getChartColor(type) {
  // Asumsi Dark Mode dikontrol oleh class 'dark-mode' pada <body>
  const isDarkMode = document.body.classList.contains("dark-mode");

  // Warna Teks Dasar (sesuai --text-color di CSS)
  const baseTextColor = isDarkMode ? "#f3f4f6" : "#1f2937";
  // Warna Garis Grid (samar di Dark Mode, jelas di Light Mode)
  const gridColor = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  if (type === "text") return baseTextColor;
  if (type === "grid") return gridColor;
  return baseTextColor; // Default
}

// --- Atur Pengaturan Global Chart.js ---
function configureChartDefaults() {
  const textColor = getChartTextColor();

  // Atur warna teks default (untuk label sumbu, legenda, dll.)
  Chart.defaults.color = textColor;

  // Khusus untuk Title Chart (opsional)
  Chart.defaults.plugins.title.color = textColor;

  // Khusus untuk Tooltip (opsional)
  Chart.defaults.plugins.tooltip.titleColor = textColor;
  Chart.defaults.plugins.tooltip.bodyColor = textColor;
}
function createProductCard(product) {
  const card = document.createElement("div");
  card.className =
    "product-card rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden flex flex-col h-full cursor-pointer border flex-shrink-0";

  card.dataset.id = product.id;

  const ownerId = product.ownerId || null;

  // 🔥 MENGAMBIL HARGA ASLI 🔥
  const hargaAsli =
    typeof product.harga === "number"
      ? product.harga
      : parseInt(product.harga) || 0;

  // 🔥 MENGAMBIL HARGA DISKON 🔥
  // Cek apakah hargaDiskon ada, merupakan angka positif, dan lebih kecil dari hargaAsli
  const hargaDiskon =
    typeof product.hargaDiskon === "number" &&
    product.hargaDiskon > 0 &&
    product.hargaDiskon < hargaAsli
      ? product.hargaDiskon
      : null;

  const isOnDiscount = hargaDiskon !== null;
  // Harga yang ditampilkan di tombol Keranjang
  const displayedPrice = isOnDiscount ? hargaDiskon : hargaAsli;

  // 🔥🔥🔥 PENGAMBILAN STOK & TERJUAL 🔥🔥🔥
  let rawStockValue = 0;
  if (product.stock !== undefined && product.stock !== null) {
    rawStockValue = product.stock;
  } else if (product.stok !== undefined && product.stok !== null) {
    rawStockValue = product.stok;
  }
  const stock = parseInt(rawStockValue) || 0;

  const soldCount =
    product.terjual !== undefined && product.terjual !== null
      ? parseInt(product.terjual) || 0
      : parseInt(product.soldCount) || 0;
  // 🔥🔥🔥 AKHIR PENGAMBILAN STOK & TERJUAL 🔥🔥🔥

  const isOwner = currentUser && ownerId === currentUser.uid;
  const isLoggedIn = !!currentUser; // Cek status login
  const shopName = product.shopName || "Toko Terpercaya";

  const isOutOfStock = stock === 0;

  // ----------------------------------------------------
  // 🔥🔥🔥 LOGIKA PRODUK BARU (7 HARI) 🔥🔥🔥
  let isNewProduct = false;
  if (product.createdAt) {
    // Asumsi: product.createdAt adalah objek Firebase Timestamp
    // yang memiliki method .toDate()
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    try {
      const createdTimeMs = product.createdAt.toDate().getTime();
      if (now - createdTimeMs <= ONE_WEEK_MS) {
        isNewProduct = true;
      }
    } catch (e) {
      // Jika konversi ke Date gagal, abaikan tag 'Baru'
      console.warn("Gagal mengkonversi createdAt untuk cek produk baru:", e);
    }
  }
  // 🔥🔥🔥 AKHIR LOGIKA PRODUK BARU 🔥🔥🔥

  // 🔥 LOGIKA TAG DISPLAY (Prioritas: MILIK ANDA > DISKON > BARU) 🔥
  let tagClass = "";
  let tagText = "";

  if (isOwner) {
    tagClass = "bg-blue-600";
    tagText = "MILIK ANDA";
  } else if (isOnDiscount) {
    tagClass = "bg-red-500";
    tagText = "DISKON";
  } else if (isNewProduct) {
    tagClass = "bg-red-500";
    tagText = "Baru";
  }

  const productTagHTML = tagText
    ? `
      <span class="absolute top-2 right-2 ${tagClass} text-white text-xs font-semibold px-2 py-1 rounded-lg shadow">
          ${tagText}
      </span>
      `
    : "";
  // ----------------------------------------------------

  // 🔥 LOGIKA PISAH STOK DAN TERJUAL 🔥
  let stockIndicatorContent = "";
  let soldIndicatorContent = "";

  // 1. Logika Indikator STOK (Selalu dibuat jika user login)
  if (isLoggedIn) {
    let indicatorClass;
    let statusText;

    if (stock > 10) {
      indicatorClass = "text-green-600 dark:text-green-400";
      statusText = `Stok: ${stock}`;
    } else if (stock > 0) {
      indicatorClass = "text-yellow-600 dark:text-yellow-400 font-semibold";
      statusText = `Stok Tersisa: ${stock}`;
    } else {
      indicatorClass = "text-red-600 dark:text-red-400 font-bold";
      statusText = "Stok Habis";
    }

    stockIndicatorContent = `
          <p class="text-sm ${indicatorClass}">
              ${statusText}
          </p>
      `;
  }

  // 2. Logika Indikator TERJUAL (Dibuat di Mode Publik, atau saat Login)
  if (!isOwner || (isOwner && isLoggedIn)) {
    let textClass = "text-gray-500 dark:text-gray-400";
    let iconHTML = "";

    if (soldCount > 0) {
      textClass = "text-green-600 dark:text-green-400 font-medium";
      iconHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
    }

    soldIndicatorContent = `
            <div class="flex items-center text-sm ${textClass}">
                ${iconHTML}
                Terjual: ${soldCount}
            </div>
        `;
  }

  // 3. Gabungkan Konten Indikator untuk BARIS INDIKATOR
  let indicatorDisplayHTML = "";
  let shopNameInIndicatorBar = "";

  if (isLoggedIn) {
    // Mode Login: STOK di atas, TERJUAL di bawah (Vertikal)
    indicatorDisplayHTML = `
        <div class="flex flex-col items-start w-full space-y-0.5"> 
            <div>${stockIndicatorContent}</div>
            <div>${soldIndicatorContent}</div>
        </div>
      `;
  } else {
    // Mode Publik/Logout: TERJUAL di kiri, NAMA TOKO di kanan (Horizontal)
    shopNameInIndicatorBar = isOwner
      ? ""
      : `<p class="text-xs font-semibold text-gray-700 dark:text-gray-400 whitespace-nowrap hidden md:block"> 
                       <span class="text-yellow-700 font-semibold">Toko:</span> ${shopName}
                     </p>`;

    indicatorDisplayHTML = `
          <div class="flex justify-between items-center w-full">
              <div>${soldIndicatorContent}</div>
              <div>${shopNameInIndicatorBar}</div>
          </div>
      `;
  }
  // 🔥 AKHIR LOGIKA GABUNGAN 🔥

  const ownerControls = isOwner
    ? `
        <div class="mt-3 flex space-x-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button data-id="${product.id}" class="edit-btn text-xs font-semibold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
            <button data-id="${product.id}" class="delete-btn text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Hapus</button>
        </div>
    `
    : "";

  const cartButton = isOwner
    ? ""
    : `
      <button 
          type="button"
          data-product-id="${product.id}"
          data-owner-id="${ownerId}" 
          ${isOutOfStock ? "disabled" : ""} 
          class="add-to-cart-btn-list w-full bg-yellow-400 text-gray-900 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-500 transition duration-200 shadow-sm ${
            isOutOfStock
              ? "opacity-50 cursor-not-allowed hover:bg-yellow-400"
              : ""
          }"
      >
          ${isOutOfStock ? "Stok Habis" : "Keranjang"}
      </button>
  `;

  // Tampilkan Nama Toko HANYA di Mobile, di atas harga.
  const shopNameMobileDisplay = isOwner
    ? ""
    : `
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-400"> 
          <span class="text-yellow-700 font-semibold">Toko:</span> ${shopName}
      </p>
    `;

  // 🔥 LOGIKA TAMPILAN HARGA UTAMA (Sudah Rata Kiri) 🔥
  let priceDisplayHTML;

  if (isOnDiscount) {
    // Tampilkan Harga Asli (dicoret) dan Harga Diskon (besar)
    priceDisplayHTML = `
        <p class="text-sm text-gray-500 dark:text-gray-400 line-through text-left">
            Rp ${hargaAsli.toLocaleString("id-ID")}
        </p>
        <p class="text-xl font-extrabold text-red-600 dark:text-red-400 -mt-0.5 text-left">
            Rp ${hargaDiskon.toLocaleString("id-ID")}
        </p>
    `;
  } else {
    // Hanya tampilkan Harga Asli (besar)
    priceDisplayHTML = `
        <p class="text-xl font-extrabold text-red-600 dark:text-red-400 text-left">
            Rp ${hargaAsli.toLocaleString("id-ID")}
        </p>
    `;
  }
  // 🔥 AKHIR LOGIKA TAMPILAN HARGA UTAMA 🔥

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
        ${productTagHTML}
    </div>

    <div class="p-3 flex flex-col flex-grow">
        
        <h3 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
            ${product.nama}
        </h3>
        
        <div class="text-xs text-gray-700 dark:text-gray-400 mb-2 flex-grow">
            <p class="line-clamp-2 leading-tight text-gray-500 dark:text-gray-400">
                ${
                  product.deskripsi
                    ? product.deskripsi.substring(0, 100)
                    : "Deskripsi tidak tersedia."
                }
            </p>
        </div>

        <hr>

        <div class="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
            
            <div class="md:hidden mb-1"> 
                ${shopNameMobileDisplay} 
            </div>

            <div class="flex mb-1 flex-col items-start">
                ${priceDisplayHTML}
                
                <div class="hidden md:block"></div>
            </div>
            
            <div class="mb-2 text-xs">
                ${indicatorDisplayHTML} 
            </div>

            ${isOwner ? ownerControls : cartButton}
        </div>
    </div>
`;

  if (isOwner) {
    const deleteBtn = card.querySelector(".delete-btn");
    const editBtn = card.querySelector(".edit-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteProduct);
    if (editBtn) editBtn.addEventListener("click", handleEditClick);
  } else {
    // Listener hanya akan memanggil handleAddToCartFromList jika stok > 0
    const listCartBtn = card.querySelector(".add-to-cart-btn-list");
    if (listCartBtn && stock > 0) {
      listCartBtn.addEventListener("click", (e) => {
        // Menggunakan displayedPrice untuk harga yang ditambahkan ke keranjang
        handleAddToCartFromList({ ...product, harga: displayedPrice });
      });
    }
  }

  // Listener untuk menampilkan detail produk
  card.addEventListener("click", (e) => {
    const targetClasses = e.target.classList;
    if (
      targetClasses.contains("edit-btn") ||
      targetClasses.contains("delete-btn") ||
      e.target.closest(".add-to-cart-btn-list") // Cegah klik pada tombol keranjang
    ) {
      return;
    }
    handleProductCardClick(e);
  });

  return card;
}

// -----------------------------------------------------------------
// BAGIAN 4: FUNGSI AUTENTIKASI (LOGIN/REGISTER)
// -----------------------------------------------------------------

/**
 * 🔥🔥 FUNGSI KRUSIAL: MENGATUR TAMPILAN KE MODE LOGIN 🔥🔥
 */ function setAuthModeToLogin() {
  if (authTitle) authTitle.textContent = "Masuk ke Akun Anda";
  if (authSubmitBtn) {
    authSubmitBtn.textContent = "Masuk";
    authSubmitBtn.setAttribute("data-action", "login");
  }

  // 🔥 PENYESUAIAN KRUSIAL: Atur teks toggle link untuk mode LOGIN (Hubungi Admin)
  if (toggleAuthLink) toggleAuthLink.textContent = "Hubungi Admin";

  // Logika Event Listener (asumsi Anda memiliki setAuthModeToRegister untuk beralih mode)
  // Perhatikan: Karena Anda mengubah fungsi toggleAuthLink menjadi link WhatsApp
  // Logika di bawah ini mungkin sudah tidak relevan jika toggleAuthLink hanya
  // membuka WhatsApp di mode login. Saya akan mengembalikan logika aslinya untuk berjaga-jaga.

  // if (toggleAuthMode) toggleAuthMode.removeEventListener("click", setAuthModeToLogin); // Baris ini tidak diperlukan
  // if (toggleAuthMode) toggleAuthMode.addEventListener("click", setAuthModeToRegister); // Ini adalah event listener saat di mode Login

  // Sembunyikan field registrasi tambahan
  if (authPhoneGroup) authPhoneGroup.classList.add("hidden");
  if (authAddressGroup) authAddressGroup.classList.add("hidden");
  if (authRoleGroup) authRoleGroup.classList.add("hidden");
  if (adminRegisterInfo) adminRegisterInfo.classList.add("hidden");
  if (authModal) authModal.classList.remove("is-admin-register");

  // Atur validasi input agar tidak wajib
  if (authPhoneInput) authPhoneInput.removeAttribute("required");
  if (authAddressInput) authAddressInput.removeAttribute("required");
  if (authPasswordInput)
    authPasswordInput.setAttribute("placeholder", "Sandi (minimal 6 karakter)");
}

function updateCartCountBadge() {
  const cartCountElement = document.getElementById("cart-count");

  // Asumsi: Variabel 'cart' adalah array global Anda yang berisi item keranjang.
  if (typeof cart === "undefined" || !Array.isArray(cart)) {
    return;
  }

  // 🔥 KUNCI: Hitung jumlah item unik (cart.length) 🔥
  const uniqueItemCount = cart.length;

  cartCountElement.textContent = uniqueItemCount;

  // Kontrol Visibilitas Badge
  if (uniqueItemCount > 0) {
    cartCountElement.classList.remove("hidden");
  } else {
    cartCountElement.classList.add("hidden");
  }

  // 🔥 HAPUS LOGIKA SHAKE DARI SINI 🔥
}

/**
 * Memicu animasi "terbang" dari tombol produk ke ikon keranjang.
 * @param {HTMLElement} startButton - Tombol produk yang diklik (asal).
 */
function triggerFlyToCartAnimation(startButton) {
  const cartIcon = document.getElementById("cart-btn");

  // ... (KODE SETUP ITEM TERBANG TETAP SAMA) ...
  const buttonRect = startButton.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  const targetX =
    cartRect.left +
    cartRect.width / 2 -
    (buttonRect.left + buttonRect.width / 2);
  const targetY =
    cartRect.top +
    cartRect.height / 2 -
    (buttonRect.top + buttonRect.height / 2);

  const flyingItem = document.createElement("span");
  flyingItem.classList.add("flying-cart-item");
  flyingItem.textContent = "1";

  document.body.appendChild(flyingItem);

  flyingItem.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
  flyingItem.style.top = `${buttonRect.top + buttonRect.height / 2}px`;

  flyingItem.style.setProperty("--target-x", `${targetX}px`);
  flyingItem.style.setProperty("--target-y", `${targetY}px`);
  // --- AKHIR KODE SETUP ---

  const TIMEOUT_START = 1000; // 🔥 KEMBALIKAN KE 1200ms untuk sinkronisasi 🔥

  // 1. Pemicu animasi Terbang
  requestAnimationFrame(() => {
    flyingItem.classList.add("is-flying");
  });

  // 2. Aksi setelah animasi selesai (1200ms)
  setTimeout(() => {
    // Hapus item terbang
    flyingItem.remove();

    // --- Log status saat Count akan diperbarui ---
    console.log("------------------------------------------");
    console.log(`[ANIMASI END] Cart di memori saat ini: ${cart.length}`); // DEBUG C
    console.log(`[ANIMASI END] Count Badge diupdate menjadi: ${cart.length}`);
    console.log("------------------------------------------");

    // 3. Panggil pembaruan hitungan (Logika Count Akurat)
    if (typeof updateCartCountBadge === "function") {
      updateCartCountBadge();
    }

    // 4. Pemicu SHAKE
    cartIcon.classList.add("cart-shake");

    // Hapus efek kocok
    setTimeout(() => {
      cartIcon.classList.remove("cart-shake");
    }, 500);
  }, TIMEOUT_START);
}

/**
 * Mengubah tema antara light dan dark, serta menyimpan preferensi ke localStorage.
 * Memperbarui tampilan grafik (salesChart) jika sudah dimuat.
 */
function toggleTheme() {
  const body = document.body;
  const isDarkMode = themeToggle.checked;

  console.log("Toggle Ditekan! Status Dark Mode:", isDarkMode); // 🔥 DEBUG INI 🔥

  if (isDarkMode) {
    body.classList.add("dark-mode");
    localStorage.setItem(STORAGE_KEY, "dark");
  } else {
    body.classList.remove("dark-mode");
    localStorage.setItem(STORAGE_KEY, "light");
  }

  // 🔥 PERBAIKAN GRAFIK: Panggil ulang renderSalesChart jika instansi ada 🔥
  // Asumsi: salesChartInstance dan salesByPeriod tersedia secara global
  // atau dapat diakses di lingkup ini.
  if (
    typeof salesChartInstance !== "undefined" &&
    salesChartInstance !== null
  ) {
    // Pastikan data yang diperlukan (salesByPeriod) tersedia
    // sebelum mencoba me-render ulang grafik.
    if (typeof salesByPeriod !== "undefined" && salesByPeriod !== null) {
      console.log("Memperbarui Grafik Penjualan...");
      renderSalesChart(salesByPeriod);
    } else {
      // Jika data tidak tersedia, mungkin grafik belum dimuat di halaman ini.
      console.warn(
        "salesByPeriod tidak ditemukan, tidak dapat memperbarui grafik."
      );
    }
  }
}
/**
 * Memuat preferensi tema yang tersimpan di localStorage.
 * DETEKSI PREFERENSI SISTEM (OS) DIHAPUS untuk mengatasi bug mobile.
 */

function loadThemePreference() {
  const body = document.body;
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  // 1. Cek Preferensi Tersimpan
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    themeToggle.checked = true;
  } else if (savedTheme === "light") {
    body.classList.remove("dark-mode");
    themeToggle.checked = false;
  }
  // 2. Jika BELUM ADA preferensi tersimpan, default ke Light Mode
  else {
    // Default ke light mode, pastikan body class dihilangkan
    body.classList.remove("dark-mode");
    themeToggle.checked = false;
    localStorage.setItem(STORAGE_KEY, "light");
  }

  // CATATAN: Blok kode yang memeriksa `prefers-color-scheme: dark` telah DIBUANG.
}

// ====================================================================
// A. HELPER DAN KUNCI IDENTIFIKASI
// ====================================================================

// Helper untuk format Rupiah
const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);

/**
 * Mengambil UID penjual yang sedang login dari Firebase Auth (Legacy SDK).
 * Digunakan untuk memfilter pesanan di Dashboard Penjual.
 * @returns {string | null} UID penjual atau null.
 */
function getCurrentSellerId() {
  // Menggunakan objek Auth global yang sudah Anda inisialisasi
  const user = auth.currentUser;
  if (user) {
    return user.uid;
  }
  console.warn("Peringatan: Pengguna tidak terautentikasi.");
  return null;
}
/**
 * Mengambil OwnerId (ID Penjual) dari produk yang sedang di-checkout.
 * @returns {string | null} ownerId atau null.
 */
function getOwnerIdFromCurrentOrder() {
  // ASUMSI: ID Penjual produk disimpan di data-attribute tombol submit order
  const orderBtn = document.getElementById("order-submit-btn");
  const ownerId = orderBtn ? orderBtn.getAttribute("data-owner-id") : null;

  if (ownerId && ownerId !== "null" && ownerId.length > 0) {
    // ID Penjual yang valid telah disuntikkan oleh handleMoveToOrderView
    return ownerId;
  }

  // 🔥🔥🔥 KRITIS: JIKA ownerId TIDAK DITEMUKAN, KITA TIDAK BOLEH MENGGUNAKAN DUMMY ID LAGI.
  // SEBALIKNYA, KITA LOG ERROR DAN MENGEMBALIKAN NULL.

  console.error(
    "OwnerId produk tidak ditemukan pada tombol submit. Proses order dibatalkan."
  );

  // Mengembalikan null akan mencegah pesanan dikirim ke Firestore oleh handleOrderSubmission
  // atau, setidaknya, akan membuat ownerId: null di Firestore (yang akan ter-filter oleh aturan keamanan).
  return null;
}

// ====================================================================
// B. LOGIKA PENYIMPANAN PESANAN (Dipanggil saat Klik 'Order Sekarang')
// ====================================================================

/**
 * Menyimpan pesanan baru ke koleksi 'orders' di Firestore (Legacy SDK).
 */
async function addOrderToFirestore(orderData) {
  try {
    const docRef = await db.collection("orders").add(orderData);
    console.log(
      "Pesanan berhasil disimpan di Firestore dengan ID: ",
      docRef.id
    );
    return true;
  } catch (e) {
    console.error("Error menambahkan dokumen pesanan: ", e);
    return false;
  }
}

// ====================================================================
// C. LOGIKA DASHBOARD PENJUAL (Management View)
// ====================================================================

// --- Fungsi Helper untuk Badge Status ---
function getStatusBadge(status) {
  const statusClasses = {
    Diterima: "bg-yellow-100 text-yellow-800",
    Diproses: "bg-blue-100 text-blue-800",
    Pengiriman: "bg-indigo-100 text-indigo-800",
    Selesai: "bg-green-100 text-green-800",
    Ditolak: "bg-red-100 text-red-800",
  };
  const cssClass = statusClasses[status] || "bg-gray-100 text-gray-800";
  return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cssClass}">${status}</span>`;
}
/**
 * Merender pesanan yang statusnya 'Diterima' ke tabel 'Pesanan Baru' (Notifikasi).
 * Aksi yang tersedia hanya Terima (-> Diproses) atau Tolak (-> Ditolak).
 */

function renderNewOrdersTable(orders, newOrdersListBody) {
  newOrdersListBody.innerHTML = "";

  if (orders.length === 0) {
    newOrdersListBody.innerHTML =
      '<tr><td colspan="5" class="text-center py-4 text-green-500 font-medium">🎉 Tidak ada pesanan baru yang membutuhkan aksi.</td></tr>';
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement("tr");

    // [LOGIKA WAKTU, TOTAL, WHATSAPP SAMA]
    const timeValue = order.timestamp
      ? order.timestamp.toDate
        ? order.timestamp.toDate()
        : new Date(order.timestamp)
      : new Date();

    const timeFormatted = timeValue.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const formattedTotal =
      typeof formatRupiah === "function"
        ? formatRupiah(order.totalAmount)
        : `Rp ${order.totalAmount.toLocaleString("id-ID")}`;

    const cleanPhone = order.buyerPhone.replace(/\D/g, "");
    const waPhone = cleanPhone.replace(/^62/, "").replace(/^0/, "");
    const waLink = `https://wa.me/62${waPhone}`;

    // 🔥 PERUBAHAN KRUSIAL: KEMBALIKAN DETAIL PESANAN KE STRING ASLI 🔥
    // Detail Pesanan akan menggunakan string asli dan membiarkan browser melakukan wrapping
    const detailString = order.orderDetail || "Tidak ada detail produk.";

    // LOGIKA AKSI: Tombol Terima dan Tolak (Vertikal)
    const actions = `
        <div class="flex flex-col space-y-1 items-stretch min-w-[70px]"> 
            <button onclick="updateOrderStatus('${order.docId}', 'Diproses')" 
                class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-1 rounded-md shadow-sm transition duration-150 ease-in-out"
                title="Terima Pesanan">
                Terima
            </button>
            <button onclick="updateOrderStatus('${order.docId}', 'Ditolak')" 
                class="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-1 rounded-md shadow-sm transition duration-150 ease-in-out"
                title="Tolak Pesanan">
                Tolak
            </button>
        </div>
    `;

    row.innerHTML = `
        <td class="px-2 py-3 text-sm text-gray-500 align-top">${timeFormatted}</td>
        
        <td class="px-3 py-3 text-sm font-medium text-gray-900 align-top">
            <span class="font-semibold">${order.buyerName}</span><br>
            <a href="${waLink}" target="_blank" class="text-blue-600 hover:underline text-xs">${order.buyerPhone}</a>
        </td>
        
        <td class="px-3 py-3 text-sm text-gray-500 align-top">
            ${detailString} 
        </td>
        
        <td class="px-2 py-3 whitespace-nowrap text-sm font-semibold text-red-600 align-top">${formattedTotal}</td>
        
        <td class="px-2 py-3 whitespace-nowrap text-sm align-top">${actions}</td>
    `;
    newOrdersListBody.appendChild(row);
  });
}

async function loadNewOrdersList() {
  const sellerId = getCurrentSellerId();
  const newOrdersListBody = document.getElementById("new-orders-list");
  newOrdersListBody.innerHTML =
    '<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat pesanan dari database...</td></tr>';

  if (!sellerId) {
    newOrdersListBody.innerHTML =
      '<tr><td colspan="5" class="text-center py-4 text-red-500">Harap login sebagai penjual untuk melihat pesanan.</td></tr>';
    return;
  }

  try {
    // Query: orders WHERE ownerId == [ID Penjual yang Login] AND status == 'Diterima' (Hanya butuh aksi awal)
    const q = db
      .collection("orders")
      .where("ownerId", "==", sellerId)
      .where("status", "==", "Diterima") // 🔥 Hanya tampilkan pesanan yang statusnya 'Diterima' 🔥
      .orderBy("timestamp", "desc");

    const querySnapshot = await q.get();

    const orders = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      docId: doc.id, // ID Dokumen Firestore (penting untuk update)
      timestamp: doc.data().timestamp
        ? doc.data().timestamp
        : new Date().toISOString(),
      totalAmount: doc.data().totalAmount || 0, // Pastikan ada totalAmount
      buyerPhone: doc.data().buyerPhone || "N/A", // Pastikan ada buyerPhone
    }));

    // Gunakan fungsi render yang baru
    renderNewOrdersTable(orders, newOrdersListBody);
  } catch (e) {
    console.error("Gagal memuat pesanan baru dari Firestore: ", e);
    newOrdersListBody.innerHTML =
      '<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal mengambil data. Cek Index Firestore Anda!</td></tr>';
  }
}
/**
 * Fungsi yang dipanggil saat penjual mengganti status menggunakan dropdown (Riwayat)
 * atau tombol (Notifikasi: Terima/Tolak).
 */ async function updateOrderStatus(docId, newStatus) {
  const db = firebase.firestore();
  const orderRef = db.collection("orders").doc(docId);

  try {
    // 🔥 Menggunakan runTransaction untuk memastikan pembacaan stok dan penulisan status/stok/terjual adalah atomik 🔥
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error("Dokumen pesanan tidak ditemukan.");
      }

      const orderData = orderDoc.data();
      const currentStatus = orderData.status;
      // Memastikan productItems selalu berupa array, meskipun kosong
      const productItems = orderData.productItems || [];

      // --- 1. PENGURANGAN STOK: HANYA DARI 'Diterima' KE 'Diproses' ---
      if (currentStatus === "Diterima" && newStatus === "Diproses") {
        if (productItems.length === 0) {
          console.warn(
            `Pesanan ${docId} tidak memiliki detail produk terstruktur (productItems). Melanjutkan update status tanpa mengurangi stok.`
          );
        } else {
          // Loop melalui setiap item pesanan
          for (const item of productItems) {
            if (!item.productId || item.quantity <= 0) continue;

            const productRef = db.collection("products").doc(item.productId);

            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
              console.warn(
                `Produk ID ${item.productId} tidak ditemukan. Melewatkan pengurangan stok.`
              );
              continue;
            }

            const currentStock = productDoc.data().stock || 0;
            const quantityToSubtract = item.quantity;
            const newStock = currentStock - quantityToSubtract;

            if (newStock < 0) {
              // KRITIS: Membatalkan seluruh transaksi jika stok tidak cukup
              throw new Error(
                `Stok tidak mencukupi untuk produk ID ${item.productId}. Stok tersedia: ${currentStock}, Diminta: ${quantityToSubtract}`
              );
            }

            // Lakukan pengurangan stok dalam transaksi
            transaction.update(productRef, {
              stock: newStock,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            console.log(
              `Stok produk ${item.productId} diupdate dari ${currentStock} menjadi ${newStock}.`
            );
          }
        }
      }

      // ------------------------------------------------------------------
      // 🔥 LOGIKA PENAMBAHAN 'TERJUAL' (JIKA BERUBAH KE 'Selesai')
      // ------------------------------------------------------------------
      // Cek apakah status baru adalah "Selesai" dan status lama BUKAN "Selesai" atau "Ditolak"
      const isCompletingOrder =
        newStatus === "Selesai" &&
        currentStatus !== "Selesai" &&
        currentStatus !== "Ditolak";

      if (isCompletingOrder) {
        if (productItems.length === 0) {
          console.warn(
            `Pesanan ${docId} tidak memiliki productItems. Tidak dapat menambahkan 'terjual'.`
          );
        } else {
          for (const item of productItems) {
            if (!item.productId || item.quantity <= 0) continue;

            const productRef = db.collection("products").doc(item.productId);

            // Lakukan penambahan field 'terjual' menggunakan increment
            transaction.update(productRef, {
              terjual: firebase.firestore.FieldValue.increment(item.quantity),
            });

            console.log(
              `Menambah 'terjual' produk ${item.productId} sebanyak ${item.quantity}.`
            );
          }
        }
      }
      // ------------------------------------------------------------------

      // --- 2. UPDATE STATUS PESANAN ---
      transaction.update(orderRef, {
        status: newStatus,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return `Status pesanan ${docId} berhasil diubah menjadi ${newStatus}.`;
    });

    // --- LOGIKA SETELAH TRANSAKSI BERHASIL (di luar try block utama) ---

    // 1. Refresh tampilan 'Pesanan Baru'
    loadNewOrdersList();

    // 2. Refresh tampilan 'Riwayat Transaksi' (Penting untuk memperbarui statistik)
    if (typeof loadTransactionHistory === "function") {
      loadTransactionHistory();
    }

    // 3. 🔥🔥 KRUSIAL: Muat ulang daftar produk untuk update indikator 'terjual' di mode publik. 🔥🔥
    if (typeof loadProducts === "function") {
      loadProducts();
    }

    // 4. Notifikasi
    Swal.fire({
      icon: "success",
      title: "Status Diperbarui!",
      text:
        newStatus === "Diproses"
          ? `Pesanan diterima dan stok produk telah dikurangi.`
          : `Pesanan ${docId} berstatus: ${newStatus}`,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
  } catch (e) {
    // Tangani error, terutama jika dibatalkan karena stok negatif
    let userMessage;
    if (e.message && e.message.includes("Stok tidak mencukupi")) {
      userMessage = e.message;
    } else {
      userMessage =
        "Gagal memperbarui status di database. Silakan cek konsol untuk detail kesalahan.";
    }

    console.error(
      `Gagal mengupdate status pesanan ${docId} atau memproses terjual:`,
      e
    );
    Swal.fire("Gagal Kritis!", userMessage, "error");
  }
}
/**
 * 🔥🔥 FUNGSI KRUSIAL: MENGATUR TAMPILAN KE MODE REGISTER 🔥🔥
 */
function setAuthModeToRegister(isCalledByAdmin = false) {
  if (authTitle)
    authTitle.textContent = isCalledByAdmin
      ? "Daftarkan User Baru (Admin Mode)"
      : "Daftar Akun Penjual Baru";

  if (authSubmitBtn) {
    authSubmitBtn.textContent = "Daftar";
    authSubmitBtn.setAttribute("data-action", "register");
  }

  if (toggleAuthLink) toggleAuthLink.textContent = "Kembali ke Masuk";
  if (toggleAuthMode)
    toggleAuthMode.removeEventListener("click", setAuthModeToRegister);
  if (toggleAuthMode)
    toggleAuthMode.addEventListener("click", setAuthModeToLogin);

  // Tampilkan field registrasi tambahan
  if (authPhoneGroup) authPhoneGroup.classList.remove("hidden");
  if (authAddressGroup) authAddressGroup.classList.remove("hidden");

  // Atur validasi input agar wajib
  if (authPhoneInput) authPhoneInput.setAttribute("required", "required");
  if (authAddressInput) authAddressInput.setAttribute("required", "required");
  if (authPasswordInput)
    authPasswordInput.setAttribute(
      "placeholder",
      "Sandi (minimal 6 karakter) *Wajib"
    );

  if (isCalledByAdmin) {
    if (authRoleGroup) authRoleGroup.classList.remove("hidden");
    if (adminRegisterInfo) adminRegisterInfo.classList.remove("hidden");
    if (authModal) authModal.classList.add("is-admin-register");
  } else {
    if (authRoleGroup) authRoleGroup.classList.add("hidden");
    if (adminRegisterInfo) adminRegisterInfo.classList.add("hidden");
    if (authModal) authModal.classList.remove("is-admin-register");
  }
}
function displayAuthError(message) {
  if (authError) {
    authError.textContent = message;
    authError.classList.remove("hidden");
  }
}

/**
 * Menyaring produk berdasarkan query (Nama Produk, Name, Deskripsi, ATAU Nama Toko).
 * Menggunakan pencarian multi-properti untuk fleksibilitas maksimal.
 */
function filterProducts(query) {
  if (!ALL_PRODUCTS_CACHE.length) {
    console.warn(
      "Katalog produk belum dimuat sepenuhnya atau kosong. Filter dibatalkan."
    );
    renderFilteredProducts([]);
    return;
  }

  const cleanQuery = query.toLowerCase().trim();
  console.log(`DEBUG: Query Pencarian Bersih: "${cleanQuery}"`);

  if (cleanQuery === "") {
    renderFilteredProducts(ALL_PRODUCTS_CACHE);
    return;
  }

  const filtered = ALL_PRODUCTS_CACHE.filter((product) => {
    // 1. Dapatkan Nama Produk (Cek 'name' dan 'nama', gunakan salah satu)
    let rawProductName = product.name || product.nama;
    let productName = "";
    if (rawProductName) {
      productName = rawProductName.toLowerCase().trim();
    }

    // 2. Dapatkan Deskripsi Produk
    let productDescription = "";
    if (product.deskripsi) {
      productDescription = product.deskripsi.toLowerCase().trim();
    }

    // 3. Dapatkan Nama Toko
    let productShopName = "";
    if (product.shopName) {
      productShopName = product.shopName.toLowerCase().trim();
    }

    // 4. Lakukan Pencocokan (Menggunakan .includes() pada string yang bersih)
    const nameMatch = productName.includes(cleanQuery);
    const descriptionMatch = productDescription.includes(cleanQuery); // NEW: Pencarian di deskripsi
    const shopMatch = productShopName.includes(cleanQuery);

    // 5. Logika Kecocokan: Cocok jika salah satu properti mengandung query
    const isMatch = nameMatch || descriptionMatch || shopMatch;

    if (isMatch) {
      console.log(
        `DEBUG: Cocok ditemukan untuk: ${rawProductName}. Match di: ${
          nameMatch ? "Nama | " : ""
        } ${descriptionMatch ? "Deskripsi | " : ""} ${shopMatch ? "Toko" : ""}`
      );
    }

    return isMatch;
  });

  console.log(
    `DEBUG: Filter selesai. Hasil: ${filtered.length} produk ditemukan.`
  );
  renderFilteredProducts(filtered);
}

// ----------------------------------------------------

/**
 * Merender daftar produk yang telah difilter ke DOM.
 * Fungsi ini menggunakan createProductCard() yang sudah ada.
 * @param {Array<Object>} products - Daftar produk hasil filter.
 */
function renderFilteredProducts(products) {
  if (!productListDiv) return; // Menggunakan productListDiv

  productListDiv.innerHTML = "";

  if (products.length === 0) {
    // Tampilkan pesan jika tidak ada hasil
    productListDiv.innerHTML = `<p class="text-center col-span-full text-xl py-10 text-gray-500 italic">Tidak ada produk yang cocok dengan pencarian Anda.</p>`;
    // Reset grid class agar pesan di tengah
    productListDiv.className = "grid grid-cols-1 gap-6";
    return;
  }

  // Terapkan kelas grid yang benar
  productListDiv.className =
    "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  // Iterasi dan pasang kembali event listener Keranjang
  products.forEach((product) => {
    // Asumsi: createProductCard(product) mengembalikan elemen HTML kartu
    const productElement = createProductCard(product);
    productListDiv.appendChild(productElement); // Menggunakan productListDiv

    // --- PASANG LISTENER KERANJANG ULANG ---
    const cartButton = productElement.querySelector(
      `#add-to-cart-${product.id}`
    );
    if (cartButton) {
      cartButton.addEventListener("click", (e) => {
        e.stopPropagation();
        // Asumsi addToCart(product, quantity) ada
        addToCart(product, 1);
      });
    }
  });
}

/**
 * Menangani error yang dilempar oleh Firebase Authentication
 * @param {Object} error Objek error dari Firebase
 */
function handleAuthFirebaseError(error) {
  let errorMessage = "Terjadi kesalahan yang tidak terduga.";
  console.error("Firebase Auth Error:", error);

  switch (error.code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-login-credentials": // 🔥 KRUSIAL: Menambahkan error baru
      errorMessage =
        "Email atau sandi yang Anda masukkan salah. Mohon periksa kembali.";
      break;
    case "auth/invalid-email":
      errorMessage = "Format email tidak valid.";
      break;
    case "auth/user-disabled":
      errorMessage = "Akun Anda telah dinonaktifkan.";
      break;
    case "auth/too-many-requests":
      errorMessage = "Terlalu banyak permintaan login. Coba lagi sebentar.";
      break;
    case "auth/email-already-in-use":
      errorMessage = "Email ini sudah terdaftar. Coba Masuk.";
      break;
    default:
      // Pesan umum untuk error lain yang tidak terdeteksi
      errorMessage = `Gagal login. Periksa koneksi atau kredensial Anda. (Kode: ${error.code.replace(
        "auth/",
        ""
      )})`;
      break;
  }

  displayAuthError(errorMessage);
}

function getCloudinaryPublicId(imageUrl) {
  // ... (Implementasi logika ekstraksi Public ID) ...
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const parts = imageUrl.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex !== -1 && parts.length > uploadIndex + 1) {
    const publicIdPath = parts.slice(uploadIndex + 2).join("/");
    const publicId = publicIdPath.split(".").slice(0, -1).join(".");
    return publicId;
  }
  return null;
}
/**
 * Menyiapkan listener real-time menggunakan onSnapshot untuk pesanan baru.
 * Fungsi ini mengembalikan fungsi unsubscribe yang HARUS dipanggil saat
 * user keluar dari Management View untuk menghentikan koneksi real-time.
 * * Asumsi:
 * - db (instance Firestore) dan currentUser (user auth) tersedia secara global.
 * - getCurrentSellerId() mengembalikan currentUser.uid.
 * - renderNewOrdersTable(orders, newOrdersListBody) sudah didefinisikan.
 */
function setupRealTimeNewOrdersListener() {
  const sellerId = getCurrentSellerId();
  const newOrdersListBody = document.getElementById("new-orders-list");

  const badgeElement = document.getElementById("new-orders-count-badge");
  const managementViewElement = document.getElementById("management-view");

  if (!sellerId || typeof db === "undefined") {
    const errorText = !sellerId
      ? "Harap login sebagai penjual untuk mengaktifkan notifikasi."
      : "FIREBASE ERROR: Firestore instance tidak ditemukan.";
    if (newOrdersListBody) {
      newOrdersListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${errorText}</td></tr>`;
    }
    console.error("RT Listener Error:", errorText);
    return null;
  }

  // Query: ownerId == [Seller ID] AND status == "Diterima" (Order Baru)
  const q = db
    .collection("orders")
    .where("ownerId", "==", sellerId)
    .where("status", "==", "Diterima")
    .orderBy("timestamp", "desc");

  console.log(
    `[RT LISTENER START] Mengaktifkan listener untuk Order Baru (Status: Diterima). Penjual: ${sellerId}`
  );

  const unsubscribe = q.onSnapshot(
    (querySnapshot) => {
      // 1. Ambil data order
      const orders = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
        timestamp: doc.data().timestamp,
        totalAmount: doc.data().totalAmount || 0,
        buyerPhone: doc.data().buyerPhone || "N/A",
      }));

      // 🔥 SIMPAN DATA KE CACHE GLOBAL
      cachedOrders = orders; // <--- INI PENTING!

      // 2. Tentukan apakah ada penambahan baru (untuk SweetAlert)
      const changes = querySnapshot.docChanges();
      const wasAdded = changes.some((change) => change.type === "added");
      const newOrdersCount = orders.length;

      console.log(
        `[RT UPDATE RECEIVED] Total Order 'Diterima' Saat Ini: ${newOrdersCount}. Baru Ditambahkan: ${wasAdded}`
      );

      // 3. LOGIKA UPDATE BADGE NOTIFIKASI
      if (badgeElement) {
        if (newOrdersCount > 0) {
          badgeElement.textContent = newOrdersCount;
          badgeElement.classList.remove("hidden");
        } else {
          badgeElement.textContent = 0;
          badgeElement.classList.add("hidden");
        }
      }

      // 4. Render tabel (Hanya jika Management View sedang TERBUKA)
      if (
        managementViewElement &&
        !managementViewElement.classList.contains("hidden") &&
        newOrdersListBody
      ) {
        // Tampilkan data yang baru diambil langsung ke tabel yang terbuka
        renderNewOrdersTable(orders, newOrdersListBody);
      }

      // 5. Notifikasi SweetAlert
      if (wasAdded) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Pesanan Baru Masuk! (${newOrdersCount} total)`,
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      }
    },
    (error) => {
      console.error("Gagal menjalankan Real-Time Listener Pesanan: ", error);
      if (newOrdersListBody) {
        newOrdersListBody.innerHTML =
          '<tr><td colspan="5" class="text-center py-4 text-red-500">Error Real-Time. Cek Security Rules atau Index Firestore Anda!</td></tr>';
      }
    }
  );

  return unsubscribe;
}
function setupRealTimeNewOrdersListener() {
  const sellerId = getCurrentSellerId();
  const newOrdersListBody = document.getElementById("new-orders-list");

  // 🔥 Hapus deklarasi badgeElement di sini agar tidak menyimpan referensi lama
  // const badgeElement = document.getElementById("new-orders-count-badge");
  const managementViewElement = document.getElementById("management-view");

  if (!sellerId || typeof db === "undefined") {
    const errorText = !sellerId
      ? "Harap login sebagai penjual untuk mengaktifkan notifikasi."
      : "FIREBASE ERROR: Firestore instance tidak ditemukan.";
    if (newOrdersListBody) {
      // Kita akan hapus pesan "Memuat..." di sini, karena logika render sudah ada di toggleManagementView
      // newOrdersListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">${errorText}</td></tr>`;
    }
    console.error("RT Listener Error:", errorText);
    return null;
  }

  // Query: ownerId == [Seller ID] AND status == "Diterima" (Order Baru)
  const q = db
    .collection("orders")
    .where("ownerId", "==", sellerId)
    .where("status", "==", "Diterima")
    .orderBy("timestamp", "desc");

  console.log(
    `[RT LISTENER START] Mengaktifkan listener untuk Order Baru (Status: Diterima). Penjual: ${sellerId}`
  );

  const unsubscribe = q.onSnapshot(
    (querySnapshot) => {
      // 1. Ambil data order
      const orders = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
        timestamp: doc.data().timestamp,
        totalAmount: doc.data().totalAmount || 0,
        buyerPhone: doc.data().buyerPhone || "N/A",
      }));

      // 🔥 SIMPAN DATA KE CACHE GLOBAL
      cachedOrders = orders;

      // 2. Tentukan apakah ada penambahan baru (untuk SweetAlert)
      const changes = querySnapshot.docChanges();
      const wasAdded = changes.some((change) => change.type === "added");
      const newOrdersCount = orders.length;

      console.log(
        `[RT UPDATE RECEIVED] Total Order 'Diterima' Saat Ini: ${newOrdersCount}. Baru Ditambahkan: ${wasAdded}`
      );

      // 🔥🔥 3. LOGIKA UPDATE BADGE NOTIFIKASI (MENCARI ELEMEN TERBARU) 🔥🔥
      const currentBadgeElement = document.getElementById(
        "new-orders-count-badge"
      ); // Cari elemen setiap kali update

      if (currentBadgeElement) {
        if (newOrdersCount > 0) {
          currentBadgeElement.textContent = newOrdersCount;
          currentBadgeElement.classList.remove("hidden"); // Tampilkan badge
        } else {
          currentBadgeElement.textContent = 0;
          currentBadgeElement.classList.add("hidden"); // Sembunyikan badge
        }
      }

      // 4. Render tabel (Hanya jika Management View sedang TERBUKA)
      if (
        managementViewElement &&
        !managementViewElement.classList.contains("hidden") &&
        newOrdersListBody
      ) {
        // Render tabel menggunakan data yang baru diambil
        renderNewOrdersTable(orders, newOrdersListBody);
      }

      // 5. Notifikasi SweetAlert
      if (wasAdded) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Pesanan Baru Masuk! (${newOrdersCount} total)`,
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      }
    },
    (error) => {
      console.error("Gagal menjalankan Real-Time Listener Pesanan: ", error);
      if (newOrdersListBody) {
        newOrdersListBody.innerHTML =
          '<tr><td colspan="5" class="text-center py-4 text-red-500">Error Real-Time. Cek Security Rules atau Index Firestore Anda!</td></tr>';
      }
    }
  );

  return unsubscribe;
}

function toggleBodyScroll(lockScroll) {
  if (lockScroll) {
    // Matikan scroll utama saat modal terbuka

    // Simpan posisi scroll saat ini
    // Ini membantu mencegah lompatan posisi ketika position: fixed diterapkan
    // Ambil posisi scroll dari window, bukan document.body
    currentScrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${currentScrollY}px`; // Posisikan body ke posisi scroll yang disimpan

    // 🔥 KRUSIAL: Tambahkan ini untuk memastikan scroll HTML (PWA/Mobile) juga terkunci
    document.documentElement.style.overflow = "hidden";
  } else {
    // Aktifkan kembali scroll utama saat modal tertutup

    // Dapatkan posisi scroll yang disimpan
    const scrollY = document.body.style.top;

    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";

    // 🔥 KRUSIAL: Buka juga scroll HTML
    document.documentElement.style.overflow = "";

    // Kembalikan window ke posisi scroll yang disimpan
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }
}

async function handleSubmitAuth(e) {
  e.preventDefault();

  // Pastikan error disembunyikan di awal
  if (authError) authError.classList.add("hidden");

  const new_user_email = document.getElementById("auth-email").value;
  const new_user_password = document.getElementById("auth-password").value;

  const phone = authPhoneInput ? authPhoneInput.value : "";
  const address = authAddressInput ? authAddressInput.value : "";
  const action = authSubmitBtn.getAttribute("data-action") || "login";
  const isRegister = action === "register";
  const originalText = isRegister ? "Daftar" : "Masuk";
  const loadingText = isRegister ? "Mendaftarkan..." : "Masuk...";
  let roleToAssign = "biasa";
  const isRegisterByAdmin =
    isRegister &&
    authRoleInput &&
    authRoleGroup &&
    !authRoleGroup.classList.contains("hidden");

  if (isRegisterByAdmin) {
    roleToAssign = authRoleInput.value;
  }

  if (isRegisterByAdmin && !currentUser) {
    displayAuthError("Error: Admin harus login untuk mendaftarkan user baru.");
    return;
  }

  if (!new_user_email || !new_user_password) {
    displayAuthError("Email dan sandi tidak boleh kosong.");
    return;
  }

  setLoading(authSubmitBtn, true, originalText, loadingText);

  try {
    if (isRegister) {
      if (isRegisterByAdmin) {
        // --- LOGIKA REGISTRASI OLEH ADMIN ---
        const admin_password_input = await Swal.fire({
          title: "Verifikasi Admin",
          text: "Masukkan sandi Admin Anda untuk memverifikasi pendaftaran user baru.",
          input: "password",
          inputAttributes: { autocapitalize: "off" },
          showCancelButton: true,
          confirmButtonText: "Verifikasi & Daftar",
          showLoaderOnConfirm: true,
          preConfirm: (adminPassword) => {
            if (!adminPassword) {
              Swal.showValidationMessage("Sandi Admin tidak boleh kosong");
            }
            return adminPassword;
          },
          allowOutsideClick: () => !Swal.isLoading(),
        });

        if (!admin_password_input.isConfirmed) {
          setLoading(authSubmitBtn, false, originalText);
          return;
        }

        const adminPassword = admin_password_input.value;
        const adminEmail = currentUser.email;

        // 🔥 FIX 1: Verifikasi Sandi Admin SEBELUM mendaftarkan user baru
        try {
          await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
        } catch (authError) {
          if (
            authError.code === "auth/wrong-password" ||
            authError.code === "auth/invalid-login-credentials"
          ) {
            displayAuthError(
              "Verifikasi Gagal: Sandi Admin yang dimasukkan salah."
            );
            setLoading(authSubmitBtn, false, originalText);
            return; // Hentikan proses jika verifikasi gagal
          }
          throw authError;
        }

        // Langkah 1: Pendaftaran User Baru (Ini akan mengubah sesi ke user baru)
        await auth.createUserWithEmailAndPassword(
          new_user_email,
          new_user_password
        );
        const newUser = auth.currentUser;

        // Langkah 2: Inisialisasi data penjual di Firestore (User Baru)
        const defaultShopName =
          new_user_email.split("@")[0].charAt(0).toUpperCase() +
          new_user_email.split("@")[0].slice(1) +
          " Store";

        await db.collection("sellers").doc(newUser.uid).set({
          email: new_user_email,
          shopName: defaultShopName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          role: roleToAssign,
          phone: phone,
          address: address,
        });

        // 🔥 FIX 2: Mengembalikan Sesi ke Admin
        // 1. Sign out dari user baru
        await auth.signOut();
        // 2. Sign in kembali sebagai Admin (menggunakan sandi terverifikasi)
        await auth.signInWithEmailAndPassword(adminEmail, adminPassword);

        if (authModal) authModal.classList.add("hidden");
        if (authForm) authForm.reset();
        setAuthModeToLogin(); // Reset mode

        // 🔥 KRUSIAL: Buka scroll setelah berhasil mendaftarkan dan mengembalikan sesi admin
        toggleBodyScroll(false);

        Swal.fire({
          icon: "success",
          title: "Pendaftaran Berhasil!",
          text: `Akun ${new_user_email} (Role: ${roleToAssign}) berhasil dibuat. Sesi Admin telah dikembalikan.`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
        });

        loadCustomerList();
      } else {
        // --- LOGIKA PENDAFTARAN BIASA ---
        const userCredential = await auth.createUserWithEmailAndPassword(
          new_user_email,
          new_user_password
        );
        const user = userCredential.user;

        const defaultShopName =
          new_user_email.split("@")[0].charAt(0).toUpperCase() +
          new_user_email.split("@")[0].slice(1) +
          " Store";

        await db.collection("sellers").doc(user.uid).set({
          email: new_user_email,
          shopName: defaultShopName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          role: "biasa",
          phone: phone,
          address: address,
        });

        if (authModal) authModal.classList.add("hidden");
        if (authForm) authForm.reset();
        setAuthModeToLogin();

        // 🔥 KRUSIAL: Buka scroll setelah berhasil daftar biasa
        toggleBodyScroll(false);

        Swal.fire({
          icon: "success",
          title: "Pendaftaran Berhasil!",
          text: `Selamat datang, ${defaultShopName}.`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } else {
      // --- LOGIKA LOGIN ---
      const userCredential = await auth.signInWithEmailAndPassword(
        new_user_email,
        new_user_password
      );

      if (userCredential.user) {
        await db.collection("sellers").doc(userCredential.user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 🔥 KRUSIAL: Tutup modal dan BUKA SCROLL setelah login berhasil
      if (authModal) authModal.classList.add("hidden");
      if (authForm) authForm.reset();
      toggleBodyScroll(false); // <--- INI SOLUSI UNTUK SCROLL MOBILE

      // onAuthStateChanged akan menangani pembaruan UI lainnya
    }
  } catch (error) {
    // Panggilan fungsi penanganan error yang disarankan
    handleAuthFirebaseError(error);

    // 🔥 PENTING: Jika login gagal, modal tetap terbuka, tapi scroll tetap dikunci.
    // Tidak perlu memanggil toggleBodyScroll(false) di sini.
  } finally {
    setLoading(authSubmitBtn, false, originalText);
  }
}

// Update UI berdasarkan status Auth (PENTING)
auth.onAuthStateChanged(async (user) => {
  // 🔥 AMBIL REFERENSI DOM DI AWAL UNTUK MENGATASI MASALAH TIMING

  // 🔥🔥🔥 INISIALISASI DOM DENGAN ID YANG BENAR 🔥🔥🔥
  const authBtn = document.getElementById("auth-btn");
  const mainBanner = document.getElementById("main-banner");
  const profileBtn = document.getElementById("profileBtn");
  const sellerControls = document.getElementById("seller-controls");
  const sellerGreeting = document.getElementById("seller-greeting");

  // ✅ ID TOMBOL ADMIN YANG BENAR
  const adminBtn = document.getElementById("admin-btn"); // <--- FIX ID

  const addUserBtn = document.getElementById("addUserBtn");
  const managementView = document.getElementById("management-view");
  const adminView = document.getElementById("adminView");
  const productListWrapper = document.getElementById("product-list-wrapper");

  // ✅ ID TOMBOL MANAGEMENT YANG BENAR
  const manageBtn = document.getElementById("manage-btn");

  if (user) {
    // 🔥 LOG VERIFIKASI UTAMA
    console.log("VERIFIKASI AUTENTIKASI: User login. Memproses UI.");

    currentUser = user;

    // --- (LOGIKA VERIFIKASI SELLER DATA) ---
    const sellerData = await getSellerData(user.uid);

    if (!sellerData) {
      auth.signOut();
      return;
    }

    const shopName = sellerData.shopName || user.email.split("@")[0];
    const userRole = sellerData.role;

    if (!isInitialLoad) {
      Swal.fire({
        icon: "success",
        title: "Selamat Datang!",
        text: `Anda berhasil masuk sebagai ${shopName}.`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }

    // 🔥🔥🔥 INTEGRASI NOTIFIKASI USER (Perubahan Realtime) 🔥🔥🔥
    const infoWrapper = document.getElementById("user-info-banner-wrapper");

    if (userRole && userRole !== "admin") {
      console.log("[NOTIF] Memuat notifikasi realtime untuk user penjual...");
      if (typeof unsubscribeNotifications === "function") {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
        console.log("RT Listener: Listener notifikasi lama dihentikan.");
      }
      if (typeof setupRealTimeNotificationsListener === "function") {
        unsubscribeNotifications = setupRealTimeNotificationsListener();
      }
    } else {
      if (infoWrapper) infoWrapper.classList.add("hidden");
      if (typeof unsubscribeNotifications === "function") {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
        console.log(
          "RT Listener: Listener notifikasi dihentikan karena user adalah admin."
        );
      }
    }
    // 🔥🔥🔥 AKHIR INTEGRASI NOTIFIKASI USER 🔥🔥🔥

    if (mainBanner) mainBanner.classList.add("hidden");

    // --- TAMPILAN HEADER (Logout) ---
    if (authBtn) {
      authBtn.textContent = `Logout`;
      authBtn.classList.remove(
        "bg-gold-accent",
        "text-navy-blue",
        "hover:bg-white"
      );
      authBtn.classList.add("bg-red-500", "text-white", "hover:bg-red-600");
    }

    if (profileBtn) profileBtn.classList.remove("hidden");

    // --- TAMPILAN SELLER CONTROLS CARD ---
    if (sellerControls) {
      sellerControls.classList.remove("hidden");
      if (sellerGreeting) sellerGreeting.textContent = `Halo, ${shopName}!`;
    }

    // LOGIKA KHUSUS ADMIN (BERDASARKAN ROLE)
    if (adminBtn) {
      if (userRole === "admin") {
        adminBtn.classList.remove("hidden");
        if (addUserBtn) addUserBtn.classList.remove("hidden");

        adminBtn.textContent = "Admin (Pelanggan)";

        // Memastikan listener admin dipasang dengan benar
        adminBtn.removeEventListener("click", toggleAdminView);
        adminBtn.addEventListener("click", toggleAdminView);

        if (adminView) adminView.classList.add("hidden");
        if (productListWrapper) productListWrapper.classList.remove("hidden");
      } else {
        adminBtn.classList.add("hidden");
        if (adminView) adminView.classList.add("hidden");
        if (addUserBtn) addUserBtn.classList.add("hidden");
      }
    }

    // Reset Tampilan ke Produk
    if (managementView) managementView.classList.add("hidden");
    if (adminView) adminView.classList.add("hidden");
    if (productListWrapper) productListWrapper.classList.remove("hidden");

    // --- PEMASANGAN EVENT LISTENER KRITIS UNTUK manageBtn (FIX TIMING) ---
    if (manageBtn) {
      console.log(
        "VERIFIKASI DOM: Elemen manageBtn ditemukan (ID: 'manage-btn'). Memasang Listener."
      );

      // 🔥🔥 Terapkan kelas 'relative' untuk posisi badge
      manageBtn.classList.add("relative");

      // FIX: Hapus listener lama jika ada (termasuk listener anonymous function atau dari initial load)
      // Kita hapus listener yang merujuk langsung ke fungsi toggleManagementView
      manageBtn.removeEventListener("click", toggleManagementView);

      // FIX: Pasang listener baru menggunakan referensi fungsi LANGSUNG
      manageBtn.addEventListener("click", toggleManagementView);

      // Set InnerHTML tombol Management + BADGE NOTIFIKASI
      manageBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
            </svg>
            Management
            <span 
                id="new-orders-count-badge" 
                class="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold leading-none hidden border-2 border-white"
            >
                0
            </span>
            `;
      manageBtn.style.display = "inline-flex";

      // Panggil listener untuk badge
      if (typeof setupRealTimeNewOrdersListener === "function") {
        unsubscribeOrders = setupRealTimeNewOrdersListener();
      }
    } else {
      console.error(
        "FATAL DOM ERROR: Elemen manageBtn (ID: 'manage-btn') tidak ditemukan! Pastikan ID HTML sudah benar."
      );
    }

    if (typeof salesChartInstance !== "undefined" && salesChartInstance) {
      salesChartInstance.destroy();
    }
  } else {
    currentUser = null;

    // --- LOGIKA UNSUBSCRIBE SAAT LOGOUT ---
    if (typeof unsubscribeOrders === "function") {
      unsubscribeOrders();
      unsubscribeOrders = null;
    }
    if (typeof unsubscribeNotifications === "function") {
      unsubscribeNotifications();
      unsubscribeNotifications = null;
    }

    // Hapus listener Management saat logout untuk memastikan tidak ada sisa listener lama
    if (manageBtn) {
      manageBtn.removeEventListener("click", toggleManagementView);
    }
    // --- AKHIR LOGIKA UNSUBSCRIBE ---

    const infoWrapper = document.getElementById("user-info-banner-wrapper");
    if (infoWrapper) infoWrapper.innerHTML = "";

    if (mainBanner) mainBanner.classList.remove("hidden");

    // --- TAMPILAN HEADER (Masuk) ---
    if (authBtn) {
      authBtn.innerHTML = `
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="currentColor" 
                class="h-4 w-4 sm:h-5 sm:w-5 bi bi-person-circle mr-1 flex-shrink-0" 
                viewBox="0 0 16 16"
                style="display: inline-block; vertical-align: middle;" 
            >  
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>  
                <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
            </svg>Masuk
        `;

      authBtn.classList.remove("bg-red-500", "text-white", "hover:bg-red-600");
      authBtn.classList.add(
        "bg-gold-accent",
        "text-navy-blue",
        "hover:bg-white"
      );
    }

    if (profileBtn) profileBtn.classList.add("hidden");

    // --- SEMBUNYIKAN SELLER CONTROLS CARD & MANAGEMENT VIEW ---
    if (sellerControls) sellerControls.classList.add("hidden");
    if (managementView) managementView.classList.add("hidden");
    if (adminView) adminView.classList.add("hidden");
    if (adminBtn) adminBtn.classList.add("hidden");
    if (addUserBtn) addUserBtn.classList.add("hidden");

    if (manageBtn) manageBtn.style.display = "none";

    if (productListWrapper) productListWrapper.classList.remove("hidden");
  }

  isInitialLoad = false;
  loadProducts();
});
async function handleAddToCartFromList(productListItem) {
  if (!productListItem || !productListItem.id) {
    Swal.fire("Error", "ID produk hilang.", "error");
    return;
  }

  try {
    // 🔥 Langkah 1: Ambil detail produk lengkap menggunakan ID (fetch ke API)
    // Kita butuh fungsi ini untuk mendapatkan hargaAsli, stok, dll.
    const fullProductDetail = await fetchProductDetails(productListItem.id);

    if (!fullProductDetail || !fullProductDetail.ownerId) {
      Swal.fire("Error", "Detail lengkap produk gagal dimuat.", "error");
      return;
    }

    // 🔥 Langkah 2: Kirim detail lengkap ke fungsi addToCart
    // Gunakan data lengkap agar cart memiliki hargaAsli
    await addToCart(fullProductDetail, 1);
  } catch (error) {
    console.error("Error fetching full product details:", error);
    Swal.fire("Error", "Gagal memuat detail produk untuk keranjang.", "error");
  }
}

// -----------------------------------------------------------------
// BAGIAN 5: FUNGSI KONTROL PRODUK OLEH PEMILIK (UPLOAD, EDIT, & HAPUS)
// -----------------------------------------------------------------
function handleEditClick(e) {
  e.stopPropagation();
  const productId = e.currentTarget.dataset.id;
  editingProductId = productId;
  croppedFileBlob = null;

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

async function uploadImageToCloudinary(fileOrBlob) {
  const formData = new FormData();
  formData.append("file", fileOrBlob);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `dakata_shop/${currentUser.uid}`);

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
  // 🔥 MENGAMBIL HARGA ASLI (WAJIB)
  const hargaAsli = parseInt(document.getElementById("product-harga").value);

  // 🔥 MENGAMBIL HARGA DISKON (OPSIONAL)
  const hargaDiskonInput = document.getElementById("product-diskon").value;
  let hargaDiskon = hargaDiskonInput ? parseInt(hargaDiskonInput) : null;

  const deskripsi = document.getElementById("product-desc").value;
  const stock = parseInt(document.getElementById("product-stock").value || 0);

  const fileFromInput = productImageFile.files[0];
  const fileToProcess = croppedFileBlob || fileFromInput;

  const oldImageUrl = isEditing ? imagePreview.src : null;

  // --- VALIDASI HARGA ASLI & STOK ---
  if (isNaN(hargaAsli) || hargaAsli <= 0) {
    uploadError.textContent = "Harga Asli harus berupa angka positif.";
    uploadError.classList.remove("hidden");
    return;
  }

  if (isNaN(stock) || stock < 0) {
    uploadError.textContent = "Stok harus berupa angka positif atau nol.";
    uploadError.classList.remove("hidden");
    return;
  }

  // --- 🔥 VALIDASI HARGA DISKON 🔥 ---
  if (hargaDiskon !== null) {
    if (isNaN(hargaDiskon) || hargaDiskon <= 0) {
      uploadError.textContent =
        "Harga Diskon harus berupa angka positif yang valid.";
      uploadError.classList.remove("hidden");
      return;
    }
    if (hargaDiskon >= hargaAsli) {
      uploadError.textContent =
        "Harga Diskon harus lebih kecil dari Harga Asli.";
      uploadError.classList.remove("hidden");
      return;
    }
  }
  // --- AKHIR VALIDASI DISKON ---

  if (!isEditing && !fileToProcess) {
    uploadError.textContent = "Anda harus memilih foto produk.";
    uploadError.classList.remove("hidden");
    return;
  }

  if (isEditing && !fileToProcess && !oldImageUrl) {
    uploadError.textContent =
      "Gagal mendapatkan gambar lama. Harap upload ulang gambar.";
    uploadError.classList.remove("hidden");
    return;
  }

  setLoading(uploadSubmitBtn, true, originalText, loadingText);

  try {
    let imageUrl;

    if (fileToProcess) {
      // Jika ada file baru (crop atau dari input), upload ke Cloudinary
      imageUrl = await uploadImageToCloudinary(fileToProcess);
      croppedFileBlob = null;
    } else if (isEditing) {
      // Jika mengedit dan TIDAK ADA file baru, gunakan URL gambar lama
      imageUrl = oldImageUrl;
    } else {
      throw new Error("Produk baru memerlukan gambar.");
    }

    const productData = {
      nama: nama,
      harga: hargaAsli, // Harga Asli disimpan di field 'harga'
      deskripsi: deskripsi,
      stock: stock,
      ownerId: currentUser.uid,
    };

    // 🔥 LOGIKA DISKON DI OBJEK DATA 🔥
    if (hargaDiskon !== null) {
      // Jika user mengisi harga diskon yang valid, tambahkan ke data
      productData.hargaDiskon = hargaDiskon;
    } else if (isEditing) {
      // Jika user mengosongkan field diskon saat mengedit, hapus field 'hargaDiskon'
      // dari dokumen Firestore menggunakan FieldValue.delete().
      productData.hargaDiskon = firebase.firestore.FieldValue.delete();
    }
    // Jika hargaDiskon null dan isEditing false (produk baru), kita tidak menambahkan field 'hargaDiskon' sama sekali.

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

    // --- RESET UI SETELAH BERHASIL ---
    uploadForm.reset();

    // Bersihkan pratinjau gambar
    imagePreview.src = "";
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
    uploadError.textContent = `Gagal memproses produk: ${error.message}.`;
    uploadError.classList.remove("hidden");
  } finally {
    setLoading(uploadSubmitBtn, false, originalText);
  }
}

async function handleDeleteProduct(e) {
  e.stopPropagation();

  const deleteBtn = e.currentTarget;
  const productId = deleteBtn.dataset.id;
  const originalHtml = deleteBtn.innerHTML;
  const originalClassName = deleteBtn.className;

  if (!currentUser || !productId) {
    Swal.fire({
      icon: "error",
      title: "Akses Ditolak",
      text: "Silakan login sebagai penjual untuk melakukan aksi ini.",
    });
    return;
  }

  // 1. Dapatkan data produk untuk URL gambar
  let imageUrl = null;
  try {
    const productDoc = await db.collection("products").doc(productId).get();
    if (productDoc.exists) {
      imageUrl = productDoc.data().imageUrl;
    }
  } catch (error) {
    Swal.fire("Gagal!", "Gagal mendapatkan data produk.", "error");
    return;
  }

  const result = await Swal.fire({
    title: "Hapus Produk?",
    text: "Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan, dan gambar terkait akan dihapus secara aman.",
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
      const publicId = getCloudinaryPublicId(imageUrl);

      if (publicId) {
        // 💥 2. PANGGIL CLOUDFLARE WORKER UNTUK PENGHAPUSAN AMAN 💥
        const workerUrl = "https://jolly-cell-829e.jokoadhikusumo.workers.dev"; // GANTI INI DENGAN URL ASLI ANDA

        console.log(
          `Mengirim permintaan penghapusan gambar ke Worker untuk Public ID: ${publicId}`
        );

        const deleteResponse = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId: publicId }),
        });

        if (!deleteResponse.ok) {
          const errorDetail = await deleteResponse.json();
          // Jika Worker gagal menghapus, lemparkan error untuk membatalkan penghapusan Firestore
          throw new Error(
            `Worker Error: ${
              errorDetail.message || "Gagal menghapus Cloudinary."
            }`
          );
        }

        console.log("Gambar Cloudinary berhasil dihapus via Worker.");
      }

      // 3. Hapus data dari Firestore (Hanya jika Worker berhasil)
      await db.collection("products").doc(productId).delete();

      Swal.fire(
        "Dihapus!",
        "Produk dan gambar terkait berhasil dihapus.",
        "success"
      );
      loadProducts();
    } catch (error) {
      console.error("Error menghapus produk:", error);
      Swal.fire("Gagal!", `Gagal menghapus produk. ${error.message}`, "error");
    } finally {
      // 4. Reset loading state
      setLoading(deleteBtn, false, originalHtml);
    }
  }
}
// -----------------------------------------------------------------
// BAGIAN 6: FUNGSI MANAGEMENT (RIWAYAT TRANSAKSI & SALDO)
// -----------------------------------------------------------------
async function updateDashboardMetrics(uid) {
  console.log("LOG METRIK: Memuat metrik dashboard untuk UID:", uid);

  // Dapatkan elemen-elemen DOM (jika belum dideklarasikan global)
  const totalSaldoEl = document.getElementById("total-saldo");
  const totalTerjualEl = document.getElementById("total-terjual");
  const totalTransaksiEl = document.getElementById("total-transaksi");

  // Reset tampilan loading
  totalSaldoEl.textContent = "Memuat...";
  totalTerjualEl.textContent = "Memuat...";
  totalTransaksiEl.textContent = "Memuat...";

  try {
    const metricsDoc = await db.collection("dashboards").doc(uid).get();

    // ⭐ LOG KRITIS 1: Apakah dokumen metrik ditemukan? ⭐
    console.log("LOG METRIK: Dokumen dashboard ditemukan:", metricsDoc.exists);

    if (metricsDoc.exists) {
      const data = metricsDoc.data();

      // --- 1. ISI KARTU STATISTIK ---
      const totalBalance = data.totalBalance || 0;
      const totalSold = data.totalSold || 0;
      const totalTransactions = data.totalTransactions || 0;

      totalSaldoEl.textContent = formatIDR(totalBalance);
      totalTerjualEl.textContent = totalSold.toLocaleString("id-ID");
      totalTransaksiEl.textContent = totalTransactions.toLocaleString("id-ID");

      // --- 2. PERSIAPAN DATA CHART ---
      const salesByPeriod = data.salesByPeriod || {};

      // ⭐ LOG KRITIS 2: Apa isi dari kolom salesByPeriod? ⭐
      console.log("LOG METRIK: Data salesByPeriod mentah:", salesByPeriod);

      const sortedPeriods = Object.keys(salesByPeriod).sort();

      const chartLabels = sortedPeriods.map((key) => {
        // Logika pemformatan YYYY-MM menjadi Bulan/YY (misal: Des/25)
        const [year, month] = key.split("-");
        if (month) {
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
          return `${monthNames[parseInt(month) - 1]}/${year.substring(2)}`;
        }
        return key;
      });

      const chartValues = sortedPeriods.map((key) => salesByPeriod[key] || 0);

      // --- 3. ISI VARIABEL GLOBAL CHART DATA ---
      // Variabel ini akan digunakan oleh renderSalesChart()
      window.chartDataForSeller = {
        labels: chartLabels.length > 0 ? chartLabels : ["N/A"],
        datasets: [
          {
            label: "Penjualan Bersih (Rp)",
            data: chartValues.length > 0 ? chartValues : [0],
            backgroundColor: "#3b82f6", // Warna sesuai Tailwind blue-500
          },
        ],
      };

      console.log(
        "LOG METRIK: chartDataForSeller diisi:",
        window.chartDataForSeller
      );
    } else {
      // Jika dokumen metrik tidak ditemukan
      console.warn(
        `LOG METRIK: Dokumen 'dashboards/${uid}' tidak ada. Menggunakan nilai default.`
      );

      // Isi kartu dengan 0
      totalSaldoEl.textContent = formatIDR(0);
      totalTerjualEl.textContent = "0";
      totalTransaksiEl.textContent = "0";

      // Isi variabel global chart dengan nilai default/kosong
      window.chartDataForSeller = {
        labels: ["N/A"],
        datasets: [
          {
            label: "Penjualan Bersih (Rp)",
            data: [0],
            backgroundColor: "#ccc",
          },
        ],
      };
    }
  } catch (error) {
    console.error("Error loading dashboard metrics:", error);
    totalSaldoEl.textContent = "Error";
    totalTerjualEl.textContent = "Error";
    totalTransaksiEl.textContent = "Error";
  }
}

function toggleManagementView() {
  console.log(
    "LOG PANGGILAN FUNGSI: toggleManagementView BERHASIL dieksekusi."
  );

  if (!currentUser) {
    Swal.fire(
      "Akses Ditolak",
      "Anda harus login untuk mengakses Management View.",
      "warning"
    );
    return;
  }

  const productListWrapperElement = document.getElementById(
    "product-list-wrapper"
  );
  const newOrdersListBody = document.getElementById("new-orders-list");

  if (
    !managementView ||
    !productListWrapperElement ||
    !manageBtn ||
    !newOrdersListBody
  ) {
    console.error(
      "Error DOM di toggleManagementView. Pastikan elemen managementView, productListWrapperElement, manageBtn, dan newOrdersListBody terdefinisi."
    );
    return;
  }

  getSellerData(currentUser.uid)
    .then((sellerData) => {
      if (sellerData.role !== "biasa" && sellerData.role !== "admin") {
        Swal.fire(
          "Akses Ditolak",
          "Management View hanya tersedia untuk Penjual (Role Biasa) dan Admin.",
          "error"
        );
        return;
      }

      if (managementView.classList.contains("hidden")) {
        // --- MASUK KE TAMPILAN MANAGEMENT ---
        managementView.classList.remove("hidden");
        productListWrapperElement.classList.add("hidden");

        if (adminView) adminView.classList.add("hidden");

        if (adminBtn) {
          adminBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Admin (Pelanggan)
                    `;
        }

        // Ubah Teks Tombol Management menjadi 'Lihat Produk' + Badge
        if (manageBtn) {
          manageBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 4v1h10V7H5zm0 3v1h10v-1H5zm0 3v1h10v-1H5z" clip-rule="evenodd" />
                        </svg>
                        Lihat Produk
                        <span 
                            id="new-orders-count-badge" 
                            class="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold leading-none hidden border-2 border-white"
                        ></span>
                    `;
        }

        // 🔥🔥 RENDER DATA ORDER DARI CACHE (Mengatasi masalah "Memuat...") 🔥🔥
        // Tampilkan pesan loading SEMENTARA sebelum render cache, untuk UX yang lebih baik
        newOrdersListBody.innerHTML =
          '<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat data real-time dari cache...</td></tr>';

        if (typeof renderNewOrdersTable === "function") {
          // renderNewOrdersTable dipanggil menggunakan data cache yang selalu diupdate oleh listener background
          renderNewOrdersTable(cachedOrders, newOrdersListBody);
        } else {
          console.error("Fungsi renderNewOrdersTable tidak ditemukan.");
          newOrdersListBody.innerHTML =
            '<tr><td colspan="5" class="text-center py-4 text-red-500">Error: renderNewOrdersTable missing.</td></tr>';
        }

        loadTransactionHistory();
      } else {
        // --- KELUAR DARI TAMPILAN MANAGEMENT (KEMBALI KE PRODUK) ---
        managementView.classList.add("hidden");
        productListWrapperElement.classList.remove("hidden");

        // Kembalikan Teks Tombol Management ke 'Management' + Badge
        if (manageBtn) {
          manageBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
                        </svg>
                        Management
                        <span 
                            id="new-orders-count-badge" 
                            class="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold leading-none hidden border-2 border-white"
                        ></span>
                    `;
        }
      }
    })
    .catch((error) => {
      console.error("Error checking role for Management View:", error);
      Swal.fire(
        "Error Database",
        "Gagal memverifikasi peran pengguna.",
        "error"
      );
    });
}
async function loadTransactionHistory() {
  const sellerId = getCurrentSellerId();
  const transactionHistoryBody = document.getElementById("transaction-history");

  if (!sellerId) return;

  // Header memiliki 7 kolom: ID, Tanggal, Produk, Harga Satuan, Pembeli, Status, Aksi.
  // Catatan: Header di HTML Anda harus sudah disesuaikan dengan urutan baru ini.
  transactionHistoryBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Memuat riwayat transaksi...</td></tr>`;

  try {
    // Query: Ambil semua pesanan milik penjual yang statusnya BUKAN 'Diterima'.
    const q = db
      .collection("orders")
      .where("ownerId", "==", sellerId)
      .where("status", "!=", "Diterima")
      .orderBy("status")
      .orderBy("timestamp", "desc")
      .limit(50);

    const querySnapshot = await q.get();

    const orders = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      docId: doc.id,
      timestamp: doc.data().timestamp
        ? doc.data().timestamp.toDate()
        : new Date(),
      totalAmount: doc.data().totalAmount || 0,
      orderDetail: doc.data().orderDetail || "N/A",
      buyerName: doc.data().buyerName || "Pembeli Tidak Dikenal",
      status: doc.data().status || "Diterima",
    }));

    // --- LOGIKA PERHITUNGAN STATISTIK ---
    let saldo = 0;
    let terjual = 0;
    let totalTx = 0;
    const salesByPeriod = {};
    // ... (Logika statistik lainnya) ...
    // ------------------------------------

    const rows = orders.map((order) => {
      const orderId = order.docId;
      const currentStatus = order.status;
      const orderDate = order.timestamp;

      // Status Lanjutan (Aksi di Riwayat Transaksi)
      const isFinished =
        currentStatus === "Selesai" || currentStatus === "Ditolak";

      let actions;
      if (isFinished) {
        actions = `<span class="text-gray-500 text-xs">Selesai/Ditolak</span>`;
      } else {
        const statusOrder = {
          Diterima: 0,
          Diproses: 1,
          Pengiriman: 2,
          Selesai: 3,
        };
        const nextStatuses = ["Diproses", "Pengiriman", "Selesai"].filter(
          (s) => statusOrder[s] > statusOrder[currentStatus]
        );

        actions = `
                <select onchange="updateOrderStatus('${orderId}', this.value)" class="py-1 px-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="" disabled selected>Ubah Status</option>
                    ${nextStatuses
                      .map((s) => `<option value="${s}">${s}</option>`)
                      .join("")}
                </select>
            `;
      }

      // UPDATE STATISTIK & DATA CHART
      totalTx += 1;
      if (currentStatus === "Selesai") {
        saldo += order.totalAmount;
        terjual += 1;

        const period =
          orderDate.getFullYear() +
          "-" +
          (orderDate.getMonth() + 1).toString().padStart(2, "0");
        salesByPeriod[period] =
          (salesByPeriod[period] || 0) + order.totalAmount;
      }

      const productDetailContent = order.orderDetail || "N/A";

      return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">${
                  order.id || orderId
                }</td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.timestamp.toLocaleDateString(
                  "id-ID"
                )}</td>
                
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div class="min-w-[150px]">${productDetailContent}</div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp ${order.totalAmount.toLocaleString(
                  "id-ID"
                )}</td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-200">${
                  order.buyerName
                }</td> 
                
                <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(
                  currentStatus
                )}</td>
                
                <td class="px-6 py-4 whitespace-nowrap">${actions}</td>
                
                </tr>
        `;
    });

    // ... (Logika update statistik dan render chart) ...
    if (typeof totalSaldo !== "undefined")
      totalSaldo.textContent = `Rp ${saldo.toLocaleString("id-ID")}`;
    if (typeof totalTerjual !== "undefined") totalTerjual.textContent = terjual;
    if (typeof totalTransaksi !== "undefined")
      totalTransaksi.textContent = totalTx;

    transactionHistoryBody.innerHTML =
      rows.join("") ||
      `<tr><td colspan="7" class="text-center py-4 text-gray-500">Tidak ada riwayat transaksi yang ditindaklanjuti.</td></tr>`;

    if (typeof renderSalesChart === "function") renderSalesChart(salesByPeriod);
  } catch (e) {
    console.error("Gagal memuat riwayat transaksi dari Firestore: ", e);
    transactionHistoryBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Gagal mengambil riwayat transaksi. Cek log console untuk Composite Index.</td></tr>`;
  }
}
// FUNGSI BARU: RENDERING GRAFIK PENJUALAN
function renderSalesChart(salesData) {
  if (!salesChartCanvas) return;

  const rawLabels = Object.keys(salesData).sort();
  const chartLabels = rawLabels.map((period) => {
    const [year, month] = period.split("-");
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

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded.");
    return;
  }

  const chartTextColor = getChartColor("text");
  const chartGridColor = getChartColor("grid");

  const ctx = salesChartCanvas.getContext("2d");
  salesChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Penjualan Bersih (Rp)",
          data: chartValues,
          backgroundColor: "rgba(54, 162, 235, 0.8)", // Biru (Anda bisa ganti ini dengan variabel CSS jika mau)
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
          title: {
            display: true,
            text: "Pendapatan (Rp)",
            color: chartTextColor, // 🔥 Disesuaikan
          },
          ticks: {
            color: chartTextColor, // 🔥 Disesuaikan
            callback: function (value) {
              if (value >= 1000000) {
                return "Rp " + (value / 1000000).toFixed(1) + "Jt";
              }
              if (value === 0) return "Rp 0";
              return "Rp " + (value / 1000).toFixed(0) + "k";
            },
          },
          grid: {
            color: chartGridColor, // 🔥 Disesuaikan
            borderColor: chartTextColor, // 🔥 Disesuaikan
          },
        },
        x: {
          title: {
            display: true,
            text: "Periode (Bulan/Tahun)",
            color: chartTextColor, // 🔥 Disesuaikan
          },
          ticks: {
            color: chartTextColor, // 🔥 Disesuaikan
          },
          grid: {
            color: chartGridColor, // 🔥 Disesuaikan
            borderColor: chartTextColor, // 🔥 Disesuaikan
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: chartTextColor, // 🔥 Disesuaikan
          },
        },
        tooltip: {
          // Anda mungkin ingin menyesuaikan warna latar belakang tooltip di sini,
          // tapi biasanya warna defaultnya (hitam/putih) sudah kontras.
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
// BAGIAN 6.5: FUNGSI ADMIN (DAFTAR PELANGGAN)
// -----------------------------------------------------------------

function closeDetailModal() {
  const modal = document.getElementById("userDetailsModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

const formatIDR = (num) =>
  (num || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
async function aggregateSellerMetrics(uid, period) {
  const results = {
    totalBalance: 0,
    totalSold: 0, // Order Selesai
    totalTransactions: 0,
    totalAdminFee: 0, // 🔥 FIELD BARU 🔥
    salesByPeriod: {},
  };

  // 🔥 1. Tentukan batas waktu filter (Jika 'period' diberikan) 🔥
  let startDate = null;
  let endDate = null;

  if (period && period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split("-").map(Number);

    // Awal bulan (contoh: 2025-12-01 00:00:00)
    startDate = new Date(year, month - 1, 1, 0, 0, 0);
    // Awal bulan berikutnya (contoh: 2026-01-01 00:00:00)
    endDate = new Date(year, month, 1, 0, 0, 0);

    console.log(
      `Filtering metrics for period ${period}: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );
  }

  try {
    // 2. Ambil Fixed Fee Rate dari dokumen penjual
    const sellerDoc = await db.collection("sellers").doc(uid).get();
    const sellerData = sellerDoc.data() || {};
    // Ambil Fixed Fee, default 0 jika belum diset
    const adminFeeFixedAmount = sellerData.adminFeeFixedAmount || 0;

    // 3. Bangun query untuk Order
    let query = db.collection("orders").where("ownerId", "==", uid);

    // Terapkan filter waktu jika periode ditentukan
    if (startDate && endDate) {
      // 🔥 Filter Query Firestore menggunakan range timestamp 🔥
      query = query
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<", endDate);
    }

    // Order by timestamp untuk memproses
    const ordersSnapshot = await query.orderBy("timestamp", "desc").get();

    // TOTAL TRANSAKSI HANYA MENGHITUNG YANG TERFILTER
    results.totalTransactions = ordersSnapshot.size;

    ordersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const currentStatus = data.status || "Diterima";

      if (currentStatus === "Selesai") {
        const orderDate = data.timestamp ? data.timestamp.toDate() : new Date();
        const totalAmount = data.totalAmount || 0;

        results.totalBalance += totalAmount;
        results.totalSold += 1; // Menghitung sebagai "Total Order Selesai"

        // 🔥 Hitung Total Biaya Admin (Fixed Fee * Jumlah Order Selesai) 🔥
        // Perhitungan total admin fee bulanan harus dilakukan di luar loop,
        // tapi kita bisa menghitung admin fee untuk order ini dan menjumlahkannya.
        results.totalAdminFee += adminFeeFixedAmount;

        // Perhitungan salesByPeriod (digunakan untuk chart, meskipun di modal viewUserDetails
        // chart dirender untuk satu periode yang difilter)
        const periodKey =
          orderDate.getFullYear() +
          "-" +
          (orderDate.getMonth() + 1).toString().padStart(2, "0");
        results.salesByPeriod[periodKey] =
          (results.salesByPeriod[periodKey] || 0) + totalAmount;
      }
    });
  } catch (error) {
    console.error("Error aggregating seller metrics:", error);
    // Kembalikan objek results kosong agar rendering tidak crash
    return results;
  }

  console.log("Metrik yang diagregasi:", results);

  return results;
}

async function viewUserDetails(uid) {
  const modal = document.getElementById("userDetailsModal");

  // Debug Log 1: Memulai fungsi dan UID yang dicari
  console.log("--- Memuat Detail Pengguna ---");
  console.log("UID yang diolah:", uid);

  // Cek keberadaan elemen detailUid sebelum mencoba mengatur textContent.
  const detailUidElement = document.getElementById("detailUid");
  if (detailUidElement) {
    detailUidElement.textContent = uid;
  }

  // 1. Reset/Loading state + 🔥 AMBIL REFERENSI SEMUA ELEMEN UTAMA 🔥
  document.getElementById("detailShopName").textContent = "Memuat...";
  document.getElementById(
    "profileContent"
  ).innerHTML = `<p class="col-span-3 text-center text-gray-500">Memuat profil...</p>`;

  // Mengambil referensi elemen yang akan diakses di scope inner loadAndRenderMetrics
  const dashboardContent = document.getElementById("dashboardContent");
  const chartWrapper = document.getElementById("sellerChartWrapper");
  const recentTransactionsContent = document.getElementById(
    "recentTransactionsContent"
  );
  const transactionHeader = modal.querySelector(
    ".bg-white.border.rounded-lg.shadow-lg.p-5 h4.text-xl.font-semibold.border-b.pb-2.mb-4.text-gray-700"
  );

  // 🔥 REFERENSI BARU UNTUK UI KALENDER KUSTOM 🔥
  const periodInput = document.getElementById("periodInput");
  const selectedPeriodText = document.getElementById("selectedPeriodText");
  const calendarPopup = document.getElementById("calendarPopup");
  const filterYear = document.getElementById("filterYear"); // Dropdown tahun di dalam popup
  const monthGrid = document.getElementById("monthGrid");
  const prevYearBtn = document.getElementById("prevYear");
  const nextYearBtn = document.getElementById("nextYear");
  const filterWrapper = document.getElementById("dashboardFilterWrapper");

  if (dashboardContent) {
    dashboardContent.innerHTML = `<p class="col-span-3 text-center text-gray-500">Memuat metrik...</p>`;
  }

  // Set loading state untuk Transaksi dan Invoice
  recentTransactionsContent.innerHTML = `<p class="text-center text-gray-500">Memuat riwayat...</p>`;
  document.getElementById(
    "invoiceHistoryContent"
  ).innerHTML = `<p class="text-center text-gray-500">Memuat invoice...</p>`;

  // Reset Admin Fee Setting Container
  const currentAdminFeeElement = document.getElementById("currentAdminFee");
  const adminFeeSettingBtn = document.getElementById("adminFeeSettingBtn");

  if (currentAdminFeeElement) currentAdminFeeElement.textContent = "Memuat...";
  if (adminFeeSettingBtn) adminFeeSettingBtn.classList.add("hidden");
  if (filterWrapper) filterWrapper.classList.add("hidden"); // Sembunyikan saat loading

  // 🔥 KONTROL SCROLL (Langkah Awal) 🔥
  document.body.style.overflow = "hidden";

  // Tampilkan modal
  modal.classList.remove("hidden");

  try {
    // --- A. AMBIL DATA SELLER (PROFILE) ---
    const sellerDoc = await db.collection("sellers").doc(uid).get();

    if (!sellerDoc.exists) {
      console.error("Dokumen penjual tidak ditemukan untuk UID:", uid);

      // 🔥 Ganti notifikasi error di sini dengan SweetAlert 🔥
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat",
        text: `Dokumen penjual dengan UID ${uid} tidak ditemukan di database.`,
        confirmButtonText: "Tutup",
      });

      document.getElementById("detailShopName").textContent =
        "Pengguna Tidak Ditemukan";
      document.getElementById(
        "profileContent"
      ).innerHTML = `<p class="col-span-3 text-red-500">Dokumen pengguna tidak ditemukan.</p>`;

      // 🔥 KONTROL SCROLL (Error Handle 1) 🔥
      document.body.style.overflow = "";

      return;
    }

    const sellerData = sellerDoc.data();
    const shopName = sellerData.shopName || "Toko Tanpa Nama";
    const role = sellerData.role || "biasa";

    // ... (Bagian render kartu profil tetap sama) ...
    document.getElementById("detailShopName").textContent =
      shopName + (role === "admin" ? " (ADMIN)" : "");

    document.getElementById("profileContent").innerHTML = `
            <div class="col-span-2 md:col-span-3 pb-2 mb-4 border-b">
                <p class="text-lg font-bold text-gray-800 flex items-center">
                    ${shopName} 
                    <span class="ml-3 text-sm font-medium px-3 py-1 rounded-full ${
                      role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }">${role.toUpperCase()}</span>
                </p>
            </div>
            
            <div class="col-span-2 md:col-span-1 space-y-2">
                <label class="text-xs font-semibold text-gray-600">Email</label>
                <div class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">${
                  sellerData.email || "-"
                }</div>
            </div>
            
            <div class="col-span-2 md:col-span-1 space-y-2">
                <label class="text-xs font-semibold text-gray-600">Telepon</label>
                <div class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">${
                  sellerData.phone || "-"
                }</div>
            </div>
            
            <div class="col-span-2 md:col-span-1 space-y-2">
                <label class="text-xs font-semibold text-gray-600">UID Penjual</label>
                <div class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-700 break-all">${uid}</div>
            </div>

            <div class="col-span-2 md:col-span-3 mt-4 space-y-2 border-t pt-4">
                <label class="text-xs font-semibold text-gray-600">Alamat Lengkap</label>
                <div class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">${
                  sellerData.address || "-"
                }</div>
            </div>
            
            <div class="col-span-2 md:col-span-3 text-xs text-gray-500 mt-4">
                <strong>Sandi:</strong> <span class="text-red-500 font-medium">TIDAK DAPAT DITAMPILKAN (Keamanan)</span>
                | Terakhir Login: ${
                  sellerData.lastLogin
                    ? new Date(sellerData.lastLogin.toDate()).toLocaleString()
                    : "-"
                }
            </div>
        `;

    // 🔥 PENGATURAN BIAYA ADMIN (FIXED FEE RATE) 🔥
    const adminFeeFixedAmount = sellerData.adminFeeFixedAmount || 0;

    // --- MENGISI KONTROL BIAYA ADMIN (RATE) ---
    if (currentAdminFeeElement && adminFeeSettingBtn) {
      currentAdminFeeElement.textContent = formatIDR(adminFeeFixedAmount);
      adminFeeSettingBtn.classList.remove("hidden");
      adminFeeSettingBtn.onclick = () =>
        openAdminFeeModal(uid, adminFeeFixedAmount);
      console.log("Kontrol Biaya Admin Fixed Fee Rate diset.");
    }

    // 🔥 FUNGSI INNER UNTUK MEMUAT & MERENDER METRIK DAN TRANSAKSI BULANAN 🔥
    // ... (Logika loadAndRenderMetricsAndTransactions tetap sama, tidak perlu diulang)
    async function loadAndRenderMetricsAndTransactions(sellerUid, period) {
      console.log(`Memuat metrik dan transaksi untuk periode: ${period}`);

      if (dashboardContent) {
        dashboardContent.innerHTML = `<p class="col-span-4 text-center text-gray-500 p-4">Memuat data metrik ${period}...</p>`;
      }
      if (recentTransactionsContent) {
        recentTransactionsContent.innerHTML = `<p class="text-center text-gray-500">Memuat transaksi ${period}...</p>`;
      }

      // --- 1. RENDER METRIK (DASHBOARD CARDS & CHART) ---
      const metrics = await aggregateSellerMetrics(sellerUid, period);
      const fullMonthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      let periodLabel = period;

      // Update text pada tombol input dan tentukan label chart
      if (selectedPeriodText && period.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = period.split("-");
        const monthIndex = parseInt(month, 10) - 1;
        periodLabel = `${fullMonthNames[monthIndex]} ${year}`;
        selectedPeriodText.textContent = periodLabel;
      }

      // Update Header Riwayat Transaksi
      if (transactionHeader) {
        transactionHeader.innerHTML = `Riwayat Transaksi (${periodLabel})`;
      }

      if (!metrics) {
        if (dashboardContent) {
          dashboardContent.innerHTML = `<p class="col-span-4 text-center text-red-500 p-4">Gagal memuat metrik untuk periode ini.</p>`;
        }
        if (chartWrapper) {
          chartWrapper.innerHTML = `<h5 class="text-sm sm:text-base font-medium mb-2">Statistik Penjualan per Periode</h5><p class="text-center text-gray-500">Data tidak tersedia.</p>`;
        }
        // Lanjutkan ke bagian Transaksi, tapi metriknya gagal
      } else {
        // RENDER KARTU DASHBOARD (4 Kartu)
        const totalAdminFee = metrics.totalAdminFee || 0;
        if (dashboardContent) {
          dashboardContent.innerHTML = `
                <div class="bg-blue-50 p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p class="text-xs text-blue-700">Total Saldo (Revenue)</p>
                    <p class="text-lg font-bold text-blue-900 mt-1">${formatIDR(
                      metrics.totalBalance || 0
                    )}</p>
                </div>
                <div class="bg-green-50 p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                    <p class="text-xs text-green-700">Order Selesai</p>
                    <p class="text-lg font-bold text-green-900 mt-1">${(
                      metrics.totalSold || 0
                    ).toLocaleString("id-ID")}</p>
                </div>
                
                <div class="bg-red-50 p-3 rounded-lg shadow-sm border-l-4 border-red-500">
                    <p class="text-xs text-red-700">Total Biaya Admin</p>
                    <p class="text-lg font-bold text-red-900 mt-1">${formatIDR(
                      totalAdminFee
                    )}</p>
                </div>

                <div class="bg-yellow-50 p-3 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <p class="text-xs text-yellow-700">Total Transaksi</p>
                    <p class="text-lg font-bold text-yellow-900 mt-1">${(
                      metrics.totalTransactions || 0
                    ).toLocaleString("id-ID")}</p>
                </div>
            `;
        }

        // LOGIKA CHART
        if (chartWrapper && typeof renderSellerSalesChart === "function") {
          chartWrapper.innerHTML = `
                    <h5 class="text-sm sm:text-base font-medium mb-2">Statistik Penjualan per Periode</h5>
                    <div style="height: 250px;">
                        <canvas id="sellerSalesChart"></canvas>
                    </div>
                `;

          const chartValue = metrics.totalBalance || 0;

          const localChartData = {
            labels: [periodLabel],
            datasets: [
              {
                label: "Penjualan Bersih (Rp)",
                data: [chartValue],
                backgroundColor: "#3b82f6",
              },
            ],
          };

          renderSellerSalesChart(localChartData);
        } else if (chartWrapper) {
          console.error("Fungsi renderSellerSalesChart tidak ditemukan.");
        }
      } // end metrics rendering

      // --- 2. RENDER TRANSAKSI (Filter berdasarkan periode YYYY-MM) ---
      const [yearStr, monthStr] = period.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      // Hitung batas waktu (dari awal bulan yang difilter hingga awal bulan berikutnya)
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1); // Awal bulan berikutnya

      // Konversi ke timestamp Firestore
      const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

      console.log(
        `Filtering transactions from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`
      );

      const transactionsSnapshot = await db
        .collection("orders")
        .where("ownerId", "==", sellerUid)
        .where("timestamp", ">=", startTimestamp)
        .where("timestamp", "<", endTimestamp)
        .orderBy("timestamp", "desc")
        .get();

      if (transactionsSnapshot.empty) {
        recentTransactionsContent.innerHTML = `<p class="text-center text-gray-500 italic">Tidak ada riwayat transaksi pada periode ini (${periodLabel}).</p>`;
      } else {
        let transactionsHTML = "";
        transactionsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const time = data.timestamp
            ? new Date(data.timestamp.toDate()).toLocaleString()
            : "-";
          const statusColor =
            data.status === "Selesai"
              ? "bg-green-500"
              : data.status === "Pending" || data.status === "Diproses"
              ? "bg-yellow-500"
              : "bg-gray-500";

          const transactionPrice = data.totalAmount || 0;
          const formattedPrice = formatIDR(transactionPrice);

          transactionsHTML += `
                      <div class="p-3 border rounded-lg flex justify-between items-center text-sm hover:bg-gray-50">
                          <div>
                              <p class="font-semibold text-gray-800">Order ID: <span class="font-mono text-xs text-blue-600">${doc.id.substring(
                                0,
                                10
                              )}...</span></p>
                              <p class="text-xs text-gray-500">Pembeli: ${
                                data.buyerName || "Anonim"
                              }</p>
                              <p class="text-xs text-gray-500">${time}</p>
                          </div>
                          <div class="text-right">
                              <span class="font-bold text-lg text-blue-600">${formattedPrice}</span>
                              <span class="ml-3 px-2 py-0.5 rounded-full text-xs text-white ${statusColor}">${
            data.status
          }</span>
                          </div>
                      </div>
                  `;
        });
        recentTransactionsContent.innerHTML = transactionsHTML;
      }

      currentPeriodTracker = period;
    } // end loadAndRenderMetricsAndTransactions

    // --- FUNGSI UTILITY FILTER BARU (KALENDER) ---
    const monthNamesShort = [
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

    let currentPeriodTracker = ""; // YYYY-MM

    /** Mengisi dropdown tahun di popup */
    function initializeYearFilter(defaultYear) {
      if (!filterYear) return;
      filterYear.innerHTML = "";

      const currentYear = new Date().getFullYear();
      const startYear = 2023; // Tentukan tahun awal data/aplikasi Anda

      for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        if (year === defaultYear) {
          option.selected = true;
        }
        filterYear.appendChild(option);
      }
    }

    /** Mengisi grid tombol bulan */
    function renderMonthGrid(selectedYear, activePeriod) {
      if (!monthGrid) return;
      monthGrid.innerHTML = "";

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // 1-based

      for (let i = 1; i <= 12; i++) {
        const monthValue = String(i).padStart(2, "0");
        const monthKey = `${selectedYear}-${monthValue}`;

        let button = document.createElement("button");
        button.type = "button";
        button.textContent = monthNamesShort[i - 1];
        button.value = monthValue;

        let classList =
          "px-1 py-2 text-xs rounded-lg transition duration-150 w-full";

        // Nonaktifkan bulan di masa depan
        const isFutureMonth =
          parseInt(selectedYear, 10) > currentYear ||
          (parseInt(selectedYear, 10) === currentYear && i > currentMonth);

        if (isFutureMonth) {
          classList += " bg-gray-100 text-gray-400 cursor-not-allowed";
          button.disabled = true;
        } else {
          classList += " text-gray-700 hover:bg-indigo-100";
        }

        // Tandai bulan yang sedang dipilih
        if (monthKey === activePeriod) {
          classList = classList.replace(
            "text-gray-700 hover:bg-indigo-100",
            ""
          );
          classList += " bg-indigo-500 text-white hover:bg-indigo-600";
        }

        button.className = classList;

        // Event Listener pada tombol bulan
        button.onclick = (e) => {
          if (isFutureMonth) return; // double check
          e.stopPropagation();

          // Ambil nilai periode baru, update tracker, render metrik, dan tutup popup
          const newPeriod = `${filterYear.value}-${e.target.value}`;
          loadAndRenderMetricsAndTransactions(uid, newPeriod);
          calendarPopup.classList.add("hidden");
        };

        monthGrid.appendChild(button);
      }
    }

    // 🔥 INISIALISASI UTAMA FILTER PERIODE DASHBOARD 🔥
    const today = new Date();
    const defaultYear = today.getFullYear();
    const defaultMonth = today.getMonth() + 1; // 1-based (integer)
    const defaultPeriod = `${defaultYear}-${String(defaultMonth).padStart(
      2,
      "0"
    )}`; // YYYY-MM
    currentPeriodTracker = defaultPeriod;

    // Cek ketersediaan semua elemen UI kalender kustom
    if (
      periodInput &&
      filterYear &&
      monthGrid &&
      filterWrapper &&
      prevYearBtn &&
      nextYearBtn &&
      calendarPopup &&
      selectedPeriodText
    ) {
      filterWrapper.classList.remove("hidden");

      // 1. Inisialisasi Tahun Dropdown
      initializeYearFilter(defaultYear);

      // 2. Render Grid Bulan awal
      renderMonthGrid(defaultYear, currentPeriodTracker);

      // 3. Pasang Event Listener untuk navigasi Tahun
      prevYearBtn.onclick = () => {
        const selectedYear = parseInt(filterYear.value, 10);
        const newYear = selectedYear - 1;
        if (newYear >= 2023) {
          filterYear.value = newYear;
          renderMonthGrid(newYear, currentPeriodTracker);
        }
      };

      nextYearBtn.onclick = () => {
        const selectedYear = parseInt(filterYear.value, 10);
        const currentMaxYear = new Date().getFullYear();
        const newYear = selectedYear + 1;
        if (newYear <= currentMaxYear) {
          filterYear.value = newYear;
          renderMonthGrid(newYear, currentPeriodTracker);
        }
      };

      // 4. Event Listener saat Tahun di Dropdown berubah
      filterYear.onchange = () => {
        const newYear = filterYear.value;
        renderMonthGrid(newYear, currentPeriodTracker);
      };

      // 5. Event Listener untuk Tampilkan/Sembunyikan Popup
      periodInput.onclick = (e) => {
        e.stopPropagation();
        calendarPopup.classList.toggle("hidden");

        // Set dropdown tahun di popup ke tahun periode aktif
        const selectedYear = currentPeriodTracker.substring(0, 4);
        filterYear.value = selectedYear;
        renderMonthGrid(selectedYear, currentPeriodTracker);
      };

      // 6. Tutup popup jika klik di luar
      document.addEventListener("click", (e) => {
        if (
          calendarPopup &&
          !calendarPopup.contains(e.target) &&
          !periodInput.contains(e.target)
        ) {
          calendarPopup.classList.add("hidden");
        }
      });

      console.log("UI Filter Kalender Kustom berhasil diinisialisasi.");
    } else {
      console.error(
        "Gagal menemukan elemen filter UI kalender. Pastikan struktur HTML sudah benar."
      );
    }

    // 🔥 Panggil fungsi rendering metrik dan transaksi untuk pertama kali (default) 🔥
    await loadAndRenderMetricsAndTransactions(uid, defaultPeriod);

    // --- D. RIWAYAT INVOICE (TIDAK BERUBAH) ---
    const invoiceHistoryContent = document.getElementById(
      "invoiceHistoryContent"
    );

    const invoicesSnapshot = await db
      .collection("invoices")
      .where("sellerId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    if (invoicesSnapshot.empty) {
      invoiceHistoryContent.innerHTML = `<p class="text-center text-gray-500 italic">Pengguna ini belum memiliki riwayat invoice sewa toko.</p>`;
    } else {
      let invoiceHTML = "";

      invoicesSnapshot.docs.forEach((doc) => {
        const invoice = { ...doc.data(), docId: doc.id };

        let statusColor;
        let amountColor;

        if (invoice.status === "Lunas") {
          statusColor = "bg-green-500";
          amountColor = "text-green-600";
        } else if (
          invoice.status === "Tertunda" ||
          invoice.status === "Kurang Bayar"
        ) {
          statusColor = "bg-yellow-500";
          amountColor = "text-red-600";
        } else if (invoice.status === "Pending") {
          statusColor = "bg-gray-500";
          amountColor = "text-gray-600";
        } else {
          statusColor = "bg-red-500";
          amountColor = "text-gray-600";
        }

        const priceDisplay = invoice.price || invoice.monthlyPrice || 0;

        invoiceHTML += `
                    <div class="p-3 border rounded-lg flex items-center justify-between text-sm bg-white hover:bg-gray-50 transition duration-100 min-w-[500px]">
                        
                        <div class="flex flex-col flex-1 min-w-0">
                            <p class="font-semibold text-gray-800 truncate">${
                              invoice.packageName || "Invoice Sewa Toko"
                            }</p>
                            <p class="text-xs text-gray-500">${
                              invoice.monthYear
                            } (${invoice.invoiceId || "N/A"})</p>
                        </div>

                        <div class="text-right flex items-center space-x-4 ml-4">
                            <span class="font-bold text-base ${amountColor}">${formatIDR(
          priceDisplay
        )}</span>
                            
                            <button onclick="openPublishInvoiceModal('${uid}', ${JSON.stringify(
          invoice
        ).replace(/"/g, "&quot;")})"
                                class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition">
                                Bayar/Edit
                            </button>
                            
                            <span class="px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor} min-w-[70px] text-center">${
          invoice.status
        }</span>
                        </div>

                    </div>
                `;
      });

      invoiceHistoryContent.innerHTML = invoiceHTML;
    }
  } catch (error) {
    // 🔥 Ganti penanganan error FATAL di sini dengan SweetAlert 🔥
    console.error("Error FATAL memuat detail pengguna:", error);

    // Tampilkan SweetAlert untuk Error FATAL
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Detail",
      html: `Terjadi kesalahan fatal saat memuat data penjual. Detail: <br> <strong>${error.message}</strong>`,
      confirmButtonText: "Tutup",
    });

    // Logika Error Handling di UI
    document.getElementById("detailShopName").textContent = "Error";
    document.getElementById(
      "profileContent"
    ).innerHTML = `<p class="col-span-3 text-red-500">Gagal memuat data: ${error.message}</p>`;

    if (dashboardContent) {
      dashboardContent.innerHTML = `<p class="col-span-3 text-red-500">Gagal memuat metrik.</p>`;
    }

    recentTransactionsContent.innerHTML = `<p class="text-center text-red-500">Gagal memuat riwayat transaksi.</p>`;
    document.getElementById(
      "invoiceHistoryContent"
    ).innerHTML = `<p class="text-center text-red-500">Gagal memuat riwayat invoice.</p>`;

    // 🔥 KONTROL SCROLL (Error Handle 2) 🔥
    document.body.style.overflow = "";
  }
}

function openAdminFeeModal(uid, currentFixedAmount) {
  console.log(
    `[MODAL ADMIN FEE] Membuka pengaturan biaya admin fixed fee untuk UID: ${uid}`
  );

  const modal = document.getElementById("adminFeeModal");
  const title = document.getElementById("adminFeeModalTitle");
  // 🔥 ID INPUT DIUBAH 🔥
  const inputFixedAmount = document.getElementById("adminFeeFixedAmountInput");
  const sellerUidInput = document.getElementById("adminFeeSellerUid");

  if (!modal) {
    console.error("Elemen adminFeeModal tidak ditemukan.");
    return;
  }

  // Mengisi data modal
  title.textContent = "Atur Biaya Admin Tetap";
  sellerUidInput.value = uid;

  // 🔥 Mengisi nilai saat ini (langsung dalam format angka) 🔥
  inputFixedAmount.value = currentFixedAmount || 0;

  // Tampilkan modal
  modal.classList.remove("hidden");
}

function closeAdminFeeModal() {
  const modal = document.getElementById("adminFeeModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

async function handleAdminFeeSubmission(event) {
  event.preventDefault();

  const uid = document.getElementById("adminFeeSellerUid").value;
  // 🔥 ID INPUT DIUBAH 🔥
  const fixedAmountInput = document.getElementById(
    "adminFeeFixedAmountInput"
  ).value;

  // Konversi input ke format integer (mata uang)
  const newFixedFee = parseInt(fixedAmountInput);

  if (isNaN(newFixedFee) || newFixedFee < 0) {
    Swal.fire("Error", "Biaya Admin harus berupa angka, minimal Rp0.", "error");
    return;
  }

  const formattedFee = formatIDR(newFixedFee); // Gunakan fungsi formatIDR Anda untuk konfirmasi

  Swal.fire({
    title: "Konfirmasi",
    text: `Anda yakin ingin mengatur Biaya Admin Tetap per transaksi untuk penjual ini menjadi ${formattedFee}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Atur!",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // 🔥 LOGIKA DATABASE UTAMA: Menyimpan nilai mata uang ke field baru 🔥
        await db.collection("sellers").doc(uid).update({
          adminFeeFixedAmount: newFixedFee,
          // Opsional: Hapus field persentase lama jika sudah tidak dipakai
          adminFeePercentage: firebase.firestore.FieldValue.delete(),
        });

        closeAdminFeeModal();

        // Refresh data detail pengguna
        viewUserDetails(uid);

        Swal.fire(
          "Berhasil!",
          "Biaya Admin Tetap berhasil diperbarui.",
          "success"
        );
      } catch (error) {
        console.error("Gagal menyimpan biaya admin fixed fee:", error);
        Swal.fire(
          "Error Database",
          `Gagal menyimpan data: ${error.message}`,
          "error"
        );
      }
    }
  });
}

// Tambahkan fungsi ini di script.js Anda, di samping fungsi Chart.js lainnya
function renderSellerSalesChart(data) {
  const ctx = document.getElementById("sellerSalesChart");

  // Hancurkan instance lama sebelum membuat yang baru (PENTING!)
  if (sellerSalesChartInstance) {
    sellerSalesChartInstance.destroy();
  }

  if (!ctx) {
    console.warn(
      "Canvas #sellerSalesChart tidak ditemukan saat mencoba render."
    );
    return;
  }

  const defaultData = {
    labels: ["N/A"],
    datasets: [
      { label: "Penjualan Bersih (Rp)", data: [0], backgroundColor: "#ccc" },
    ],
  };

  const finalData = data ? data : defaultData;

  sellerSalesChartInstance = new Chart(ctx, {
    type: "bar",
    data: finalData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Pendapatan (Rp)",
          },
          ticks: {
            callback: function (value) {
              return "Rp " + value.toLocaleString("id-ID");
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Periode (Bulan/Tahun)",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function closePublishInvoiceModal() {
  const modal = document.getElementById("publishInvoiceModal");

  if (modal) {
    modal.classList.add("hidden");

    // --- 1. Reset Formulir dan Data Tersembunyi ---
    const form = document.getElementById("invoiceForm"); // Menggunakan ID yang konsisten (invoiceForm)
    if (form) {
      form.reset();
    }

    // Kosongkan ID dokumen agar siap untuk "Terbitkan Baru" berikutnya
    const invoiceDocIdInput = document.getElementById("invoiceDocId");
    if (invoiceDocIdInput) {
      invoiceDocIdInput.value = "";
    }

    // Kosongkan URL Bukti Transfer yang tersembunyi
    const invoiceProofUrlInput = document.getElementById("invoiceProofUrl");
    if (invoiceProofUrlInput) {
      invoiceProofUrlInput.value = "";
    }

    // --- 2. Reset Judul dan Teks Tampilan ---
    // Judul utama (asumsi ini adalah h3 di dalam modal)
    const titleElement = modal.querySelector("h3");
    if (titleElement) {
      // Reset ke mode default "Terbitkan Invoice Baru"
      titleElement.textContent = "Terbitkan Invoice Baru: ";
    }

    // Bersihkan display Seller ID
    const invoiceSellerIdDisplay = document.getElementById("invoiceSellerId");
    if (invoiceSellerIdDisplay) {
      invoiceSellerIdDisplay.textContent = "";
    }

    // --- 3. Sembunyikan link bukti transfer (Jika ada) ---
    // Asumsi Anda memiliki elemen `proofLink` yang menampilkan link bukti
    // Karena elemen ini tidak ada di HTML yang kita sediakan, ini adalah asumsi.
    // Jika Anda menggunakan ID 'proofLink', pastikan ID tersebut ada di HTML Anda.
    const proofLinkElement = document.getElementById("proofLink");
    if (proofLinkElement) {
      proofLinkElement.classList.add("hidden");
    }
  }
}

async function handleInvoiceSubmission(event) {
  event.preventDefault();

  const uid = document.getElementById("invoiceSellerUid").value;
  const invoiceId = document.getElementById("invoiceIdToUpdate").value;
  const packageName = document.getElementById("packageName").value;

  // Mengambil data Bulanan
  const monthlyPrice = parseInt(document.getElementById("monthlyPrice").value);
  const monthYear = document.getElementById("monthYear").value;

  const status = document.getElementById("paymentStatus").value;
  const proofFile = document.getElementById("transferProof").files[0];

  let proofUrl = document.getElementById("proofLink").href.includes("http")
    ? document.getElementById("proofLink").href
    : "";

  try {
    // --- LOGIKA UPLOAD BUKTI TRANSFER (Asumsi Anda sudah punya) ---
    if (proofFile) {
      // Misalnya: proofUrl = await uploadFile(proofFile);
      // Anda harus memastikan fungsi uploadFile atau logika Firebase Storage sudah terimplementasi di sini
      console.log("Simulasi: Mengupload bukti transfer...");
    }

    // STRUKTUR DATA DIKEMBALIKAN KE SEWA BULANAN
    const invoiceData = {
      sellerId: uid,
      packageName: packageName,
      price: monthlyPrice, // Harga adalah harga bulanan
      monthYear: monthYear, // Periode tagihan
      status: status,
      proofUrl: proofUrl,
      // Field Komisi (feePerTransaction, transactionCount) dihapus
    };

    if (invoiceId) {
      // MODE EDIT / UPDATE PEMBAYARAN
      await db
        .collection("invoices")
        .doc(invoiceId)
        .update({
          ...invoiceData,
          paymentDate:
            status === "Lunas"
              ? firebase.firestore.FieldValue.serverTimestamp()
              : null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      alert(
        `Invoice ${invoiceId} berhasil diperbarui (Tagihan: ${formatIDR(
          monthlyPrice
        )}).`
      );
    } else {
      // MODE TERBITKAN BARU
      const newDocRef = await db.collection("invoices").add({
        ...invoiceData,
        invoiceId: `INV-${monthYear.replace("-", "")}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`, // ID Unik
        issueDate: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      alert(
        `Invoice baru (${
          newDocRef.id
        }) berhasil diterbitkan (Tagihan: ${formatIDR(monthlyPrice)}).`
      );
    }

    closePublishInvoiceModal();
    viewUserDetails(uid);
  } catch (error) {
    console.error("Gagal menyimpan invoice:", error);
    alert("Gagal menyimpan invoice: " + error.message);
  }
}

function openPublishInvoiceModal(sellerId, invoiceData = null) {
  const modal = document.getElementById("publishInvoiceModal");
  const form = document.getElementById("invoiceForm");

  // 🔥 Ambil referensi elemen yang RENTAN ERROR dan tambahkan Pengecekan (PENTING!) 🔥
  const titleElement = modal ? modal.querySelector("h3") : null;
  const invoiceSellerIdDisplay = document.getElementById("invoiceSellerId"); // Kemungkinan penyebab error

  // Ambil referensi elemen input lainnya
  const invoiceFixedFeeRateInput = document.getElementById(
    "invoiceFixedFeeRate"
  );
  const invoiceDocIdInput = document.getElementById("invoiceDocId");
  const invoiceSellerUidInput = document.getElementById("invoiceSellerUid");
  const invoicePackageNameInput = document.getElementById("invoicePackageName");
  const invoicePriceInput = document.getElementById("invoicePrice");
  const invoiceMonthYearInput = document.getElementById("invoiceMonthYear");
  const invoiceStatusSelect = document.getElementById("invoiceStatus");

  // Pastikan modal ada sebelum melanjutkan
  if (!modal) {
    console.error("Modal 'publishInvoiceModal' tidak ditemukan.");
    return;
  }

  // Reset Form (Jika form ditemukan)
  if (form) {
    form.reset();

    // Atur default/reset nilai tersembunyi
    if (invoiceDocIdInput) invoiceDocIdInput.value = "";
    if (invoiceSellerUidInput) invoiceSellerUidInput.value = sellerId;
  } else {
    console.error("Form 'invoiceForm' tidak ditemukan di dalam modal.");
    return;
  }

  // Mengatur tampilan ID Penjual (Ini adalah baris yang paling sering menyebabkan error)
  if (invoiceSellerIdDisplay) {
    invoiceSellerIdDisplay.textContent = `UID: ${sellerId}`;
  }

  if (invoiceData && invoiceData.docId) {
    // --- MODE EDIT INVOICE ---
    if (titleElement) {
      titleElement.textContent = `Edit & Catat Pembayaran Invoice: `;
    }

    if (invoiceDocIdInput) invoiceDocIdInput.value = invoiceData.docId;

    // Isi form dengan data yang ada (dengan pengecekan elemen)
    if (invoicePackageNameInput)
      invoicePackageNameInput.value = invoiceData.packageName || "";

    // 🔥 Mengisi Fixed Fee Rate baru 🔥
    if (invoiceFixedFeeRateInput)
      invoiceFixedFeeRateInput.value = invoiceData.fixedFeeRate || 0;

    // Mengisi Total Biaya Admin Bulan Ini (price)
    if (invoicePriceInput)
      invoicePriceInput.value =
        invoiceData.price || invoiceData.monthlyPrice || 0;

    if (invoiceMonthYearInput)
      invoiceMonthYearInput.value = invoiceData.monthYear || "";
    if (invoiceStatusSelect)
      invoiceStatusSelect.value = invoiceData.status || "Pending";
  } else {
    // --- MODE TERBITKAN INVOICE BARU ---
    if (titleElement) {
      titleElement.textContent = `Terbitkan Invoice Baru: `;
    }

    // Set nilai default untuk invoice baru (dengan pengecekan elemen)
    if (invoicePackageNameInput)
      invoicePackageNameInput.value = "Biaya Admin Per-Transaksi";
    if (invoicePriceInput) invoicePriceInput.value = ""; // Biarkan kosong
    if (invoiceFixedFeeRateInput) invoiceFixedFeeRateInput.value = "";

    // Set periode default ke bulan dan tahun saat ini
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    if (invoiceMonthYearInput) invoiceMonthYearInput.value = `${year}-${month}`;
    if (invoiceStatusSelect) invoiceStatusSelect.value = "Pending";
  }

  // Tampilkan Modal
  modal.classList.remove("hidden");

  // Logika submit form (gunakan fungsi submitInvoiceForm yang sudah kita buat)
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      submitInvoiceForm();
    };
  }
}

async function submitInvoiceForm() {
  const form = document.getElementById("invoiceForm");
  const invoiceDocId = document.getElementById("invoiceDocId").value;
  const isEditing = !!invoiceDocId; // True jika ada docId (mode edit)
  const submitButton = form.querySelector('button[type="submit"]');

  // 1. Ambil data dari form
  const formData = {
    sellerId: document.getElementById("invoiceSellerUid").value,
    packageName: document.getElementById("invoicePackageName").value,

    // 🔥 Kolom baru: Biaya Admin Per Transaksi (diubah menjadi Number)
    fixedFeeRate: Number(document.getElementById("invoiceFixedFeeRate").value),

    // 🔥 Kolom yang labelnya berubah: Total Biaya Admin Bulan Ini (diubah menjadi Number)
    price: Number(document.getElementById("invoicePrice").value),

    monthYear: document.getElementById("invoiceMonthYear").value,
    status: document.getElementById("invoiceStatus").value,
    proofUrl: document.getElementById("invoiceProofUrl").value || null, // URL bukti yang sudah ada
  };

  const proofFileInput = document.getElementById("invoiceProof");
  const file = proofFileInput.files[0];

  // Validasi dasar
  if (
    !formData.sellerId ||
    !formData.monthYear ||
    formData.price <= 0 ||
    formData.fixedFeeRate < 0
  ) {
    // 🔥 Ganti alert() dengan Swal.fire() (Warning)
    Swal.fire({
      icon: "warning",
      title: "Data Tidak Lengkap",
      text: "UID Penjual, Periode, dan Total Biaya Admin (Harus > 0) harus diisi dengan benar.",
      confirmButtonText: "Oke",
    });
    return;
  }

  // Tampilkan loading state
  submitButton.disabled = true;
  submitButton.textContent = isEditing ? "Menyimpan..." : "Menerbitkan...";

  try {
    let finalProofUrl = formData.proofUrl;

    // 2. Proses File Upload (Jika ada file baru)
    if (file) {
      console.log("Mengupload bukti pembayaran...");
      const storagePath = `invoice_proofs/${formData.sellerId}/${Date.now()}_${
        file.name
      }`;
      const fileRef = firebase.storage().ref(storagePath);

      const snapshot = await fileRef.put(file);
      finalProofUrl = await snapshot.ref.getDownloadURL();

      console.log("Upload selesai. URL:", finalProofUrl);
    }

    // 3. Persiapan Data Akhir untuk Firestore
    const dataToSave = {
      ...formData,
      proofUrl: finalProofUrl,
      // Tambahkan/Update timestamp
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Jika mode Terbitkan Baru, tambahkan createdAt
    if (!isEditing) {
      dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      dataToSave.invoiceId = `INV-${formData.monthYear.replace(
        "-",
        ""
      )}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    // 4. Menyimpan/Memperbarui di Firestore
    if (isEditing) {
      // Mode Update
      await db.collection("invoices").doc(invoiceDocId).update(dataToSave);
      console.log(`Invoice ID ${invoiceDocId} berhasil diupdate.`);

      // 🔥 Ganti alert() dengan Swal.fire() (Success)
      Swal.fire("Berhasil!", "Invoice berhasil diperbarui.", "success");
    } else {
      // Mode Create (Terbitkan Baru)
      await db.collection("invoices").add(dataToSave);
      console.log("Invoice baru berhasil diterbitkan.");

      // 🔥 Ganti alert() dengan Swal.fire() (Success)
      Swal.fire("Berhasil!", "Invoice baru berhasil diterbitkan.", "success");
    }

    // 5. Tutup Modal dan Refresh Tampilan
    closePublishInvoiceModal();

    // Setelah menyimpan, panggil ulang fungsi detail pengguna untuk me-refresh riwayat invoice
    const currentSellerId = document.getElementById("detailUid").textContent;
    if (currentSellerId) {
      viewUserDetails(currentSellerId);
    }
  } catch (error) {
    console.error("Error saat submit invoice:", error);

    // 🔥 Ganti alert() dengan Swal.fire() (Error)
    Swal.fire({
      icon: "error",
      title: "Gagal Menyimpan",
      html: `Gagal menyimpan invoice: <strong>${error.message}</strong>. Cek konsol untuk detail teknis.`,
      confirmButtonText: "Tutup",
    });
  } finally {
    // Hapus loading state
    submitButton.disabled = false;
    submitButton.textContent = isEditing
      ? "Simpan Invoice"
      : "Terbitkan Invoice";
  }
}

async function loadNotificationHistory(targetUid) {
  const historyContent = document.getElementById("historyContent");

  if (!historyContent || typeof db === "undefined") return;

  historyContent.innerHTML = `<p class="text-center text-gray-500 text-sm">Memuat riwayat...</p>`;

  try {
    // Query 6 dokumen terbaru: 5 untuk ditampilkan, 1 untuk menandai jika ada yang harus dihapus.
    console.log(
      `[HISTORY] Mulai query riwayat notifikasi untuk UID: ${targetUid}`
    );
    const snapshot = await db
      .collection("notifications")
      .where("recipientId", "==", targetUid)
      .orderBy("timestamp", "desc")
      .limit(6) // Query 6 dokumen untuk memastikan kita bisa mendeteksi yang ke-6 untuk dihapus.
      .get();

    const totalDocs = snapshot.size;

    if (totalDocs === 0) {
      historyContent.innerHTML = `<p class="text-center text-gray-500 text-sm italic">Belum ada pesan terkirim ke pengguna ini.</p>`;
      return;
    }

    let historyHTML = "";
    const docsToDelete = [];
    const limitDisplay = 5; // Batas Riwayat yang Ditampilkan dan Dipertahankan

    // 1. Proses Dokumen untuk Ditampilkan (5 Terbaru) dan Menentukan yang Akan Dihapus
    snapshot.docs.forEach((doc, index) => {
      if (index < limitDisplay) {
        // Tampilkan 5 dokumen terbaru
        const data = doc.data();

        const isRead = data.read === true;
        const statusClass = isRead
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700";
        const statusText = isRead ? "Dibaca" : "Belum Dibaca";

        const formattedTime =
          data.timestamp && data.timestamp.toDate
            ? new Date(data.timestamp.toDate()).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }) +
              ", " +
              new Date(data.timestamp.toDate()).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })
            : "Baru Saja";

        historyHTML += `
                    <div class="p-3 border rounded-lg shadow-sm ${
                      isRead ? "border-green-200" : "border-red-200"
                    }">
                        <div class="flex justify-between items-start mb-1">
                            <p class="font-medium text-gray-800 text-sm">${
                              data.title
                            }</p>
                            <span class="text-xs font-semibold py-0.5 px-2 rounded-full ${statusClass}">
                                ${statusText}
                            </span>
                        </div>
                        <p class="text-xs text-gray-600 mb-1">${data.message.substring(
                          0,
                          100
                        )}...</p>
                        <div class="text-right">
                            <span class="text-xs text-gray-400">
                                Terkirim: ${formattedTime}
                            </span>
                        </div>
                    </div>
                `;
      } else {
        // Tambahkan dokumen ke daftar hapus (index 5 dan seterusnya)
        docsToDelete.push(doc.ref);
      }
    });

    // 2. Perbarui Tampilan Riwayat
    historyContent.innerHTML = historyHTML;

    // 3. Eksekusi Penghapusan Batch (jika ada dokumen yang lebih tua)
    if (docsToDelete.length > 0) {
      console.log(
        `[HISTORY] Ditemukan ${docsToDelete.length} notifikasi yang melebihi batas (5). Melakukan penghapusan batch.`
      );

      const batch = db.batch();
      docsToDelete.forEach((docRef) => {
        batch.delete(docRef);
      });

      await batch.commit();
      console.log(
        `[HISTORY] Berhasil menghapus ${docsToDelete.length} notifikasi lama.`
      );
    } else {
      console.log(
        "[HISTORY] Semua notifikasi sesuai batas (<=5). Tidak ada penghapusan dilakukan."
      );
    }
  } catch (error) {
    console.error("Gagal memuat atau membersihkan riwayat notifikasi: ", error);
    historyContent.innerHTML = `<p class="text-center text-red-500 text-sm">Error memuat riwayat.</p>`;
  }
}

function setupRealTimeNotificationsListener() {
  if (!currentUser || typeof db === "undefined") {
    console.warn(
      "[NOTIF-RT] Listener notifikasi dihentikan: User atau DB undefined."
    );
    return () => {}; // Kembalikan fungsi kosong
  }

  const recipientId = currentUser.uid;
  const infoWrapper = document.getElementById("user-info-banner-wrapper");

  if (!infoWrapper) {
    console.error(
      "[NOTIF-RT] Elemen DOM 'user-info-banner-wrapper' tidak ditemukan!"
    );
    return () => {};
  }

  console.log(
    `[NOTIF-RT] Memasang Realtime Listener untuk notifikasi user: ${recipientId}`
  );

  // Inisialisasi wadah untuk menyimpan HTML notifikasi
  let notificationHtml = "";

  // 🔥 Gunakan onSnapshot untuk Realtime 🔥
  const unsubscribe = db
    .collection("notifications")
    .where("recipientId", "==", recipientId)
    .where("read", "==", false)
    .orderBy("timestamp", "desc")
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          // Jika tidak ada notifikasi yang belum dibaca
          infoWrapper.innerHTML = "";
          infoWrapper.classList.add("hidden");
          console.log(
            "[NOTIF-RT] Tidak ada notifikasi baru (atau semua sudah dibaca)."
          );
          return;
        }

        // Atur kembali HTML setiap kali ada perubahan
        notificationHtml = "";

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id;

          const formattedTime =
            data.timestamp && data.timestamp.toDate
              ? new Date(data.timestamp.toDate()).toLocaleString()
              : "Baru Saja";

          notificationHtml += `
                    <div id="info-card-${docId}" class="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 mb-4 shadow-lg rounded-lg relative">
                        <h3 class="font-bold text-lg mb-1 flex justify-between items-center">
                            ${data.title}
                            <span class="text-xs text-gray-500">${formattedTime}</span>
                        </h3>
                        <p class="text-sm">${data.message}</p>
                        <div class="mt-2 text-right">
                            <button 
                                onclick="markNotificationAsRead('${docId}')" 
                                class="text-xs text-white bg-red-600 hover:bg-red-700 font-medium py-1 px-3 rounded-md transition duration-300 shadow-md"
                            >
                                Tandai Sudah Dibaca
                            </button>
                        </div>
                    </div>
                `;
        });

        // Perbarui DOM
        infoWrapper.innerHTML = notificationHtml;
        infoWrapper.classList.remove("hidden");
        console.log(
          `[NOTIF-RT] Listener: Berhasil me-render ${snapshot.size} notifikasi baru.`
        );
      },
      (error) => {
        console.error("[NOTIF-RT] Error Realtime Listener Notifikasi:", error);
        infoWrapper.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error memuat notifikasi. Periksa koneksi atau Izin.</div>`;
        infoWrapper.classList.remove("hidden");
      }
    );

  return unsubscribe;
}

function openSendNotificationModal(uid, email) {
  const modal = document.getElementById("notificationModal");

  // Set nilai di form modal
  document.getElementById("targetUid").value = uid;
  document.getElementById("targetEmail").value = email;
  document.getElementById("displayEmail").value = email; // Tampilkan email di modal
  document.getElementById("notificationTitle").value = "";
  document.getElementById("notificationMessage").value = "";

  // 🔥 Panggil fungsi pemuatan riwayat di sini 🔥
  loadNotificationHistory(uid);

  modal.classList.remove("hidden");
}

// Global Function untuk Menutup Modal
function closeModal() {
  document.getElementById("notificationModal").classList.add("hidden");
}

function promptSendInfo(targetUid, targetShopName) {
  Swal.fire({
    title: `Kirim Informasi ke ${targetShopName}`,
    html: `
            <input id="swal-title" class="swal2-input" placeholder="Judul Info (Max 50 karakter)" maxlength="50">
            <textarea id="swal-text" class="swal2-textarea" placeholder="Isi Pesan (Max 200 karakter)" maxlength="200" style="min-height: 100px;"></textarea>
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Kirim",
    cancelButtonText: "Batal",
    preConfirm: () => {
      const title = document.getElementById("swal-title").value.trim();
      const text = document.getElementById("swal-text").value.trim();

      if (!title || !text) {
        Swal.showValidationMessage(`Judul dan Isi pesan harus diisi.`);
        return false;
      }

      return { title: title, text: text };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      sendNotificationToUser(targetUid, result.value.title, result.value.text);
    }
  });
}
async function sendNotificationToUser(uid, title, message, targetEmail) {
  if (typeof db === "undefined" || !currentUser) {
    Swal.fire(
      "Error",
      "Sistem tidak dapat mengirim notifikasi. Harap login kembali.",
      "error"
    );
    return;
  }

  Swal.fire({
    title: "Mengirim...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const docRef = await db.collection("notifications").add({
      recipientId: uid,
      title: title,
      message: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false,
      sender: currentUser.email || "Admin",
    });

    // LOGGING BERHASIL
    console.log(
      `[ADMIN ACTION] Notifikasi berhasil dikirim ke UID: ${uid}. Doc ID: ${docRef.id}`
    );

    // 🔥 PERUBAHAN DI SINI: Menggunakan targetEmail di pesan sukses
    Swal.fire(
      "Terkirim!",
      `Informasi berhasil dikirim ke **${targetEmail}** (ID: ${uid}).`,
      "success"
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi: ", error);
    Swal.fire(
      "Error Pengiriman",
      "Gagal menyimpan data ke Firestore.",
      "error"
    );
  }
}

// Deklarasi global untuk menampung notifikasi user
// let cachedUserNotifications = []; // Anda mungkin ingin menggunakan cache di sini juga
async function loadUserNotifications() {
  if (!currentUser || typeof db === "undefined") return;

  const recipientId = currentUser.uid; // UID yang seharusnya: "fdtHEiesI3QvmEuqJ6TXKup8GB03"
  const infoWrapper = document.getElementById("user-info-banner-wrapper");

  if (!infoWrapper) {
    console.error(
      "[NOTIF-RX] Elemen DOM 'user-info-banner-wrapper' tidak ditemukan!"
    );
    return;
  }

  infoWrapper.innerHTML = "";

  // 🔥 LOG KRITIS: Cek UID yang digunakan
  console.log(
    `[NOTIF-RX] UID Penerima (currentUser.uid) yang digunakan: ${recipientId}`
  );

  try {
    const snapshot = await db
      .collection("notifications")
      .where("recipientId", "==", recipientId)
      .where("read", "==", false)
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) {
      infoWrapper.classList.add("hidden");
      console.log(
        "[NOTIF-RX] Query berhasil dieksekusi, tetapi tidak ada notifikasi baru yang ditemukan."
      );
      return;
    }

    infoWrapper.classList.remove("hidden");
    let htmlContent = "";

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;

      const formattedTime =
        data.timestamp && data.timestamp.toDate
          ? new Date(data.timestamp.toDate()).toLocaleString()
          : "Baru Saja";

      htmlContent += `
                <div id="info-card-${docId}" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 shadow-lg rounded-lg relative">
                    <h3 class="font-bold text-lg mb-1 flex justify-between items-center">
                        ${data.title}
                        <span class="text-xs text-gray-500">${formattedTime}</span>
                    </h3>
                    <p class="text-sm">${data.message}</p>
                    <div class="mt-2 text-right">
                        <button 
                            onclick="markNotificationAsRead('${docId}')" 
                            class="text-xs text-yellow-700 hover:text-yellow-900 font-medium py-1 px-3 bg-yellow-200 rounded-md transition duration-300"
                        >
                            Tandai Sudah Dibaca
                        </button>
                    </div>
                </div>
            `;
    });

    infoWrapper.innerHTML = htmlContent;
    console.log(`[NOTIF-RX] Berhasil me-render ${snapshot.size} notifikasi.`);
  } catch (error) {
    // 🔥 LOG KRITIS: Jika ada error izin (kemungkinan rule belum sempurna)
    console.error(
      "[NOTIF-RX] GAGAL MEMUAT notifikasi user. Periksa Security Rules!",
      error
    );
    // Tampilkan pesan error di UI untuk debugging cepat
    if (infoWrapper)
      infoWrapper.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error saat memuat notifikasi: ${error.message}</div>`;
  }
}

async function markNotificationAsRead(docId) {
  if (typeof db === "undefined") return;

  try {
    await db.collection("notifications").doc(docId).update({
      read: true,
    });

    const card = document.getElementById(`info-card-${docId}`);
    if (card) {
      card.remove();
    }

    // Cek apakah semua kartu sudah dihapus untuk menyembunyikan wrapper
    const infoWrapper = document.getElementById("user-info-banner-wrapper");
    if (infoWrapper && infoWrapper.children.length === 0) {
      infoWrapper.classList.add("hidden");
    }

    await loadUserNotifications(); // Muat ulang untuk jaga-jaga
  } catch (error) {
    console.error("Gagal menandai notifikasi dibaca:", error);
    Swal.fire("Error", "Gagal memperbarui status notifikasi.", "error");
  }
}

function toggleAdminView() {
  // 1. Cek User Login
  if (!currentUser) return;

  // 2. 🔥 PERBAIKAN: Gunakan nama variabel yang benar (productListWrapperElement)
  //    dan pastikan semua elemen ditemukan sebelum melanjutkan.
  //    Asumsi: productListWrapper yang ada di log error Anda merujuk ke productListWrapperElement.
  if (!adminView || !productListWrapperElement || !adminBtn) {
    console.error(
      "Error DOM: Salah satu elemen admin/produk tidak ditemukan (adminView, productListWrapperElement, atau adminBtn)."
    );
    // Tambahkan log detail untuk melacak variabel mana yang null
    console.error(
      "DEBUG Check: adminView:",
      adminView,
      "productListWrapperElement:",
      productListWrapperElement,
      "adminBtn:",
      adminBtn
    );
    return;
  }

  getSellerData(currentUser.uid)
    .then((sellerData) => {
      // 3. Cek Role Admin
      if (sellerData.role !== "admin") return;

      // 4. Logika Toggle View
      if (adminView.classList.contains("hidden")) {
        // --- MASUK KE TAMPILAN ADMIN ---
        adminView.classList.remove("hidden");
        productListWrapperElement.classList.add("hidden"); // 🔥 DIGANTI

        // Sembunyikan Management View jika terbuka
        if (managementView && !managementView.classList.contains("hidden")) {
          managementView.classList.add("hidden");
          if (manageBtn) {
            // Mengembalikan ikon manageBtn ke default (Lihat Produk)
            manageBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
                    </svg>
                    Management
                `;
          }
        }

        // Ubah Teks Tombol Admin menjadi 'Lihat Produk'
        adminBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 4v1h10V7H5zm0 3v1h10v-1H5zm0 3v1h10v-1H5z" clip-rule="evenodd" />
                </svg>
                Lihat Produk
            `;

        loadCustomerList(); // Asumsi fungsi ini memuat data pelanggan
      } else {
        // --- KELUAR DARI TAMPILAN ADMIN (KEMBALI KE PRODUK) ---
        adminView.classList.add("hidden");
        productListWrapperElement.classList.remove("hidden"); // 🔥 DIGANTI

        // Ubah Teks Tombol Admin kembali ke 'Admin (Pelanggan)'
        adminBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Admin (Pelanggan)
            `;
      }
    })
    .catch((error) => {
      console.error("Error checking role for Admin View:", error);
    });
}
async function loadCustomerList() {
  // Asumsi: customerListTableBody sudah dideklarasikan global
  if (!currentUser || !customerListTableBody) return;

  const sellerData = await getSellerData(currentUser.uid);
  if (sellerData.role !== "admin") {
    customerListTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Akses Ditolak. Hanya Admin yang dapat melihat daftar ini.</td></tr>`;
    return;
  }

  customerListTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Memuat data pelanggan...</td></tr>`;

  try {
    const snapshot = await db.collection("sellers").get();

    if (snapshot.empty) {
      customerListTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Belum ada user yang terdaftar.</td></tr>`;
      return;
    }

    let rowCounter = 1;
    const rows = snapshot.docs.map((doc) => {
      const uid = doc.id;
      const data = doc.data();
      const shopName = data.shopName || "-";
      const email = data.email || "Email Tidak Diketahui"; // 🔥 Ambil Email

      const userRole = data.role || "biasa";
      const phone = data.phone || "-";
      const address = data.address || "-";

      const lastLogin = data.lastLogin
        ? new Date(data.lastLogin.toDate()).toLocaleString()
        : "-";

      const isDakata = userRole === "admin";
      const isSelf = currentUser.uid === uid;

      // --- LOGIKA TOMBOL AKSI BARU ---
      let actionButtonsHTML = "";

      // Sanitasi email dan shopName untuk penggunaan di atribut onclick
      const safeEmail = email.replace(/'/g, "\\'");
      const safeShopName = shopName.replace(/'/g, "\\'");

      if (userRole === "biasa" && !isSelf) {
        // Tombol untuk role 'biasa' (penjual) yang bukan diri sendiri
        actionButtonsHTML += `
              <button 
                  data-uid="${uid}" 
                  data-email="${email}"
                  onclick="openSendNotificationModal('${uid}', '${safeEmail}')" 
                  class="action-btn text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md text-xs mr-1 mb-1 shadow-sm"
              >
                  Kirim Info
              </button>
              <button 
                  data-uid="${uid}" 
                  onclick="viewUserDetails('${uid}')"
                  class="action-btn text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md text-xs mr-1 mb-1 shadow-sm"
              >
                  Detail
              </button>
          `;
        // Tombol Hapus untuk user biasa
        actionButtonsHTML += `
              <button data-uid="${uid}" data-email="${email}" class="delete-user-btn text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md text-xs mb-1 shadow-sm">
                  Hapus
              </button>
          `;
      } else if (isDakata || isSelf) {
        // Jika Admin atau Diri Sendiri
        actionButtonsHTML =
          '<span class="text-gray-400 text-xs italic">Aksi Terbatas</span>';
      }

      const rowClass = isDakata ? "bg-blue-50/50 font-bold" : "";

      return `
                <tr class="${rowClass}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rowCounter++}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shopName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${userRole}</td>
                    
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${phone}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${address}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${lastLogin}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex flex-wrap justify-end">
                            ${actionButtonsHTML}
                        </div>
                    </td>
                </tr>
            `;
    });

    customerListTableBody.innerHTML = rows.join("");

    // Re-attach listener untuk tombol Hapus (jika ada)
    document.querySelectorAll(".delete-user-btn").forEach((button) => {
      button.addEventListener("click", handleDeleteUser);
    });
  } catch (error) {
    console.error("Error loading customer list:", error);
    customerListTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Gagal memuat daftar pelanggan.</td></tr>`;
  }
}

async function handleDeleteUser(e) {
  e.stopPropagation();

  const deleteBtn = e.currentTarget;
  const uidToDelete = deleteBtn.dataset.uid;
  const emailToDelete = deleteBtn.dataset.email;

  if (!currentUser || !uidToDelete) return;

  const result = await Swal.fire({
    title: `Hapus User ${emailToDelete}?`,
    html: `
            Anda yakin ingin menghapus user ini? Tindakan ini tidak bisa dibatalkan!
            <ul class="text-left mt-3 list-disc ml-5 space-y-1 text-sm text-gray-600">
                <li>Data Toko di Firestore akan dihapus.</li>
                <li>Semua produk user ini akan dihapus.</li>
                <li class="font-bold text-red-600">⚠️ User record di Authentication TIDAK akan terhapus oleh sistem ini.</li>
            </ul>
        `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Hapus Data Toko!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    const originalHtml = deleteBtn.innerHTML;
    setLoading(deleteBtn, true, originalHtml, "Menghapus...");

    try {
      await db.collection("sellers").doc(uidToDelete).delete();

      const productsSnapshot = await db
        .collection("products")
        .where("ownerId", "==", uidToDelete)
        .get();
      const batch = db.batch();
      productsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      Swal.fire({
        title: "Data Dihapus!",
        html: `
                    Data Toko dan ${productsSnapshot.size} produk milik <b>${emailToDelete}</b> berhasil dihapus dari database.
                    <br><br>
                    <span class="font-bold text-red-600">⚠️ LANGKAH AKHIR WAJIB:</span>
                    <p class="text-sm mt-1">Hapus user <b>${emailToDelete}</b> dari **Firebase Authentication Console** Anda secara manual.</p>
                `,
        icon: "success",
      });

      loadCustomerList();
    } catch (error) {
      setLoading(deleteBtn, false, originalHtml);
      Swal.fire(
        "Gagal!",
        "Gagal menghapus data. Periksa aturan Firebase atau koneksi.",
        "error"
      );
      console.error("Error deleting user data: ", error);
    }
  }
}
// -----------------------------------------------------------------
// BAGIAN 7: FUNGSI PENGATURAN PROFIL & AKUN (Disesuaikan)
// -----------------------------------------------------------------

function togglePasswordVisibility(inputElement, openIcon, closedIcon) {
  const isPassword = inputElement.getAttribute("type") === "password";
  inputElement.setAttribute("type", isPassword ? "text" : "password");

  if (isPassword) {
    openIcon.classList.remove("hidden");
    closedIcon.classList.add("hidden");
  } else {
    openIcon.classList.add("hidden");
    closedIcon.classList.remove("hidden");
  }
}

function handleToggleAuthPasswordClick() {
  togglePasswordVisibility(
    authPasswordInput,
    authEyeIconOpen,
    authEyeIconClosed
  );
}

function handleToggleProfilePasswordClick() {
  togglePasswordVisibility(newPasswordInput, eyeIconOpen, eyeIconClosed);
}

// Fungsi Handler untuk Tombol 'Masukkan Keranjang' di Detail View
// Fungsi Handler untuk Tombol 'Masukkan Keranjang' di Detail View
function handleAddToCartFromDetail() {
  const quantity = parseInt(productQuantityInput.value) || 1;

  if (currentProductDetail && currentProductDetail.ownerId && quantity > 0) {
    // Memanggil addToCart TANPA argumen sellerPhone. addToCart akan mengambilnya sendiri.
    addToCart(currentProductDetail, quantity);
  } else {
    Swal.fire(
      "Peringatan",
      "Data produk tidak lengkap atau jumlah tidak valid.",
      "warning"
    );
  }
}

function handleCartClick() {
  // 1. Sembunyikan semua view utama lainnya
  if (productDetailView) productDetailView.classList.add("hidden");
  if (managementView) managementView.classList.add("hidden");
  if (adminView) adminView.classList.add("hidden");
  if (orderDetailView) orderDetailView.classList.add("hidden");

  // Sembunyikan Daftar Produk dan Banner
  if (productListWrapperElement)
    productListWrapperElement.classList.add("hidden");
  if (productListView) productListView.classList.add("hidden");
  if (mainBanner) mainBanner.classList.add("hidden");

  // 2. Tampilkan View Keranjang
  if (cartView) {
    cartView.classList.remove("hidden");
    renderCartItems(); // PANGGIL FUNGSI RENDER ITEM KERANJANG DI SINI
    window.scrollTo(0, 0); // Gulir ke atas
  } else {
    Swal.fire(
      "Error",
      "Tampilan Keranjang (cart-view) tidak ditemukan.",
      "error"
    );
  }
}

// =============================================================
// FUNGSIONALITAS PENGAMBILAN DETAIL PRODUK LENGKAP DARI FIRESTORE
// =============================================================
async function fetchProductDetails(productId) {
  if (!db) {
    console.error("Firebase database instance (db) tidak tersedia.");
    return null;
  }

  try {
    const productDoc = await db.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      console.warn(
        `Produk dengan ID ${productId} tidak ditemukan di Firestore.`
      );
      return null;
    }

    const product = productDoc.data();

    // --- LOGIKA HARGA (SESUAI DENGAN loadProductDetails) ---
    // 'harga' adalah Harga Asli
    const hargaAsli = Number(product.harga) || 0;

    // Cek hargaDiskon: harus berupa angka, > 0, dan < hargaAsli
    const hargaDiskon =
      product.hargaDiskon !== undefined &&
      product.hargaDiskon !== null &&
      Number(product.hargaDiskon) > 0 &&
      Number(product.hargaDiskon) < hargaAsli
        ? Number(product.hargaDiskon)
        : null;

    const finalPrice = hargaDiskon !== null ? hargaDiskon : hargaAsli;
    // -----------------------------------------------------

    // Kembalikan objek produk yang sudah memiliki format harga lengkap
    return {
      ...product,
      id: productDoc.id,
      price: finalPrice, // Harga Jual (yang dibayarkan)
      hargaAsli: hargaAsli, // HARGA ASLI (Krusial untuk tampilan keranjang dicoret)
      hargaDiskon: hargaDiskon,
      // Properti lain sudah otomatis dari productDoc.data()
    };
  } catch (error) {
    console.error(
      `Gagal mengambil detail produk ID ${productId} dari Firestore:`,
      error
    );
    return null;
  }
}
// =============================================================
function loadOrderSummaryFromCart(cartItems) {
  // 1. Ambil elemen DOM
  const summaryListWrapper = document.getElementById("order-product-summary");
  const totalElement = document.getElementById("order-total-price");
  const backButton = document.getElementById("back-to-detail-btn");

  // Elemen Single-Item yang HARUS disembunyikan di mode Multi-Item
  const orderOriginalPriceElement = document.getElementById(
    "order-original-price"
  );
  const orderDiscountedPriceElement = document.getElementById(
    "order-discounted-price"
  );
  const orderItemPriceContainer = document.getElementById(
    "order-item-price-container"
  );

  // 🔥 AMBIL ELEMEN HR (SEPARATOR) 🔥
  const orderSummarySeparator = document.getElementById(
    "order-summary-separator"
  );

  if (
    !summaryListWrapper ||
    !totalElement ||
    !backButton ||
    !orderOriginalPriceElement
  ) {
    console.error("Salah satu elemen DOM ringkasan pesanan tidak ditemukan.");
    Swal.fire(
      "Error",
      "Komponen tampilan checkout tidak lengkap. Cek ID elemen HTML.",
      "error"
    );
    return;
  }

  // Format harga
  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // KRUSIAL 1: Sembunyikan elemen harga per unit dari Single-Item Checkout
  if (orderOriginalPriceElement)
    orderOriginalPriceElement.classList.add("hidden");
  if (orderDiscountedPriceElement)
    orderDiscountedPriceElement.classList.add("hidden");
  if (orderItemPriceContainer) orderItemPriceContainer.classList.add("hidden");

  // 🔥🔥🔥 KRUSIAL: SEMBUNYIKAN GARIS HR 🔥🔥🔥
  if (orderSummarySeparator) orderSummarySeparator.classList.add("hidden");

  // 2. Inisialisasi variabel total
  let grandTotal = 0;

  // c. Buat wadah UL baru untuk daftar item
  const ulList = document.createElement("ul");
  ulList.className = "space-y-3 mt-2";

  // --- 3. RENDER DAFTAR PRODUK ---

  cartItems.forEach((item) => {
    // Ambil harga dari item keranjang yang sudah lengkap
    const itemPrice = Number(item.price) || 0; // Harga Jual Final
    const hargaAsli = Number(item.hargaAsli) || itemPrice; // Harga Asli
    const quantity = item.quantity || 1;

    // Logika diskon: Harga Asli harus lebih besar dari Harga Jual
    const isDiscounted = hargaAsli > itemPrice;

    const itemTotal = itemPrice * quantity; // Total harga yang dibayarkan untuk item ini
    grandTotal += itemTotal;

    const itemElement = document.createElement("li");
    itemElement.className =
      "flex justify-between items-center text-sm border-b border-red-200/50 pb-2";

    // KRUSIAL 2: STRUKTUR HTML BARU UNTUK DISPLAY HARGA LENGKAP PER ITEM
    let priceDetailsHTML = "";

    if (isDiscounted) {
      // Tampilkan Harga Asli Dicoret dan Harga Diskon
      priceDetailsHTML = `
            <p class="text-xs text-gray-500 line-through">
                ${quantity} x ${formatIDR(hargaAsli)} (Normal)
            </p>
            <p class="text-sm text-red-700 font-medium">
                ${quantity} x ${formatIDR(itemPrice)} (Diskon)
            </p>
        `;
    } else {
      // Hanya tampilkan Harga Normal/Bayar jika tidak ada diskon
      priceDetailsHTML = `
            <p class="text-sm text-gray-700 font-medium">
                ${quantity} x ${formatIDR(itemPrice)}
            </p>
        `;
    }

    itemElement.innerHTML = `
            <div class="flex flex-col flex-grow">
                <p class="font-semibold text-gray-800 line-clamp-1">${
                  item.nama
                }</p>
                ${priceDetailsHTML}
            </div>
            <span class="font-bold text-red-700 whitespace-nowrap ml-4">
                ${formatIDR(itemTotal)}
            </span>
        `;
    ulList.appendChild(itemElement);
  });

  // 4. Ganti isi order-product-summary dengan daftar multi-item
  summaryListWrapper.innerHTML = "";
  summaryListWrapper.appendChild(ulList);

  // 5. Perbarui Total Harga (Grand Total)
  const finalTotal = grandTotal;
  totalElement.textContent = formatIDR(finalTotal);

  console.log(
    `Checkout multi-item berhasil dimuat. ${
      cartItems.length
    } produk. Total: ${formatIDR(grandTotal)}`
  );

  setupBackToButtonListener();
}

function handleBackToCartClick() {
  // 1. Sembunyikan Detail Pesanan
  if (orderDetailView) {
    orderDetailView.classList.add("hidden");
  }

  // 2. Tampilkan Tampilan Keranjang
  if (cartView) {
    cartView.classList.remove("hidden");
    renderCartItems(); // Render ulang
  }

  window.scrollTo(0, 0);
}

function setupBackToButtonListener() {
  const backButton = document.getElementById("back-to-detail-btn");
  if (!backButton) return;

  // 1. Hapus listener lama dengan kloning/replace (cara paling efektif)
  const newBackButton = backButton.cloneNode(true);
  backButton.parentNode.replaceChild(newBackButton, backButton);

  const finalBackButton = newBackButton;

  // 2. Tentukan teks dan handler
  let newText = "";
  let newHandler = null;

  if (isMultiItemCheckout) {
    // Mode Multi-Item: Kembali ke Keranjang
    newText = "Kembali ke Keranjang";
    newHandler = handleBackToCartClick;
  } else {
    // Mode Single Item: Kembali ke Detail Produk
    newText = "<  Kembali ke Detail Produk";

    if (typeof handleBackToDetailClick === "function") {
      newHandler = handleBackToDetailClick;
    } else {
      newHandler = () => {
        if (productListView) productListView.classList.remove("hidden");
        if (orderDetailView) orderDetailView.classList.add("hidden");
        if (mainBanner) mainBanner.classList.remove("hidden");
      };
      console.warn(
        "Peringatan: handleBackToDetailClick tidak terdefinisi. Menggunakan fallback."
      );
    }
  }

  // 3. Atur Teks (Mempertahankan SVG)
  const svgMatch = finalBackButton.innerHTML.match(/<svg.*?>.*?<\/svg>/i);
  const svgPart = svgMatch ? svgMatch[0] : "";

  if (svgPart) {
    finalBackButton.innerHTML = svgPart + " " + newText;
  } else {
    finalBackButton.textContent = newText;
  }

  // 4. Pasang Handler
  if (typeof newHandler === "function") {
    finalBackButton.addEventListener("click", newHandler);
  } else {
    console.error(
      `Handler untuk mode ${
        isMultiItemCheckout ? "Keranjang" : "Single Item"
      } tidak valid.`
    );
    finalBackButton.addEventListener("click", () => {
      Swal.fire("Error", "Fungsi kembali tidak ditemukan.", "error");
    });
  }
}

/**
 * Menangani klik pada tombol "Lanjutkan ke Checkout".
 * Mengalihkan ke tampilan Order Detail.
 */
function handleCheckoutClick() {
  if (cart.length === 0) {
    Swal.fire(
      "Peringatan",
      "Keranjang Anda kosong, tidak bisa melanjutkan ke checkout.",
      "warning"
    );
    return;
  }

  if (!orderDetailView || typeof loadOrderSummaryFromCart !== "function") {
    Swal.fire(
      "Error",
      "Fungsi checkout atau tampilan detail pesanan belum siap.",
      "error"
    );
    return;
  }

  // 1. Sembunyikan semua view yang aktif (termasuk cartView)
  if (productListView) productListView.classList.add("hidden");
  if (productDetailView) productDetailView.classList.add("hidden");
  if (managementView) managementView.classList.add("hidden");
  if (adminView) adminView.classList.add("hidden");
  if (productListWrapperElement)
    productListWrapperElement.classList.add("hidden");
  if (mainBanner) mainBanner.classList.add("hidden");
  if (cartView) cartView.classList.add("hidden"); // Sembunyikan keranjang

  // 🔥 SET FLAG UNTUK MULTI-ITEM CHECKOUT
  isMultiItemCheckout = true;

  // 2. Tampilkan Tampilan Detail Pesanan
  orderDetailView.classList.remove("hidden");

  // 3. Muat data pesanan dari item keranjang
  loadOrderSummaryFromCart(cart);

  window.scrollTo(0, 0);
}

function loadCartFromLocalStorage() {
  const storedCart = localStorage.getItem("userCart");
  // Selalu kembalikan array, baik yang sudah terisi atau array kosong
  return storedCart ? JSON.parse(storedCart) : [];
}

function loadCartFromLocalStorage() {
  const storedCart = localStorage.getItem("userCart");
  // Selalu kembalikan array (kosong jika tidak ada data)
  return storedCart ? JSON.parse(storedCart) : [];
}

function saveCartToLocalStorage() {
  // Menyimpan array 'cart' global ke Local Storage
  localStorage.setItem("userCart", JSON.stringify(cart));
}

/**
 * Memperbarui badge jumlah item di header
 */
function updateCartCount() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
    if (totalItems > 0) {
      cartCount.classList.remove("hidden");
    } else {
      cartCount.classList.add("hidden");
    }
  }
}
/**
 * Menambahkan atau memperbarui item di keranjang
 * @param {object} product - Detail produk (id, nama, harga, shopName, shopPhone, dll.)
 * @param {number} quantity - Jumlah item yang ditambahkan
 */

async function addToCart(product, quantity = 1) {
  if (!product || !product.id || !product.ownerId) {
    Swal.fire("Error", "Data produk atau pemilik tidak valid.", "error");
    return;
  }

  // Ambil harga dari properti yang benar. Diasumsikan `product.price` adalah harga jual (diskon atau asli).
  const productPrice = Number(product.price) || 0;

  // Ambil harga asli dan diskon dari objek produk yang masuk
  // 🔥🔥🔥 KUNCI PERBAIKAN: MEMASTIKAN HARGA ASLI DAN DISKON DITANGKAP 🔥🔥🔥
  const hargaAsli = product.hargaAsli; // Nilai ini datang dari fetchProductDetails (misal: 50000)
  const hargaDiskon = product.hargaDiskon; // Nilai ini datang dari fetchProductDetails (misal: 30000 atau null)
  // 🔥🔥🔥 AKHIR KUNCI PERBAIKAN 🔥🔥🔥

  const productImageURL =
    product.image || product.imageUrl || "https://via.placeholder.com/64";

  // --- 1. TENTUKAN SHOP NAME DAN PHONE (ASYNC) ---
  let finalShopName = product.shopName || "Toko";
  let finalSellerPhone = null;

  try {
    // Asumsi getSellerData(ownerId) mengembalikan { phone, shopName, ... }
    const sellerData = await getSellerData(product.ownerId);

    finalSellerPhone = sellerData.phone || null;

    // Update finalShopName dari data penjual (lebih akurat)
    if (sellerData.shopName) {
      finalShopName = sellerData.shopName;
    }
  } catch (error) {
    console.error(
      "Gagal mengambil data penjual saat menambahkan ke keranjang:",
      error
    );
    Swal.fire(
      "Error",
      "Gagal mendapatkan kontak penjual untuk item ini. Coba lagi.",
      "error"
    );
    return;
  }

  if (!finalSellerPhone) {
    Swal.fire(
      "Peringatan",
      "Nomor kontak penjual hilang. Tidak dapat menambahkan ke keranjang.",
      "warning"
    );
    return;
  }

  // --- 2. LOGIKA KERANJANG ---
  console.log(`[ADDCART: Awal] Cart di memori sebelum update: ${cart.length}`); // DEBUG A

  // Asumsi 'cart' adalah array global/state
  const existingItem = cart.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    // 🔥🔥🔥 TAMBAHAN KRUSIAL DI SINI 🔥🔥🔥
    cart.push({
      productId: product.id,
      nama: product.nama,
      price: productPrice, // Harga Jual (misal: 30000)

      // >>> SIMPAN HARGA ASLI DAN DISKON DARI OBJEK PRODUK <<<
      hargaAsli: hargaAsli, // Harga Asli (misal: 50000)
      hargaDiskon: hargaDiskon, // Harga Diskon (misal: 20000)
      // --------------------------------------------------------

      ownerId: product.ownerId,
      shopName: finalShopName,
      shopPhone: finalSellerPhone,
      image: productImageURL,
      quantity: quantity,
    });
  }

  // KUNCI PERBAIKAN: Menyimpan data terbaru ke Local Storage
  if (typeof saveCartToLocalStorage === "function") {
    saveCartToLocalStorage();
    console.log(
      `[ADDCART: Save] saveCartToLocalStorage() dipanggil. Cart di memori: ${cart.length}`
    ); // DEBUG B
  } else {
    console.warn(
      "Fungsi saveCartToLocalStorage() tidak ditemukan. Data mungkin tidak disimpan."
    );
  }

  // Tambahkan notifikasi sukses (opsional)
  // Swal.fire({
  //   icon: "success",
  //   title: "Berhasil",
  //   text: `${product.nama} ditambahkan ke keranjang.`,
  //   toast: true,
  //   position: "top-end",
  //   showConfirmButton: false,
  //   timer: 1500,
  // });
}

function handleRemoveFromCart(e) {
  e.stopPropagation();

  const productIdToRemove = e.currentTarget.dataset.id;

  if (!productIdToRemove) {
    console.error("ID Produk tidak ditemukan untuk dihapus.");
    return;
  }

  const initialLength = cart.length;
  cart = cart.filter((item) => item.productId !== productIdToRemove);

  if (cart.length < initialLength) {
    updateCartCount();
    renderCartItems();

    Swal.fire({
      icon: "info",
      title: "Item Dihapus",
      text: "Produk berhasil dikeluarkan dari keranjang.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1000,
    });
  } else {
    console.warn(
      `Gagal menghapus item: Produk ID ${productIdToRemove} tidak ditemukan di keranjang.`
    );
  }
}

/**
 * Membuka modal profil dan mengisi data penjual
 */
async function openProfileModal() {
  if (!currentUser) {
    console.error(
      "DEBUG [Profile]: Pengguna belum login/currentUser tidak tersedia."
    );
    return;
  }

  try {
    const sellerData = await getSellerData(currentUser.uid);

    if (!sellerData) {
      console.warn(
        `DEBUG [Profile]: Data penjual untuk UID ${currentUser.uid} tidak ditemukan di Firestore.`
      );
      return;
    }

    // 2. Isi input nama toko
    if (shopNameInput) {
      shopNameInput.value = sellerData.shopName || "";
    }

    // 3. Isi input Nomor HP dan Alamat
    if (profilePhoneInput) {
      profilePhoneInput.value = sellerData.phone || "";
    }
    if (profileAddressInput) {
      profileAddressInput.value = sellerData.address || "";
    }

    // 4. Reset tampilan error dan input password
    if (shopNameError) shopNameError.classList.add("hidden");
    if (passwordError) passwordError.classList.add("hidden");
    if (contactError) contactError.classList.add("hidden");
    if (newPasswordInput) newPasswordInput.value = "";

    // 5. Tampilkan modal
    if (profileModal) profileModal.classList.remove("hidden");

    // 6. Atur tampilan password (sembunyikan)
    if (newPasswordInput) newPasswordInput.setAttribute("type", "password");
    if (eyeIconOpen) eyeIconOpen.classList.add("hidden");
    if (eyeIconClosed) eyeIconClosed.classList.remove("hidden");

    // 7. OPSIONAL: Tampilkan info role di modal
    const profileRoleDisplay = document.getElementById("profile-role-display");
    if (profileRoleDisplay) {
      profileRoleDisplay.textContent = `Role Anda: ${
        sellerData.role ? sellerData.role.toUpperCase() : "N/A"
      }`;
    }
  } catch (error) {
    console.error("Error membuka modal profil:", error);
  }
}

/**
 * Menangani update Nama Toko
 */
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
    loadProducts();
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
/**

* Fungsi untuk berpindah view dari Detail Produk ke Formulir Order

*/

function handleMoveToOrderView() {
  // 1. Ambil data saat ini
  const quantity = parseInt(productQuantityInput.value) || 1;

  // 2. Simpan data yang akan digunakan saat submit
  currentOrderQuantity = quantity;
  currentOrderProductDetail = currentProductDetail;
  currentOrderSellerPhone = currentSellerPhone;

  // Pastikan detail produk ditemukan
  if (!currentOrderProductDetail) {
    Swal.fire("Error", "Detail produk tidak ditemukan.", "error");
    return;
  }

  // 🔥🔥🔥 KRUSIAL: VALIDASI OWNER ID 🔥🔥🔥
  const ownerId = currentOrderProductDetail.ownerId;
  if (!ownerId) {
    console.error(
      "Owner ID tidak ditemukan di data produk! Gagal memproses order."
    );
    Swal.fire("Error", "Informasi Penjual produk tidak lengkap.", "error");
    return;
  }
  // 🔥🔥🔥 AKHIR VALIDASI OWNER ID 🔥🔥🔥

  // --- AMBIL DATA HARGA DENGAN DISKON DARI currentProductDetail ---
  const { nama, price, hargaAsli, hargaDiskon } = currentOrderProductDetail;
  const hargaJual = price;

  const totalFinal = hargaJual * quantity;
  const totalOriginal = hargaAsli * quantity;

  const isOnDiscount = hargaDiskon !== null && hargaDiskon < hargaAsli;
  // ---------------------------------------------------------------

  // Format harga
  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // --- AMBIL ELEMEN HTML ---
  const orderProductSummary = document.getElementById("order-product-summary");
  const orderError = document.getElementById("order-error");
  const orderOriginalPriceElement = document.getElementById(
    "order-original-price"
  );
  const orderDiscountedPriceElement = document.getElementById(
    "order-discounted-price"
  );
  const orderTotalPriceElement = document.getElementById("order-total-price");
  const orderItemPriceContainer = document.getElementById(
    "order-item-price-container"
  );
  const multiItemSummaryList = document.getElementById(
    "multi-item-summary-list"
  ); // Elemen Multi-Item

  // 🔥 AMBIL ELEMEN HR (SEPARATOR) 🔥
  const orderSummarySeparator = document.getElementById(
    "order-summary-separator"
  );

  // --- 3. Atur Visibilitas dan Isi Ringkasan di Order View ---

  // 🔥 KRUSIAL 1: PASTIKAN WADAH MULTI-ITEM DISEMBUYIKAN DAN WADAH SINGLE-ITEM DITAMPILKAN
  if (multiItemSummaryList) multiItemSummaryList.classList.add("hidden");
  if (orderItemPriceContainer)
    orderItemPriceContainer.classList.remove("hidden");

  // 🔥🔥🔥 KRUSIAL: TAMPILKAN GARIS HR KEMBALI 🔥🔥🔥
  if (orderSummarySeparator) orderSummarySeparator.classList.remove("hidden");

  // 3a. Nama Produk & Kuantitas
  if (orderProductSummary)
    orderProductSummary.textContent = `${nama} (x ${quantity})`;

  if (orderError) orderError.classList.add("hidden");

  // 3b. LOGIKA TAMPILAN HARGA (Single-Item)
  if (
    orderOriginalPriceElement &&
    orderDiscountedPriceElement &&
    orderTotalPriceElement
  ) {
    // 🔥 KRUSIAL 2: TAMPILKAN KEMBALI ELEMEN HARGA SEBELUM MENGISI DATA
    orderDiscountedPriceElement.classList.remove("hidden");

    if (isOnDiscount) {
      // 1. Harga Normal (Dicoret)
      orderOriginalPriceElement.textContent = `Harga Normal: ${formatIDR(
        hargaAsli
      )}`;
      orderOriginalPriceElement.classList.remove("hidden"); // <<< TAMPILKAN HARGA DICORET

      // 2. Harga Bayar (Diskon per unit)
      orderDiscountedPriceElement.textContent = `Harga Diskon: ${formatIDR(
        hargaJual
      )}`;

      // 3. Total Pembayaran (Grand Total)
      orderTotalPriceElement.textContent = formatIDR(totalFinal);
    } else {
      // Mode Harga Normal
      orderOriginalPriceElement.classList.add("hidden"); // Sembunyikan harga dicoret

      // Harga Bayar (Sama dengan Harga Normal/unit)
      orderDiscountedPriceElement.textContent = `Harga: ${formatIDR(
        hargaJual
      )}`;

      // Total Pembayaran (Grand Total)
      orderTotalPriceElement.textContent = formatIDR(totalFinal);
    }
  }

  // 3c. SUNTIKKAN OWNER ID KE TOMBOL SUBMIT
  const orderSubmitBtn = document.getElementById("order-submit-btn");
  if (orderSubmitBtn) {
    orderSubmitBtn.setAttribute("data-owner-id", ownerId);
    console.log("Owner ID berhasil disuntikkan ke tombol submit:", ownerId);
  }

  // 4. Alihkan View
  if (productDetailView) productDetailView.classList.add("hidden");
  if (orderDetailView) orderDetailView.classList.remove("hidden");

  // 🔥 SET FLAG UNTUK SINGLE ITEM CHECKOUT
  isMultiItemCheckout = false;
  setupBackToButtonListener(); // Update tombol kembali ke mode Detail Produk

  // Pastikan input nama/alamat pembeli direset atau dikosongkan saat view dipindahkan
  const buyerNameInput = document.getElementById("buyer-name");
  const buyerPhoneInput = document.getElementById("buyer-phone");
  const buyerAddressInput = document.getElementById("buyer-address");

  if (buyerNameInput) buyerNameInput.value = "";
  if (buyerPhoneInput) buyerPhoneInput.value = "";
  if (buyerAddressInput) buyerAddressInput.value = "";

  window.scrollTo(0, 0);
}
/**
 * Fungsi untuk kembali dari Formulir Order ke Tampilan Detail Produk (Mode Single Item Checkout).
 */
function handleBackToDetailClick() {
  if (orderDetailView) {
    orderDetailView.classList.add("hidden");
  }

  if (productDetailView) {
    productDetailView.classList.remove("hidden");
  }

  window.scrollTo(0, 0);
}

// -----------------------------------------------------------------
// 🔥 FUNGSI BARU UNTUK SEARCH OVERLAY 🔥
// Catatan: Anda perlu menambahkan definisi fungsi ini di luar blok DOMContentLoaded
// -----------------------------------------------------------------

/**
 * Membuka Search Overlay dengan animasi dan menyembunyikan navigasi.
 */
function openSearchOverlay() {
  if (!searchOverlay || !mainNav || !logoLink) return;

  // 1. Tambahkan kelas 'active' untuk memicu CSS transition (memanjang)
  searchOverlay.classList.add("active");

  // 2. Sembunyikan navigasi dan logo (fade out)
  mainNav.style.opacity = "0";
  logoLink.style.opacity = "0";

  // 3. Fokus pada input setelah animasi memanjang selesai
  setTimeout(() => {
    // Sembunyikan secara fisik agar tidak mengganggu interaksi
    mainNav.style.visibility = "hidden";
    logoLink.style.visibility = "hidden";
    searchInput.focus();
  }, 400); // 400ms sesuai durasi transisi CSS
}

/**
 * Menutup Search Overlay dengan animasi dan menampilkan kembali navigasi.
 */
function closeSearchOverlay() {
  if (!searchOverlay || !mainNav || !logoLink) return;

  // 1. Hapus kelas 'active' untuk memicu CSS transition (mengkerut)
  searchOverlay.classList.remove("active");
  searchInput.blur();

  // 2. Tampilkan kembali navigasi dan logo (visibility & fade in)
  mainNav.style.visibility = "visible";
  logoLink.style.visibility = "visible";

  // 3. Fade in setelah visibility diubah
  setTimeout(() => {
    mainNav.style.opacity = "1";
    logoLink.style.opacity = "1";
  }, 50);
}

/**
 * Menangani penekanan tombol Enter pada input pencarian.
 * @param {KeyboardEvent} event
 */
function handleSearchInputKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Mencegah form submit default jika ada

    const query = searchInput.value;

    // Pastikan fungsi filterProducts() tersedia di scope ini
    if (typeof filterProducts === "function") {
      // Memanggil fungsi filter yang sudah kita buat
      filterProducts(query);

      console.log(`Pencarian produk dijalankan untuk: ${query}`);

      // Tutup overlay setelah pencarian selesai
      closeSearchOverlay();
    } else {
      // Log jika fungsi filterProducts belum didefinisikan (untuk debugging)
      console.error(
        "ERROR: Fungsi filterProducts tidak ditemukan atau belum dideklarasikan."
      );
    }
  }
}

/**
 * Mengeksekusi aksi pencarian saat tombol kaca pembesar diklik.
 * Ini adalah wrapper untuk fungsi filtering utama.
 */
function executeSearchAction() {
  if (searchInput) {
    const query = searchInput.value;
    console.log("Pencarian produk dijalankan untuk:", query);

    // Asumsi: filterProducts adalah fungsi yang bertanggung jawab menyaring ALL_PRODUCTS_CACHE
    // dan renderFilteredProducts.
    filterProducts(query);

    // Opsional: Tutup overlay setelah pencarian dieksekusi, kecuali di desktop
    // if (searchOverlay) {
    //    closeSearchOverlay();
    // }
  }
}
/**
 * Menangani submit formulir pesanan, mencatat ke Firestore, dan membuat link WhatsApp.
 */ /**
 * Menangani submit formulir pesanan, mencatat ke Firestore (untuk single item),
 * dan membuat link WhatsApp.
 */
async function handleOrderSubmit(e) {
  e.preventDefault();

  // Asumsi 'orderError' adalah elemen HTML untuk menampilkan pesan kesalahan
  if (orderError) orderError.classList.add("hidden");

  // --- 1. AMBIL DAN VALIDASI INPUT BUYER ---
  const buyerName = buyerNameInput ? buyerNameInput.value.trim() : "";
  const buyerPhoneRaw = buyerPhoneInput ? buyerPhoneInput.value.trim() : "";
  const buyerAddress = buyerAddressInput ? buyerAddressInput.value.trim() : "";

  if (!buyerName || !buyerPhoneRaw || !buyerAddress) {
    if (orderError) {
      orderError.textContent = "Semua kolom harus diisi.";
      orderError.classList.remove("hidden");
    }
    return;
  }

  // --- 5. FORMAT HARGA ---
  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // =========================================================================
  // === BLOK MULTI-ITEM CHECKOUT (DIPROSES SEBAGAI MULTI-VENDOR) ===========
  // =========================================================================

  if (isMultiItemCheckout) {
    // 2. TENTUKAN PRODUK DAN PENGELOMPOKAN

    if (cart.length === 0) {
      Swal.fire(
        "Error",
        "Keranjang kosong. Tidak ada yang dipesan.",
        "warning"
      );
      return;
    }

    // KRUSIAL: MEMECAH KERANJANG BERDASARKAN OWNER ID

    const groupedOrders = cart.reduce((acc, item) => {
      // 🔥 ASUMSI KRUSIAL: item sekarang memiliki item.price (Harga Jual) dan item.hargaAsli 🔥

      const ownerId = item.ownerId || "unknown";

      if (!acc[ownerId]) {
        acc[ownerId] = {
          ownerId: ownerId,
          shopName: item.shopName || "Penjual",
          rawSellerPhone: item.shopPhone,
          items: [],
          total: 0,
        };
      }

      const itemTotal = Number(item.price) * item.quantity;
      acc[ownerId].items.push(item);
      acc[ownerId].total += itemTotal;

      return acc;
    }, {});

    const validOrders = Object.values(groupedOrders).filter((order) => {
      const isValid =
        order.ownerId !== "unknown" &&
        order.rawSellerPhone &&
        order.items.length > 0;
      return isValid;
    });

    if (validOrders.length === 0) {
      Swal.fire(
        "Error",
        "Tidak ada produk dengan informasi penjual yang lengkap di keranjang.",
        "error"
      );
      return;
    }

    let allOrdersSuccess = true;
    let successfulOrdersCount = 0;

    // 🔥 3. LOOP UNTUK SETIAP PENJUAL (ORDER)
    for (const order of validOrders) {
      let finalPhone = "";

      // --- 4. FORMAT NOMOR WHATSAPP (PER-PENJUAL) ---

      try {
        const rawSellerPhone = order.rawSellerPhone;
        if (!rawSellerPhone)
          throw new Error("Nomor telepon penjual tidak ditemukan.");

        // ... (Logika format WA) ...
        const cleanPhone = rawSellerPhone.replace(/[\s\+]/g, "");
        const phoneDigits = cleanPhone.replace(/[^0-9]/g, "");

        if (phoneDigits.startsWith("62")) {
          finalPhone = phoneDigits;
        } else if (phoneDigits.startsWith("0")) {
          finalPhone = `62${phoneDigits.substring(1)}`;
        } else {
          finalPhone = `62${phoneDigits}`;
        }

        if (finalPhone.length < 9)
          throw new Error("Nomor WhatsApp penjual tidak valid.");
      } catch (error) {
        console.error(
          `Error memproses WA Penjual (${order.ownerId}):`,
          error.message
        );
        allOrdersSuccess = false;
        continue;
      }

      // --- 6. SUSUN DATA FIRESTORE (PER-PENJUAL) ---

      let newOrderData = {
        ownerId: order.ownerId,
        id:
          "ORD-" +
          Date.now().toString().slice(-6) +
          "-" +
          order.ownerId.substring(0, 4).toUpperCase(),
        buyerName: buyerName,
        buyerPhone: buyerPhoneRaw,
        buyerAddress: buyerAddress,

        // OrderDetail sekarang harus mencantumkan harga asli jika ada diskon (atau harga jual jika tidak)
        orderDetail: order.items
          .map((i) => {
            const hargaJual = Number(i.price);
            const hargaAsli = Number(i.hargaAsli);
            const isDiscounted = hargaAsli > hargaJual;

            if (isDiscounted) {
              return `${i.nama} (x ${i.quantity}) - Harga Diskon: ${formatIDR(
                hargaJual
              )}`;
            } else {
              return `${i.nama} (x ${i.quantity}) - ${formatIDR(hargaJual)}`;
            }
          })
          .join(", "),

        totalAmount: order.total,
        status: "Diterima",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),

        // 🔥 PENAMBAHAN KRITIS: productItems (untuk pengurangan stok oleh penjual) 🔥
        productItems: order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const isSuccessFirestore = await addOrderToFirestore(newOrderData);

      if (!isSuccessFirestore) {
        console.error(
          "Gagal mencatat pesanan ke Firestore untuk owner:",
          order.ownerId
        );
        allOrdersSuccess = false;
        continue;
      }

      successfulOrdersCount++;

      // --- 7. SUSUN PESAN WHATSAPP & ARAHKAN KE WA (PER-PENJUAL) ---

      // 🔥🔥🔥 PERUBAHAN UTAMA DI SINI: Menyusun detail item dengan harga asli (dicoret/diskon) 🔥🔥🔥
      let itemDetails = order.items
        .map((item) => {
          const hargaJual = Number(item.price) || 0;
          const hargaAsli = Number(item.hargaAsli) || hargaJual;
          const isDiscounted = hargaAsli > hargaJual;

          let priceString;
          if (isDiscounted) {
            priceString = `Harga Normal: ${formatIDR(
              hargaAsli
            )} -> Harga Bayar: ${formatIDR(hargaJual)}`;
          } else {
            priceString = `Harga: ${formatIDR(hargaJual)}`;
          }

          return `* ${item.nama} (x${item.quantity})\n      (${priceString})`;
        })
        .join("\n");
      // 🔥🔥🔥 AKHIR PERUBAHAN UTAMA 🔥🔥🔥

      const message = `[PESANAN BLUEFIN]

Halo *${order.shopName}*, saya ingin membuat pesanan baru:

*ID Pesanan:* ${newOrderData.id}
---------------------------------

*PRODUK:*
${itemDetails}

*TOTAL BIAYA:* ${formatIDR(order.total)}

*DETAIL PEMBELI:*
*Nama:* ${buyerName}
*No. HP:* ${buyerPhoneRaw}
*Alamat:* ${buyerAddress}

Mohon konfirmasi ketersediaan produk dan instruksi pembayarannya. Terima kasih!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;

      // Buka tab baru untuk setiap penjual
      window.open(whatsappUrl, "_blank");

      // Refresh dashboard penjual (jika view management terbuka)
      if (
        document.getElementById("management-view") &&
        !document.getElementById("management-view").classList.contains("hidden")
      ) {
        loadNewOrdersList();
      }
    } // AKHIR LOOP FOR

    // NOTIFIKASI AKHIR UNTUK PEMBELI (SETELAH SEMUA PESANAN DIPROSES)

    const totalOrders = validOrders.length;
    let successText;

    if (successfulOrdersCount === 0) {
      successText = "Semua pesanan gagal dicatat. Silakan coba lagi.";
    } else if (successfulOrdersCount < totalOrders) {
      successText = `Berhasil mencatat ${successfulOrdersCount} dari ${totalOrders} pesanan. Ada ${
        totalOrders - successfulOrdersCount
      } pesanan yang gagal diproses atau gagal diarahkan ke WA.`;
    } else {
      successText = `Semua ${totalOrders} pesanan berhasil dicatat dan Anda diarahkan ke WhatsApp. Tekan 'Lanjutkan' untuk kembali ke toko.`;
    }

    Swal.fire({
      icon: allOrdersSuccess ? "success" : "warning",
      title: allOrdersSuccess
        ? "Semua Pesanan Berhasil!"
        : "Pesanan Diproses Sebagian",
      text: successText,
      showConfirmButton: true,
      confirmButtonText: "Lanjutkan",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        // Bersihkan keranjang
        cart = [];
        updateCartCount();

        // Reset state dan navigasi
        handleBackToProductsClick();
        if (orderDetailView) orderDetailView.classList.add("hidden");
      }
    });

    return; // Keluar dari fungsi setelah memproses keranjang
  }

  // =========================================================================
  // === BLOK SINGLE ITEM CHECKOUT (KODE ASLI ANDA) ==========================
  // =========================================================================
  else {
    // --- 2. TENTUKAN PRODUK DAN TOTAL ---

    let orderItems = [];
    let total = 0;
    let ownerId = null;
    let isFirestoreRecordNeeded = false;

    // 🔥 PERBAIKAN KRITIS: Ganti .productId menjadi .id untuk mengambil ID Produk 🔥
    const currentProductId = currentOrderProductDetail
      ? currentOrderProductDetail.id
      : null;
    const currentQuantity = currentOrderQuantity;

    // Mode Single Item (Beli Sekarang)
    if (
      !currentOrderProductDetail ||
      !currentOrderSellerPhone ||
      !currentQuantity
    ) {
      Swal.fire(
        "Error",
        "Data produk/penjual hilang. Coba muat ulang halaman atau ulangi proses beli.",
        "error"
      );
      return;
    }

    ownerId = currentOrderProductDetail.ownerId;
    isFirestoreRecordNeeded = true;

    // Tambahkan validasi yang ketat sebelum lanjut
    if (!ownerId || !currentProductId) {
      console.error(
        "Owner ID atau Product ID tidak ditemukan di currentOrderProductDetail. Object detail:",
        currentOrderProductDetail
      );
      Swal.fire(
        "Error",
        "ID Penjual atau ID Produk tidak ditemukan (Data hilang). Gagal mencatat pesanan.",
        "error"
      );
      return;
    }

    // 🔥🔥 TAMBAHAN KRITIS: Pastikan hargaAsli dan hargaDiskon ada di item lokal single-item 🔥🔥
    const hargaAsliSingle =
      currentOrderProductDetail.hargaAsli || currentOrderProductDetail.price;
    const hargaDiskonSingle = currentOrderProductDetail.hargaDiskon || null;
    const isDiscountedSingle =
      hargaDiskonSingle !== null && hargaDiskonSingle < hargaAsliSingle;

    orderItems.push({
      nama: currentOrderProductDetail.nama,
      price: currentOrderProductDetail.price, // Harga Jual
      hargaAsli: hargaAsliSingle, // Harga Asli
      hargaDiskon: hargaDiskonSingle, // Harga Diskon
      quantity: currentQuantity,
      shopName: currentOrderProductDetail.shopName,
      shopPhone: currentOrderSellerPhone,
      productId: currentProductId,
    });

    total = currentOrderProductDetail.price * currentQuantity;

    if (orderItems.length === 0) {
      Swal.fire(
        "Error",
        "Keranjang kosong. Tidak ada yang dipesan.",
        "warning"
      );
      return;
    }

    // --- 3. AMBIL DETAIL PENJUAL (UNTUK WHATSAPP) ---
    const firstItem = orderItems[0];
    const rawSellerPhone = firstItem.shopPhone;
    const shopName = firstItem.shopName || "Penjual";

    // --- 4. FORMAT NOMOR WHATSAPP ---
    let finalPhone = "";

    try {
      if (!rawSellerPhone) {
        throw new Error("Nomor telepon penjual tidak ditemukan.");
      }

      // ... (Logika format WA) ...
      const cleanPhone = rawSellerPhone.replace(/[\s\+]/g, "");
      const phoneDigits = cleanPhone.replace(/[^0-9]/g, "");

      if (phoneDigits.startsWith("62")) {
        finalPhone = phoneDigits;
      } else if (phoneDigits.startsWith("0")) {
        finalPhone = `62${phoneDigits.substring(1)}`;
      } else {
        finalPhone = `62${phoneDigits}`;
      }
    } catch (error) {
      console.error("Error memproses nomor telepon penjual:", error.message);
      Swal.fire(
        "Error",
        "Gagal memproses nomor WhatsApp penjual. Coba hubungi penjual secara manual.",
        "error"
      );
      return;
    }

    if (finalPhone.length < 9) {
      Swal.fire(
        "Error",
        "Nomor WhatsApp penjual tidak valid setelah pemrosesan.",
        "error"
      );
      return;
    }

    // --- 6. SUSUN DATA FIRESTORE (JIKA SINGLE ITEM) ---

    let isSuccessFirestore = true;
    let newOrderData = null;

    if (!isMultiItemCheckout && ownerId) {
      // 🔥🔥 PERBAIKAN FIREBASE: Cantumkan harga asli di orderDetail jika diskon
      const detailHargaAsli = hargaAsliSingle || total;
      const detailHargaJual = total;
      let detailString;

      if (isDiscountedSingle) {
        detailString = `${firstItem.nama} (x ${
          firstItem.quantity
        }) - Harga Diskon: ${formatIDR(detailHargaJual)}`;
      } else {
        detailString = `${firstItem.nama} (x ${
          firstItem.quantity
        }) - ${formatIDR(detailHargaJual)}`;
      }

      newOrderData = {
        ownerId: ownerId,
        id: "ORD-" + Date.now().toString().slice(-6),
        buyerName: buyerName,
        buyerPhone: buyerPhoneRaw,
        buyerAddress: buyerAddress,
        orderDetail: detailString, // Hanya satu item
        totalAmount: total,
        status: "Diterima",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),

        // 🔥 PENAMBAHAN KRITIS SINGLE-ITEM: productItems 🔥
        productItems: [
          {
            productId: currentProductId,
            quantity: currentQuantity,
          },
        ],
      };

      // Asumsi addOrderToFirestore sudah didefinisikan dan mengembalikan boolean
      isSuccessFirestore = await addOrderToFirestore(newOrderData);

      if (!isSuccessFirestore) {
        Swal.fire(
          "Gagal!",
          "Gagal mencatat pesanan ke database. Silakan coba lagi.",
          "error"
        );
        return;
      }

      // Refresh dashboard penjual
      if (
        document.getElementById("management-view") &&
        !document.getElementById("management-view").classList.contains("hidden")
      ) {
        loadNewOrdersList();
      }
    }

    // --- 7. SUSUN PESAN WHATSAPP & ARAHKAN KE WA ---

    // 🔥🔥🔥 PERUBAHAN UTAMA DI SINI: Menyusun detail item dengan harga asli (dicoret/diskon) 🔥🔥🔥
    let itemDetails;
    if (isDiscountedSingle) {
      itemDetails = `* ${firstItem.nama} (x${
        firstItem.quantity
      })\n      (Harga Normal: ${formatIDR(
        hargaAsliSingle
      )} -> Harga Bayar: ${formatIDR(firstItem.price)})`;
    } else {
      itemDetails = `* ${firstItem.nama} (x${
        firstItem.quantity
      })\n      (Harga: ${formatIDR(firstItem.price)})`;
    }
    // 🔥🔥🔥 AKHIR PERUBAHAN UTAMA 🔥🔥🔥

    const message = `[PESANAN DAKATA SHOP]

Halo ${shopName}, saya ingin membuat pesanan:

${newOrderData ? `*ID Pesanan:* ${newOrderData.id}` : ""}

*PRODUK:*
${itemDetails}

*Total Biaya:* ${formatIDR(total)}

*DETAIL PEMBELI:*
Nama: ${buyerName}
No. HP: ${buyerPhoneRaw}
Alamat: ${buyerAddress}

Mohon konfirmasi ketersediaan produk dan instruksi pembayarannya. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");

    // NOTIFIKASI MODAL STANDAR DENGAN CALLBACK .then()
    Swal.fire({
      icon: "success",
      title: "Pesanan Berhasil Dibuat!",
      text: `Data pesanan ${
        isFirestoreRecordNeeded ? "telah dicatat dan " : ""
      } Anda telah diarahkan ke WhatsApp. Tekan 'Lanjutkan' untuk kembali ke toko.`,
      showConfirmButton: true,
      confirmButtonText: "Lanjutkan",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        // Tidak perlu reset cart karena ini bukan multi item

        // Kembali ke daftar produk utama
        handleBackToProductsClick();

        // Pastikan orderDetailView disembunyikan
        if (orderDetailView) orderDetailView.classList.add("hidden");
      }
    });
  } // AKHIR BLOK ELSE (SINGLE ITEM)
}

/**
 * Menangani update Nomor HP dan Alamat.
 */
async function handleUpdateContact(e) {
  e.preventDefault();

  if (contactError) contactError.classList.add("hidden");

  if (!profilePhoneInput || !profileAddressInput || !contactSubmitBtn) {
    console.error("Error DOM: Input kontak tidak terinisialisasi.");
    return;
  }

  const newPhone = profilePhoneInput.value.trim();
  const newAddress = profileAddressInput.value.trim();

  if (!currentUser) return;

  if (newPhone.length < 5) {
    if (contactError) {
      contactError.textContent = "Nomor HP minimal 5 digit.";
      contactError.classList.remove("hidden");
    }
    return;
  }
  if (newAddress.length < 5) {
    if (contactError) {
      contactError.textContent = "Alamat lengkap minimal 5 karakter.";
      contactError.classList.remove("hidden");
    }
    return;
  }

  const originalText = "Simpan Kontak & Alamat";
  setLoading(contactSubmitBtn, true, originalText, "Menyimpan...");

  try {
    const updateData = {
      phone: newPhone,
      address: newAddress,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("sellers").doc(currentUser.uid).update(updateData);

    profilePhoneInput.value = newPhone;
    profileAddressInput.value = newAddress;

    Swal.fire({
      icon: "success",
      title: "Kontak & Alamat Diperbarui!",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
  } catch (error) {
    console.error("Error updating contact and address:", error);
    if (contactError) {
      contactError.textContent = `Gagal update kontak: ${error.message}`;
      contactError.classList.remove("hidden");
    }
  } finally {
    setLoading(contactSubmitBtn, false, originalText);
  }
}

/**
 * Menangani Ganti Sandi Akun
 */
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

function handleCropApply() {
  if (!cropperInstance) return;

  const croppedCanvas = cropperInstance.getCroppedCanvas({
    width: 600,
    height: 600,
  });

  croppedCanvas.toBlob(
    (blob) => {
      croppedFileBlob = blob;

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

      if (cropModal) cropModal.classList.add("hidden");
      if (cropperInstance) cropperInstance.destroy();
      cropperInstance = null;

      if (productImageFile) productImageFile.removeAttribute("required");
    },
    "image/jpeg",
    0.9
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // --- INISIALISASI SEMUA VARIABEL DOM (HANYA SEKALI) ---

  // BAGIAN UTAMA
  productListDiv = document.getElementById("product-list");
  mainBanner = document.getElementById("main-banner");
  productListTitleElement = document.getElementById("product-list-header");
  productListWrapperElement = document.getElementById("product-list-wrapper");
  productListView = document.getElementById("product-list-view"); // Asumsi ID wrapper utama list

  setTimeout(showDevelopmentWarning, 500);

  // 🔥 BAGIAN SEARCH OVERLAY BARU 🔥
  searchBtn = document.getElementById("search-btn"); // Tombol kaca pembesar di Header
  searchOverlay = document.getElementById("search-overlay"); // Wrapper overlay yang memanjang
  searchInput = document.getElementById("search-input"); // Input field di dalam overlay
  closeSearchBtn = document.getElementById("close-search-btn"); // Tombol X untuk menutup
  mainNav = document.getElementById("main-nav"); // Kontainer navigasi (perlu disembunyikan)
  logoLink = document.getElementById("logo-link"); // Link Logo (perlu disembunyikan)
  executeSearchBtn = document.getElementById("execute-search-btn");

  searchHistoryContainer = document.getElementById("search-history-container");
  clearHistoryBtn = document.getElementById("clear-history-btn");
  // 🔥 AKHIR BAGIAN SEARCH OVERLAY 🔥

  // BAGIAN AUTHENTIKASI & MODAL
  authBtn = document.getElementById("auth-btn");
  authModal = document.getElementById("auth-modal");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  authSubmitBtn = document.getElementById("auth-submit-btn");
  closeModalBtn = document.getElementById("close-modal-btn");
  authError = document.getElementById("auth-error");

  // Auth Tambahan
  toggleAuthMode = document.getElementById("toggle-auth-mode");
  toggleAuthLink = document.getElementById("toggle-auth-link");
  adminRegisterInfo = document.getElementById("admin-register-info");

  // Auth Input
  authPhoneInput = document.getElementById("auth-phone");
  authAddressInput = document.getElementById("auth-address");
  authPhoneGroup = document.getElementById("auth-phone-group");
  authAddressGroup = document.getElementById("auth-address-group");
  authRoleGroup = document.getElementById("auth-role-group");
  authRoleInput = document.getElementById("auth-role");

  // Auth Password Visibility
  authPasswordInput = document.getElementById("auth-password");
  toggleAuthPasswordBtn = document.getElementById(
    "toggle-auth-password-visibility"
  );
  authEyeIconOpen = document.getElementById("auth-eye-icon-open");
  authEyeIconClosed = document.getElementById("auth-eye-icon-closed");

  // BAGIAN UPLOAD & CROPPER
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
  imageToCrop = document.getElementById("image-to-crop");
  cropModal = document.getElementById("crop-modal");
  closeCropModalBtn = document.getElementById("close-crop-modal-btn");
  applyCropBtn = document.getElementById("apply-crop-btn");

  // BAGIAN SELLER/ADMIN KONTROL & TAMPILAN
  sellerControls = document.getElementById("seller-controls");
  sellerGreeting = document.getElementById("seller-greeting");
  manageBtn = document.getElementById("manage-btn");
  managementView = document.getElementById("management-view");
  adminBtn = document.getElementById("admin-btn");
  adminView = document.getElementById("admin-view");
  customerListTableBody = document.getElementById("customer-list-table-body");
  addUserBtn = document.getElementById("add-user-btn");

  // BAGIAN MANAGEMENT STATS & CHART
  totalSaldo = document.getElementById("total-saldo");
  totalTerjual = document.getElementById("total-terjual");
  totalTransaksi = document.getElementById("total-transaksi");
  transactionHistory = document.getElementById("transaction-history");
  salesChartCanvas = document.getElementById("salesChart");

  // BAGIAN DETAIL PRODUK
  productDetailView = document.getElementById("product-detail-view");
  backToProductsBtn = document.getElementById("back-to-products-btn");
  detailProductName = document.getElementById("detail-product-name");
  detailProductPrice = document.getElementById("detail-product-price");
  detailProductDescription = document.getElementById(
    "detail-product-description"
  );
  detailProductImage = document.getElementById("detail-product-image");
  detailShopNameText = document.getElementById("detail-shop-name-text");
  detailOwnerMessage = document.getElementById("detail-owner-message");

  // Detail Kuantitas
  qtyDecrementBtn = document.getElementById("qty-decrement");
  qtyIncrementBtn = document.getElementById("qty-increment");
  productQuantityInput = document.getElementById("product-quantity");
  detailStockInfo = document.getElementById("detail-stock-info");
  quantityControlsWrapper = document.getElementById("detail-qty-control");

  // BAGIAN KERANJANG
  cartBtn = document.getElementById("cart-btn");
  cartView = document.getElementById("cart-view");
  cartCount = document.getElementById("cart-count");
  cartItemsContainer = document.getElementById("cart-items-container");
  cartTotalPrice = document.getElementById("cart-total-price");
  checkoutBtn = document.getElementById("checkout-btn");
  backToProductsFromCartBtn = document.getElementById(
    "back-to-products-from-cart"
  );
  addToCartBtn = document.getElementById("add-to-cart-btn");

  newOrdersListBody = document.getElementById("new-orders-list");

  // BAGIAN ORDER DETAIL (CHECKOUT)
  orderDetailView = document.getElementById("order-detail-view");
  backToDetailBtn = document.getElementById("back-to-detail-btn");
  orderForm = document.getElementById("order-form");
  buyerNameInput = document.getElementById("buyer-name");
  buyerPhoneInput = document.getElementById("buyer-phone");
  buyerAddressInput = document.getElementById("buyer-address");
  orderSubmitBtn = document.getElementById("order-submit-btn");
  orderError = document.getElementById("order-error");
  orderProductSummary = document.getElementById("order-product-summary");
  orderTotalPrice = document.getElementById("order-total-price");
  buyNowBtn = document.getElementById("buy-now-btn"); // Tombol "Beli Sekarang" (Single Item)

  notificationModal = document.getElementById("notificationModal");
  notificationForm = document.getElementById("notificationForm");

  // BAGIAN PROFIL & FORM UPDATE
  profileBtn = document.getElementById("profile-btn");
  profileModal = document.getElementById("profile-modal");
  closeProfileModalBtn = document.getElementById("close-profile-modal-btn");

  // Form Update
  updateShopForm = document.getElementById("update-shop-form");
  shopNameInput = document.getElementById("shop-name");
  shopNameError = document.getElementById("shop-name-error");
  shopNameSubmitBtn = document.getElementById("shop-name-submit-btn");

  updateContactForm = document.getElementById("update-contact-form");
  profilePhoneInput = document.getElementById("profile-phone");
  profileAddressInput = document.getElementById("profile-address");
  contactSubmitBtn = document.getElementById("contact-submit-btn");
  contactError = document.getElementById("contact-error");

  updatePasswordForm = document.getElementById("update-password-form");
  newPasswordInput = document.getElementById("new-password");
  passwordError = document.getElementById("password-error");
  passwordSubmitBtn = document.getElementById("password-submit-btn");

  // Profile Password Visibility
  togglePasswordBtn = document.getElementById("toggle-password-visibility");
  eyeIconOpen = document.getElementById("eye-icon-open");
  eyeIconClosed = document.getElementById("eye-icon-closed");

  // BAGIAN TEMA / DARK MODE
  themeToggle = document.getElementById("theme-checkbox");
  console.log("Status Theme Toggle di DOM:", themeToggle);

  // --- AKHIR INISIALISASI DOM ---

  // Panggil setAuthModeToLogin() secara default saat DOMContentLoaded
  if (authSubmitBtn) {
    setAuthModeToLogin();
  }
  // -----------------------------------------------------------------
  // 🔥 EVENT LISTENERS 🔥
  // -----------------------------------------------------------------

  if (manageBtn) {
    // 🔔 MODIFIKASI: Pastikan memuat pesanan baru saat Management View dibuka
    manageBtn.addEventListener("click", toggleManagementView);
    // Kita akan memodifikasi fungsi 'toggleManagementView' untuk memanggil loadNewOrdersList()
    // agar data selalu segar saat dibuka.
  }
  // 0. Dark Mode Toggle
  if (themeToggle) {
    themeToggle.addEventListener("change", toggleTheme);
  }

  // 🔥 0.1. Search Overlay Toggle & Action 🔥

  if (orderForm) {
    // Pasang listener ke FORM, bukan ke BUTTON
    orderForm.addEventListener("submit", handleOrderSubmit);
    console.log("Listener Order Submit berhasil terpasang pada formulir.");
  } else {
    console.error("Elemen Formulir Order (id='order-form') tidak ditemukan.");
  }

  // Event Listener untuk tombol kaca pembesar (membuka overlay)
  if (searchBtn) {
    searchBtn.addEventListener("click", openSearchOverlay);
  }
  // Event Listener untuk tombol tutup (X)
  if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", closeSearchOverlay);
  }
  // Event Listener untuk Enter pada input search
  if (searchInput) {
    searchInput.addEventListener("keydown", handleSearchInputKeydown);
  }
  // 🔥 KUNCI: Event Listener untuk klik pada ikon kaca pembesar (Memicu pencarian) 🔥
  if (executeSearchBtn) {
    executeSearchBtn.addEventListener("click", executeSearchAction);
  }
  // 🔥 END SEARCH OVERLAY 🔥

  // 1. Produk Upload/Edit (MODAL UPLOAD)
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      editingProductId = null;
      croppedFileBlob = null;
      uploadModalTitle.textContent = "Upload Produk Baru";
      uploadSubmitBtn.textContent = "Simpan Produk";
      if (uploadForm) uploadForm.reset();
      if (imagePreviewContainer) imagePreviewContainer.classList.add("hidden");
      if (productImageFile)
        productImageFile.setAttribute("required", "required");

      if (uploadModal) {
        uploadModal.classList.remove("hidden");
        toggleBodyScroll(true);
      }
    });
  }
  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener("click", () => {
      if (uploadModal) uploadModal.classList.add("hidden");
      toggleBodyScroll(false);

      editingProductId = null;
      croppedFileBlob = null;
      uploadModalTitle.textContent = "Upload Produk Baru";
      uploadSubmitBtn.textContent = "Simpan Produk";
      if (productImageFile)
        productImageFile.setAttribute("required", "required");
      uploadForm.reset();
      imagePreviewContainer.classList.add("hidden");
    });
  }
  if (uploadForm) uploadForm.addEventListener("submit", handleSubmitProduct);

  // 1.1. Event Listener CROPPER (MEMBUKA MODAL CROP)
  if (productImageFile) {
    productImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (imagePreviewContainer)
          imagePreviewContainer.classList.add("hidden");

        const reader = new FileReader();
        reader.onload = (event) => {
          if (imageToCrop) {
            imageToCrop.src = event.target.result;
          } else {
            return;
          }

          if (cropModal) {
            cropModal.classList.remove("hidden");
            toggleBodyScroll(true);
          } else {
            return;
          }

          setTimeout(() => {
            if (typeof Cropper === "undefined") {
              console.error("ERROR: Cropper.js library tidak dimuat!");
              return;
            }

            if (cropperInstance) cropperInstance.destroy();

            if (imageToCrop) {
              cropperInstance = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 1,
              });
            }
          }, 100);
        };
        reader.readAsDataURL(file);
      } else {
        if (imagePreviewContainer)
          imagePreviewContainer.classList.add("hidden");
      }
    });
  }

  // 1.2. Event Listener untuk Crop Modal (MENUTUP MODAL CROP)
  if (closeCropModalBtn) {
    closeCropModalBtn.addEventListener("click", () => {
      if (cropModal) cropModal.classList.add("hidden");
      toggleBodyScroll(false);

      if (cropperInstance) cropperInstance.destroy();
      if (productImageFile) productImageFile.value = "";
      croppedFileBlob = null;
    });
  }

  if (applyCropBtn) {
    applyCropBtn.addEventListener("click", handleCropApply);
  }

  // 2. Autentikasi (MODAL AUTH)
  if (authBtn) {
    authBtn.addEventListener("click", () => {
      if (!currentUser) {
        setAuthModeToLogin();

        if (authModal) {
          authModal.classList.remove("hidden");
          toggleBodyScroll(true);
        }

        if (authPasswordInput)
          authPasswordInput.setAttribute("type", "password");
        if (authEyeIconOpen) authEyeIconOpen.classList.add("hidden");
        if (authEyeIconClosed) authEyeIconClosed.classList.remove("hidden");
      } else {
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
            auth
              .signOut()
              .then(() => {
                // FIX BUG RESET TAMPILAN ADMIN SETELAH LOGOUT
                if (adminView) adminView.classList.add("hidden");
                if (managementView) managementView.classList.add("hidden");
                if (productListWrapperElement)
                  productListWrapperElement.classList.remove("hidden");

                if (adminBtn) adminBtn.textContent = "Admin (Pelanggan)";
                if (manageBtn) manageBtn.textContent = "Management";
                // --- END FIX ---

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
      }
    });
  }

  // 🔥🔥🔥 BAGIAN BARU: LISTENER NOTIFIKASI ADMIN MODAL 🔥🔥🔥
  // Catatan: Fungsi openSendNotificationModal dan closeModal sudah dipanggil
  // melalui onclick di HTML/tabel admin. Di sini kita hanya butuh submit handler.
  if (notificationForm) {
    // Listener ini akan memanggil sendNotificationToUser(..., targetEmail)
    notificationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const uid = document.getElementById("targetUid").value;
      const email = document.getElementById("targetEmail").value;
      const title = document.getElementById("notificationTitle").value;
      const message = document.getElementById("notificationMessage").value;

      closeModal(); // Tutup modal notifikasi (menggunakan fungsi closeModal() yang baru)

      // Panggil fungsi pengiriman (pastikan fungsi sendNotificationToUser
      // sekarang menerima 4 argumen: uid, title, message, email)
      if (typeof sendNotificationToUser === "function") {
        sendNotificationToUser(uid, title, message, email);
      } else {
        console.error("Fungsi sendNotificationToUser tidak terdefinisi!");
      }
    });

    // Tambahkan listener untuk menutup modal ketika klik backdrop (di dalam modal)
    if (notificationModal) {
      notificationModal.addEventListener("click", (e) => {
        // Hanya tutup jika yang diklik adalah backdrop (modal itu sendiri)
        if (e.target.id === "notificationModal") {
          closeModal(); // Memanggil fungsi closeModal yang sudah Anda definisikan
        }
      });
    }
  } else {
    console.warn(
      "Element Form Notifikasi (id='notificationForm') tidak ditemukan."
    );
  }
  // 🔥🔥🔥 AKHIR BAGIAN BARU: LISTENER NOTIFIKASI ADMIN MODAL 🔥🔥🔥

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (authModal) authModal.classList.add("hidden");
      toggleBodyScroll(false);

      if (authError) authError.classList.add("hidden");

      // PENTING: Reset ke mode Login saat modal ditutup
      setAuthModeToLogin();
    });
  }

  // EVENT LISTENER KRUSIAL UNTUK LOGIN/DAFTAR
  if (authForm) authForm.addEventListener("submit", handleSubmitAuth);

  // 2.1. Event Listener untuk Toggle Mode di dalam modal (Hubungi Admin/Login)
  if (toggleAuthLink) {
    toggleAuthLink.addEventListener("click", (e) => {
      e.preventDefault();
      const currentAction = authSubmitBtn.getAttribute("data-action");

      if (currentAction === "login" || currentAction === "register") {
        const adminNumber = "6285161065796";
        const message = encodeURIComponent(
          "Halo Admin, saya tertarik untuk mendaftar sebagai penjual di platform Dakata Shop. Bisakah membantu saya mendaftar?"
        );

        const whatsappUrl = `https://wa.me/${adminNumber}?text=${message}`;
        window.open(whatsappUrl, "_blank");

        // FIX: Sembunyikan modal setelah membuka WhatsApp
        if (authModal) {
          authModal.classList.add("hidden");
          toggleBodyScroll(false);
        }

        if (authForm) authForm.reset();
        setAuthModeToLogin();
      }
    });
  }
  // 2.2. Event Listener untuk Tombol 'Tambah User' Admin
  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => {
      getSellerData(currentUser.uid)
        .then((sellerData) => {
          if (sellerData.role !== "admin") return;

          // KRUSIAL: Atur modal ke mode register, dan aktifkan mode admin
          setAuthModeToRegister(true);

          if (authModal) {
            authModal.classList.remove("hidden");
            toggleBodyScroll(true);

            if (authForm) authForm.reset();
            if (authError) authError.classList.add("hidden");
          }
        })
        .catch((error) => {
          console.error("Error accessing add user:", error);
        });
    });
  }

  // 3. Management
  if (manageBtn) {
    manageBtn.addEventListener("click", toggleManagementView);
  }

  // 3.1. Admin
  if (adminBtn) {
    adminBtn.addEventListener("click", toggleAdminView);
  }

  // 4. Profil (MODAL PROFIL)
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      openProfileModal();
      toggleBodyScroll(true);
    });
  }

  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener("click", () => {
      if (profileModal) profileModal.classList.add("hidden");
      toggleBodyScroll(false);
    });
  }

  // Penutupan Modal ketika klik di luar modal (backdrop)
  if (profileModal) {
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) {
        profileModal.classList.add("hidden");
        toggleBodyScroll(false);
      }
    });
  }

  // 4.1. Update Nama Toko
  if (updateShopForm) {
    updateShopForm.addEventListener("submit", handleUpdateShopName);
  }

  // 4.2. Update Kontak & Alamat
  if (updateContactForm) {
    updateContactForm.addEventListener("submit", handleUpdateContact);
  }

  // 4.3. Update Sandi
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener("submit", handleUpdatePassword);
  }

  // 5. Toggle Password Visibility (Profile)
  if (togglePasswordBtn && newPasswordInput) {
    togglePasswordBtn.addEventListener(
      "click",
      handleToggleProfilePasswordClick
    );
  }

  // 6. Toggle Password Visibility (Form Login)
  if (toggleAuthPasswordBtn && authPasswordInput) {
    toggleAuthPasswordBtn.addEventListener(
      "click",
      handleToggleAuthPasswordClick
    );
  }

  // 7. Tombol Kembali ke Daftar Produk (Detail View)
  if (backToProductsBtn) {
    backToProductsBtn.addEventListener("click", handleBackToProductsClick);
  }

  // 8. Tombol Kuantitas Produk (Detail View)
  if (qtyIncrementBtn) {
    qtyIncrementBtn.addEventListener("click", () => handleQuantityChange(true));
  }
  if (qtyDecrementBtn) {
    qtyDecrementBtn.addEventListener("click", () =>
      handleQuantityChange(false)
    );
  }

  if (qtyDecrementBtn && productQuantityInput) {
    qtyDecrementBtn.disabled = parseInt(productQuantityInput.value) === 1;
  }

  // 9. Tombol Beli Sekarang (Detail View) -> Pindah ke Order Form
  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", handleMoveToOrderView);
  }

  // 10. Tombol Keranjang (Membuka Tampilan Keranjang)
  if (cartBtn) {
    cartBtn.addEventListener("click", handleCartClick);
  }

  // 10.1. Tombol Kembali ke Daftar Produk dari Keranjang
  if (backToProductsFromCartBtn) {
    backToProductsFromCartBtn.addEventListener(
      "click",
      handleBackToProductsClick
    );
  }
  // 10.2. Tombol Tambah ke Keranjang (Detail View)
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", (e) => {
      // 1. Memicu logika penambahan keranjang (yang sudah ada)
      handleAddToCartFromDetail(e);

      // 2. Panggil animasi, menggunakan elemen yang diklik sebagai posisi awal
      // Ini akan memicu updateCartCountBadge() dan shake setelah 1.2 detik.
      triggerFlyToCartAnimation(e.currentTarget);

      // 🔥 HAPUS: updateCartCountBadge() di sini, karena sudah dipanggil di dalam animasi 🔥
      // updateCartCountBadge();
    });
  }

  // B. Tambahkan Penanganan untuk Tombol List (BARU)
  // Anda harus menambahkan ini di file JS utama Anda, di mana Anda membuat kartu produk.
  // Karena tombol list dibuat secara dinamis, Anda harus menggunakan Event Delegation
  // atau memastikan event listener ditambahkan saat produk di-render.

  // 10.3. Tombol Lanjutkan ke Checkout (Dari Keranjang)
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", handleCheckoutClick);
  }

  // Contoh Event Delegation (Asumsi productListDiv adalah kontainer utama)
  if (productListDiv) {
    productListDiv.addEventListener("click", (e) => {
      // 1. Cek jika elemen yang diklik atau salah satu parent-nya memiliki kelas 'add-to-cart-btn-list'
      const listBtn = e.target.closest(".add-to-cart-btn-list");

      if (listBtn) {
        e.preventDefault();

        // Debug: Verifikasi tombol yang diklik
        // console.log("Tombol List View yang diklik:", listBtn);

        // 2. Ambil data produk (jika diperlukan oleh handleAddToCartFromList)
        const productId = listBtn.getAttribute("data-product-id");
        const ownerId = listBtn.getAttribute("data-owner-id");

        // 3. 🔥 Panggil fungsi penambahan ke keranjang (Logika Bisnis) 🔥
        // Catatan: Pastikan fungsi ini memanggil addToCart(product, 1)
        // handleAddToCartFromList(productId, ownerId);

        // *******************************************************************
        // Karena Anda perlu objek produk lengkap, pastikan Anda memanggil fungsi
        // yang mengembalikan objek produk lengkap sebelum addToCart.
        // Di sini kita asumsikan bisnis logic dipanggil:
        // handleAddToCartFromList(productId, ownerId);
        // *******************************************************************

        // 4. 🔥 Panggil Animasi Terbang (Menggunakan tombol yang diklik) 🔥
        // Ini akan menghitung posisi awal dengan benar.
        triggerFlyToCartAnimation(listBtn);

        // 🔥 HAPUS PEMANGGILAN INI 🔥
        // updateCartCountBadge();
        // Update count akan dipanggil oleh triggerFlyToCartAnimation(listBtn) setelah 1.2 detik.
      }
    });
  }
});

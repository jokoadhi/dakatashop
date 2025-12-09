/**
 * =================================================================
 * SCRIPT.JS - MULTI-SELLER E-COMMERCE LOGIC LENGKAP (VERSI FINAL)
 * =================================================================
 */

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

// 🔥 VARIABEL INPUT AUTH KHUSUS REGISTER 🔥
let authRoleGroup, authRoleInput;
let authPhoneInput, authAddressInput;
let authPhoneGroup, authAddressGroup; // Container div

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

// Struktur Data Keranjang
let cart = []; // Array untuk menyimpan objek item { produkId, nama, harga, kuantitas }

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
  if (!productListDiv) return;

  try {
    // 🔥 LOGIKA PENGGANTIAN JUDUL 🔥
    if (
      typeof productListTitleElement !== "undefined" &&
      productListTitleElement
    ) {
      if (currentUser) {
        productListTitleElement.textContent = "Daftar Produk";
      } else {
        productListTitleElement.textContent = "Pilihan Produk";
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

    // FIX: Mengubah grid-cols-1 menjadi grid-cols-2 sebagai default untuk mobile/small screens
    productListDiv.className =
      "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

    // ------------------------------------------------------
    // 🔥 PERUBAHAN: Iterasi dan Tambahkan Listener Keranjang
    // ------------------------------------------------------
    products.forEach((product) => {
      product.shopName = sellerNamesMap[product.ownerId] || "Toko Unknown";

      // Asumsi: createProductCard(product) mengembalikan elemen HTML kartu
      const productElement = createProductCard(product);
      productListDiv.appendChild(productElement);

      // --- PASANG LISTENER KERANJANG DI SINI ---

      // 1. Dapatkan tombol Keranjang. (ID harus diset di fungsi createProductCard)
      const cartButton = productElement.querySelector(
        `#add-to-cart-${product.id}`
      );

      if (cartButton) {
        cartButton.addEventListener("click", (e) => {
          e.stopPropagation(); // Mencegah klik dari tombol memicu handleProductDetailClick

          // 2. Panggil fungsi addToCart dengan produk ini dan kuantitas 1
          addToCart(product, 1);
        });
      }
      // ------------------------------------------
    });
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
  detailProductName.textContent = "Memuat...";
  detailProductPrice.textContent = "Rp 0";
  detailProductDescription.textContent = "Sedang memuat deskripsi...";
  detailShopNameText.textContent = "Toko Rahasia";

  // 🔥 INISIALISASI ELEMEN ALAMAT TEKS (Sudah ada di dalam fungsi)
  const detailShopAddressText = document.getElementById(
    "detail-shop-address-text"
  );
  // 💡 INISIALISASI ELEMEN WRAPPER/KONTAINER ALAMAT (Sudah ada di dalam fungsi)
  const detailShopAddressWrapper = document.getElementById(
    "detail-shop-address-wrapper"
  );

  if (detailShopAddressText)
    detailShopAddressText.textContent = "Memuat Alamat...";

  detailProductImage.src =
    "https://via.placeholder.com/600x400.png?text=Memuat...";
  if (detailOwnerMessage) detailOwnerMessage.classList.add("hidden");

  if (mainBanner) mainBanner.classList.add("hidden");

  if (productQuantityInput) productQuantityInput.value = 1;
  if (qtyDecrementBtn) qtyDecrementBtn.disabled = true;
  if (qtyIncrementBtn) qtyIncrementBtn.disabled = false;

  if (detailStockInfo)
    detailStockInfo.textContent = "Stok: Sedang diperiksa...";

  const actionButtons = document.getElementById("detail-action-buttons");
  const quantityControlsWrapper = document.getElementById("detail-qty-control");

  // Reset variabel global yang digunakan untuk pemesanan setiap kali produk baru dimuat
  currentProductDetail = null;
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
    // 🔥 AMBIL DATA ALAMAT
    const shopAddress = sellerData.address || "Lokasi tidak tersedia.";
    // 🔥 AMBIL DATA PHONE PENJUAL
    const sellerPhone = sellerData.phone || null;

    const price =
      typeof product.harga === "number"
        ? product.harga
        : parseInt(product.harga) || 0;
    const isOwner = currentUser && product.ownerId === currentUser.uid;

    // 🔥 PENGISIAN VARIABEL GLOBAL UNTUK FUNGSI ORDER (handleMoveToOrderView)
    currentProductDetail = {
      ...product, // Salin semua data produk
      id: productDoc.id,
      price: price, // Pastikan harga sudah terformat sebagai angka
      shopName: shopName,
    };
    currentSellerPhone = sellerPhone; // Simpan nomor telepon penjual

    // --- UPDATE DATA PRODUK KE DOM ---
    detailProductName.textContent = product.nama;
    detailProductPrice.textContent = `Rp ${price.toLocaleString("id-ID")}`;
    detailProductDescription.textContent =
      product.deskripsi || "Tidak ada deskripsi tersedia.";

    detailProductImage.src =
      product.imageUrl || "https://picsum.photos/600/400?grayscale&blur=2";
    detailProductImage.alt = product.nama;

    detailShopNameText.textContent = shopName;

    // --- LOGIKA KEPEMILIKAN (PENJUAL) ---
    if (isOwner) {
      // Penjual (Pemilik Produk)
      if (detailOwnerMessage) {
        detailOwnerMessage.textContent =
          "Anda adalah pemilik produk ini. Hanya menampilkan informasi inventaris.";
        detailOwnerMessage.classList.remove("hidden");
      }

      // Sembunyikan elemen pembelian
      if (actionButtons) actionButtons.classList.add("hidden");
      if (quantityControlsWrapper)
        quantityControlsWrapper.classList.add("hidden");

      // Sembunyikan seluruh blok alamat di mode Penjual
      if (detailShopAddressWrapper) {
        detailShopAddressWrapper.classList.add("hidden");
      }

      // Tampilkan Informasi Stok untuk Penjual
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

      // TAMPILKAN SELURUH BLOK ALAMAT (IKON + TEKS) UNTUK PEMBELI/PUBLIK
      if (detailShopAddressWrapper) {
        detailShopAddressWrapper.classList.remove("hidden");
      }

      // TAMPILKAN TEKS ALAMAT TOKO
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
        // Jika stok habis ATAU nomor penjual tidak ada, disable order
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
    detailProductName.textContent = "Gagal Memuat Produk";
    detailProductDescription.textContent = "Terjadi kesalahan koneksi.";
    detailProductImage.src =
      "https://via.placeholder.com/600x400.png?text=Error";
    // Sembunyikan wrapper saat error
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

  // Pastikan product.ownerId ada untuk item keranjang
  const ownerId = product.ownerId || null;

  const price =
    typeof product.harga === "number"
      ? product.harga
      : parseInt(product.harga) || 0;

  const isOwner = currentUser && ownerId === currentUser.uid;
  const shopName = product.shopName || "Toko Terpercaya";

  const ownerControls = isOwner
    ? `
        <div class="mt-3 flex space-x-2 border-t border-gray-100 pt-3">
            <button data-id="${product.id}" class="edit-btn text-xs font-semibold text-blue-500 hover:text-blue-700">Edit</button>
            <button data-id="${product.id}" class="delete-btn text-xs font-semibold text-red-500 hover:text-red-700">Hapus</button>
        </div>
    `
    : "";

  // 🔥 Tombol Keranjang: Tambahkan data-owner-id untuk referensi
  const cartButton = isOwner
    ? ""
    : `
      <button 
          type="button"
          data-product-id="${product.id}"
          data-owner-id="${ownerId}" 
          class="add-to-cart-btn-list w-full bg-yellow-400 text-gray-900 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-500 transition duration-200 shadow-sm"
      >
          Keranjang
      </button>
  `;

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
    const deleteBtn = card.querySelector(".delete-btn");
    const editBtn = card.querySelector(".edit-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteProduct);
    if (editBtn) editBtn.addEventListener("click", handleEditClick);
  } else {
    // 🔥 TAMBAHKAN LISTENER UNTUK TOMBOL KERANJANG DI LIST
    const listCartBtn = card.querySelector(".add-to-cart-btn-list");
    if (listCartBtn) {
      listCartBtn.addEventListener("click", (e) => {
        // Karena kita ada di loop createProductCard, kita dapat meneruskan objek produk lengkap
        handleAddToCartFromList(product);
      });
    }
  }

  // Listener untuk menampilkan detail produk (ditinggalkan karena sudah benar)
  card.addEventListener("click", (e) => {
    const targetClasses = e.target.classList;
    if (
      targetClasses.contains("edit-btn") ||
      targetClasses.contains("delete-btn") ||
      targetClasses.contains("add-to-cart-btn-list")
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
 * Memuat preferensi tema yang tersimpan di localStorage atau dari preferensi sistem.
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
  // 2. Cek Preferensi Sistem jika belum ada (hanya saat pertama kali)
  else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    body.classList.add("dark-mode");
    themeToggle.checked = true;
    // Simpan preferensi ini agar tidak perlu mengecek OS lagi
    localStorage.setItem(STORAGE_KEY, "dark");
  } else {
    // Default ke light mode dan simpan
    localStorage.setItem(STORAGE_KEY, "light");
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
  if (user) {
    currentUser = user;
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

    if (mainBanner) mainBanner.classList.add("hidden");

    // --- TAMPILAN HEADER (Login/Logout & Profil) ---
    authBtn.textContent = `Hai, ${user.email.split("@")[0]} (Logout)`;
    authBtn.classList.remove(
      "bg-gold-accent",
      "text-navy-blue",
      "hover:bg-white"
    );
    authBtn.classList.add("bg-red-500", "text-white", "hover:bg-red-600");

    if (profileBtn) profileBtn.classList.remove("hidden");

    // --- TAMPILAN SELLER CONTROLS CARD ---
    if (sellerControls) {
      sellerControls.classList.remove("hidden");
      sellerGreeting.textContent = `Halo, ${shopName}!`;
    }

    // LOGIKA KHUSUS ADMIN (BERDASARKAN ROLE)
    if (adminBtn) {
      if (userRole === "admin") {
        adminBtn.classList.remove("hidden");
        if (addUserBtn) addUserBtn.classList.remove("hidden");

        // 🔥 FIX BUG TOMBOL ADMIN:
        // Saat Admin login/re-auth, pastikan teks tombol kembali ke default
        adminBtn.textContent = "Admin (Pelanggan)";

        // Pastikan Admin View tersembunyi, dan Produk View aktif
        if (adminView) adminView.classList.add("hidden");
        if (productListWrapper) productListWrapper.classList.remove("hidden");
      } else {
        adminBtn.classList.add("hidden");
        if (adminView) adminView.classList.add("hidden");
        if (addUserBtn) addUserBtn.classList.add("hidden");
      }
    }

    // Pastikan Management dan Admin View tersembunyi
    if (managementView) managementView.classList.add("hidden");
    if (adminView) adminView.classList.add("hidden");

    // Pastikan productListWrapper terlihat, karena ini adalah default home screen
    if (productListWrapper) productListWrapper.classList.remove("hidden");

    if (manageBtn)
      manageBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
        </svg>
        Management
    `;

    if (salesChartInstance) {
      salesChartInstance.destroy();
    }
  } else {
    currentUser = null;

    if (mainBanner) mainBanner.classList.remove("hidden");

    // --- TAMPILAN HEADER (Masuk) ---
    // Menggunakan display: inline-block; style inline dan menghapus whitespace.
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
    authBtn.classList.add("bg-gold-accent", "text-navy-blue", "hover:bg-white");

    if (profileBtn) profileBtn.classList.add("hidden");

    // --- SEMBUNYIKAN SELLER CONTROLS CARD & MANAGEMENT VIEW ---
    if (sellerControls) sellerControls.classList.add("hidden");
    if (managementView) managementView.classList.add("hidden");
    if (adminView) adminView.classList.add("hidden");
    if (adminBtn) adminBtn.classList.add("hidden");
    if (addUserBtn) addUserBtn.classList.add("hidden");

    if (productListWrapper) productListWrapper.classList.remove("hidden");
  }

  isInitialLoad = false;
  loadProducts();
});

function handleAddToCartFromList(product) {
  // Memanggil fungsi addToCart dengan kuantitas default 1
  // addToCart akan menangani pengambilan sellerPhone secara async dari product.ownerId
  addToCart(product, 1);
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
  const harga = parseInt(document.getElementById("product-harga").value);
  const deskripsi = document.getElementById("product-desc").value;
  const stock = parseInt(document.getElementById("product-stock").value || 0);

  const fileFromInput = productImageFile.files[0];
  const fileToProcess = croppedFileBlob || fileFromInput;

  // Ambil URL gambar lama dari pratinjau sebelum set loading
  const oldImageUrl = isEditing ? imagePreview.src : null; // Digunakan jika user tidak mengupload file baru

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

  if (!isEditing && !fileToProcess) {
    uploadError.textContent = "Anda harus memilih foto produk.";
    uploadError.classList.remove("hidden");
    return;
  }

  // Jika mengedit, dan tidak ada file baru/crop, pastikan ada URL gambar lama
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
      imageUrl = oldImageUrl; // Menggunakan variabel yang sudah diambil di awal
    } else {
      // Seharusnya tidak terjadi karena sudah dicek di atas, tapi untuk keamanan
      throw new Error("Produk baru memerlukan gambar.");
    }

    const productData = {
      nama: nama,
      harga: harga,
      deskripsi: deskripsi,
      stock: stock,
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

    // --- RESET UI SETELAH BERHASIL ---
    uploadForm.reset();

    // 🔥 PENTING: Bersihkan pratinjau gambar dan sembunyikan
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
    // Jika error terjadi setelah upload gambar, pastikan error ditangkap
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
function toggleManagementView() {
  // 1. Cek User Login
  if (!currentUser) return;

  // 🔥 Pengecekan KRITIS untuk Error DOM (Disertai DEBUG Log)
  // Menggunakan productListWrapperElement sesuai inisialisasi DOM Anda
  if (!managementView || !productListWrapperElement || !manageBtn) {
    console.error(
      "Error DOM: Salah satu elemen manajemen tidak ditemukan (managementView, productListWrapperElement, atau manageBtn)."
    );
    // Tambahkan log detail untuk melacak variabel mana yang null
    console.error(
      "DEBUG Check: managementView:",
      managementView,
      "productListWrapperElement:",
      productListWrapperElement,
      "manageBtn:",
      manageBtn
    );
    return;
  }

  // Asumsi: Kita perlu memverifikasi peran user sebelum menampilkan management view
  // Jika getSellerData tidak dibutuhkan, Anda bisa menghapus .then().catch() ini
  getSellerData(currentUser.uid)
    .then((sellerData) => {
      // Hanya izinkan akses jika role adalah seller atau admin
      if (sellerData.role !== "seller" && sellerData.role !== "admin") return;

      // 2. Logika Toggle View
      if (managementView.classList.contains("hidden")) {
        // --- MASUK KE TAMPILAN MANAGEMENT ---
        managementView.classList.remove("hidden");
        productListWrapperElement.classList.add("hidden"); // 🔥 DIGANTI

        // Sembunyikan Admin View jika ada (adminView sudah diperiksa di inisialisasi)
        if (adminView) adminView.classList.add("hidden");

        // Atur Tombol Admin (kembalikan ke mode Admin/Pelanggan)
        if (adminBtn) {
          adminBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Admin (Pelanggan)
        `;
        }

        // Ubah Teks Tombol Management menjadi 'Lihat Produk'
        manageBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 4v1h10V7H5zm0 3v1h10v-1H5zm0 3v1h10v-1H5z" clip-rule="evenodd" />
            </svg>
            Lihat Produk
        `;

        loadTransactionHistory(); // Asumsi fungsi ini memuat data transaksi/grafik
      } else {
        // --- KELUAR DARI TAMPILAN MANAGEMENT (KEMBALI KE PRODUK) ---
        managementView.classList.add("hidden");
        productListWrapperElement.classList.remove("hidden"); // 🔥 DIGANTI

        // Kembalikan Teks Tombol Management ke 'Management'
        manageBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
            </svg>
            Management
        `;
      }
    })
    .catch((error) => {
      console.error("Error checking role for Management View:", error);
    });
}

async function loadTransactionHistory() {
  if (!currentUser) return;

  transactionHistory.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Memuat riwayat transaksi...</td></tr>`;

  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - currentPeriodFilter);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // --- SIMULASI DATA TRANSAKSI INTERNAL ---
  // (Data simulasi tetap sama seperti di segmen Anda)
  const simulatedTransactions = [
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

  const filteredTransactions = simulatedTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= today;
  });

  let saldo = 0;
  let terjual = 0;
  let totalTx = 0;

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
      const email = data.email || "Email Tidak Diketahui";

      const userRole = data.role || "biasa";
      const phone = data.phone || "-";
      const address = data.address || "-";

      const lastLogin = data.lastLogin
        ? new Date(data.lastLogin.toDate()).toLocaleString()
        : "-";

      const isDakata = userRole === "admin";
      const isSelf = currentUser.uid === uid;

      const deleteButton =
        isDakata || isSelf
          ? '<button class="text-red-300 cursor-not-allowed text-xs" disabled>Hapus</button>'
          : `<button data-uid="${uid}" data-email="${email}" class="delete-user-btn text-red-600 hover:text-red-800 font-semibold text-xs">Hapus</button>`;

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
                        ${deleteButton}
                    </td>
                </tr>
            `;
    });

    customerListTableBody.innerHTML = rows.join("");

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

function loadOrderSummaryFromCart(cartItems) {
  // 1. Ambil elemen DOM
  const summaryListWrapper = document.getElementById("order-product-summary");
  const totalElement = document.getElementById("order-total-price");
  const backButton = document.getElementById("back-to-detail-btn");

  if (!summaryListWrapper || !totalElement || !backButton) {
    console.error("Salah satu elemen DOM ringkasan pesanan tidak ditemukan.");
    Swal.fire(
      "Error",
      "Komponen tampilan checkout tidak lengkap. Cek ID elemen HTML.",
      "error"
    );
    return;
  }

  // 2. Kustomisasi Tampilan untuk Checkout Keranjang (Multi-Item)

  // a. 🔥 HANYA PENTING: Panggil setupBackToButtonListener() yang akan mengatur teks dan handler.
  //    Tidak perlu logika replace teks di sini, biarkan setupBackToButtonListener yang menangani.

  // b. Inisialisasi variabel total
  let grandTotal = 0;

  // c. Buat wadah UL baru untuk daftar item
  const ulList = document.createElement("ul");
  ulList.className = "space-y-2 mt-2";

  // --- 3. RENDER DAFTAR PRODUK ---

  cartItems.forEach((item) => {
    const itemPrice = Number(item.price) || 0;
    const itemTotal = itemPrice * item.quantity;
    grandTotal += itemTotal;

    const itemElement = document.createElement("li");
    itemElement.className =
      "flex justify-between items-center text-sm border-b border-red-200/50 pb-1";
    itemElement.innerHTML = `
            <div class="flex flex-col">
                <p class="font-semibold text-gray-800 line-clamp-1">${
                  item.nama
                }</p>
                <p class="text-xs text-gray-500">${
                  item.quantity
                } x Rp ${itemPrice.toLocaleString("id-ID")}</p>
            </div>
            <span class="font-bold text-red-700 whitespace-nowrap ml-4">
                Rp ${itemTotal.toLocaleString("id-ID")}
            </span>
        `;
    ulList.appendChild(itemElement);
  });

  // 4. Ganti isi order-product-summary dengan daftar multi-item
  summaryListWrapper.innerHTML = "";
  summaryListWrapper.appendChild(ulList);

  // 5. Perbarui Total Harga
  const finalTotal = grandTotal;
  totalElement.textContent = `Total: Rp ${finalTotal.toLocaleString("id-ID")}`;

  console.log(
    `Checkout multi-item berhasil dimuat. ${
      cartItems.length
    } produk. Total: Rp ${grandTotal.toLocaleString("id-ID")}`
  );

  // 🔥 PANGGIL FUNGSI SETUP LISTENER DI AKHIR (Ini sudah benar)
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
// Fungsi ASYNC untuk menambahkan produk ke keranjang
async function addToCart(product, quantity = 1) {
  if (!product || !product.id || !product.ownerId) {
    // Wajibkan ownerId
    Swal.fire("Error", "Data produk atau pemilik tidak valid.", "error");
    return;
  }

  const rawPrice = product.price || product.harga;
  const productPrice = Number(rawPrice) || 0;

  const productImageURL =
    product.image || product.imageUrl || "https://via.placeholder.com/64";

  // --- 1. TENTUKAN SHOP NAME DAN PHONE (ASYNC) ---
  const shopNameSource = product.shopName || "Toko";
  let finalSellerPhone = null;

  try {
    // Ambil data penjual dari ownerId
    const sellerData = await getSellerData(product.ownerId);
    finalSellerPhone = sellerData.phone || null; // Ambil nomor HP dari database
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
  const existingItem = cart.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    // Jika item baru, masukkan ke keranjang
    cart.push({
      productId: product.id,
      nama: product.nama,
      price: productPrice,
      shopName: shopNameSource,
      // 🔥 SIMPAN NOMOR HP YANG SUDAH DIAMBIL DARI DATABASE
      shopPhone: finalSellerPhone,
      image: productImageURL,
      quantity: quantity,
    });
  }

  updateCartCount();

  Swal.fire({
    icon: "success",
    title: "Ditambahkan ke Keranjang!",
    text: `${product.nama} (x${quantity}) berhasil ditambahkan.`,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
  });
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

  if (!currentOrderProductDetail) {
    Swal.fire("Error", "Detail produk tidak ditemukan.", "error");
    return;
  }

  const { nama, price } = currentOrderProductDetail;
  const total = price * quantity;

  // Format harga
  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // 3. Isi ringkasan di Order View
  if (orderProductSummary)
    orderProductSummary.textContent = `${nama} (x ${quantity})`;
  if (orderTotalPrice)
    orderTotalPrice.textContent = `Total: ${formatIDR(total)}`;
  if (orderError) orderError.classList.add("hidden");

  // 4. Alihkan View
  if (productDetailView) productDetailView.classList.add("hidden");
  if (orderDetailView) orderDetailView.classList.remove("hidden");

  // 🔥 SET FLAG UNTUK SINGLE ITEM CHECKOUT
  isMultiItemCheckout = false;
  setupBackToButtonListener(); // Update tombol kembali ke mode Detail Produk

  // Pastikan input nama/alamat pembeli direset atau dikosongkan saat view dipindahkan
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
/**
 * Menangani submit formulir pesanan dan membuat link WhatsApp.
 */
function handleOrderSubmit(e) {
  e.preventDefault();
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

  // --- 2. TENTUKAN PRODUK DAN TOTAL ---
  let orderItems = [];
  let total = 0;

  if (isMultiItemCheckout) {
    // Mode Multi-Item (Checkout dari Keranjang)
    orderItems = cart;
    total = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  } else {
    // Mode Single Item (Beli Sekarang)
    if (
      !currentOrderProductDetail ||
      !currentOrderSellerPhone ||
      !currentOrderQuantity
    ) {
      Swal.fire(
        "Error",
        "Data produk/penjual hilang. Coba muat ulang halaman atau ulangi proses beli.",
        "error"
      );
      return;
    }
    orderItems.push({
      nama: currentOrderProductDetail.nama,
      price: currentOrderProductDetail.price,
      quantity: currentOrderQuantity,
      shopName: currentOrderProductDetail.shopName,
      shopPhone: currentOrderSellerPhone, // Ambil dari variabel global
    });
    total = currentOrderProductDetail.price * currentOrderQuantity;
  }

  // Pastikan keranjang/item tidak kosong
  if (orderItems.length === 0) {
    Swal.fire("Error", "Keranjang kosong. Tidak ada yang dipesan.", "warning");
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

  // --- 5. FORMAT HARGA ---
  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // --- 6. SUSUN PESAN WHATSAPP ---
  let itemDetails = orderItems
    .map(
      (item) =>
        `* ${item.nama} (x${item.quantity}) - ${formatIDR(
          item.price * item.quantity
        )}`
    )
    .join("\n");

  const message = `[PESANAN DAKATA SHOP]
Halo ${shopName}, saya ingin membuat pesanan:

*PRODUK:*
${itemDetails}
*Total Biaya:* ${formatIDR(total)}

*DETAIL PEMBELI:*
Nama: ${buyerName}
No. HP: ${buyerPhoneRaw}
Alamat: ${buyerAddress}

Mohon konfirmasi ketersediaan produk dan instruksi pembayarannya. Terima kasih!`;

  // --- 7. ARAHKAN KE WHATSAPP (PERBAIKAN NOTIFIKASI DAN RESET VIEW) ---
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank");

  isOrderSent = true;

  // 🔥 NOTIFIKASI MODAL STANDAR DENGAN CALLBACK .then()
  Swal.fire({
    icon: "success",
    title: "Pesanan Berhasil Dibuat!",
    text: "Anda telah diarahkan ke WhatsApp. Tekan 'Lanjutkan' untuk kembali ke toko.",
    showConfirmButton: true, // Tampilkan tombol
    confirmButtonText: "Lanjutkan",
    allowOutsideClick: false, // Mencegah user menutup tanpa mengklik tombol
  }).then((result) => {
    // Logic RESET STATE dipindahkan ke dalam callback ini
    if (result.isConfirmed) {
      if (isMultiItemCheckout) {
        cart = [];
        updateCartCount();
      }

      // 🔥 RESET VIEW: Kembali ke daftar produk utama
      handleBackToProductsClick();

      // Pastikan orderDetailView disembunyikan
      if (orderDetailView) orderDetailView.classList.add("hidden");
    }
  });
  // ----------------------------------------------------

  // --- 8. RESET STATE (DIHAPUS/TIDAK DIGUNAKAN LAGI) ---
  // Logika reset state yang lama telah dipindahkan dan disempurnakan di dalam .then()
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

  // 0. Dark Mode Toggle
  if (themeToggle) {
    // Cek apakah elemen ditemukan
    // 🔥 PENTING: Gunakan event 'change' karena ini adalah checkbox.
    themeToggle.addEventListener("change", toggleTheme);
  }

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
        toggleBodyScroll(true); // <-- KUNCI SCROLL
      }
    });
  }
  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener("click", () => {
      if (uploadModal) uploadModal.classList.add("hidden");
      toggleBodyScroll(false); // <-- BUKA SCROLL

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
            toggleBodyScroll(true); // <-- KUNCI SCROLL
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
      toggleBodyScroll(false); // <-- BUKA SCROLL

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
          toggleBodyScroll(true); // <-- KUNCI SCROLL
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
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (authModal) authModal.classList.add("hidden");
      toggleBodyScroll(false); // <-- BUKA SCROLL

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
          toggleBodyScroll(false); // <-- BUKA SCROLL
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
            toggleBodyScroll(true); // <-- KUNCI SCROLL

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
      toggleBodyScroll(true); // <-- KUNCI SCROLL
    });
  }

  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener("click", () => {
      if (profileModal) profileModal.classList.add("hidden");
      toggleBodyScroll(false); // <-- BUKA SCROLL
    });
  }

  // Penutupan Modal ketika klik di luar modal (backdrop)
  if (profileModal) {
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) {
        profileModal.classList.add("hidden");
        toggleBodyScroll(false); // <-- BUKA SCROLL
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
    addToCartBtn.addEventListener("click", handleAddToCartFromDetail);
  }

  // 10.3. Tombol Lanjutkan ke Checkout (Dari Keranjang)
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", handleCheckoutClick);
  }

  // 11. Tombol Order Sekarang (Order Form Submit)
  if (orderForm) {
    orderForm.addEventListener("submit", handleOrderSubmit);
  }

  // 12. Tombol Kembali dari Order View (Mode Single Item)
  // 🔥 DIHILANGKAN: Listener di sini akan ditimpa oleh setupBackToButtonListener()
  // Biarkan setupBackToButtonListener() yang bertanggung jawab penuh atas tombol ini.
});

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

    // 🔥 FIX: Mengubah grid-cols-1 menjadi grid-cols-2 sebagai default untuk mobile/small screens
    productListDiv.className =
      "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

    products.forEach((product) => {
      product.shopName = sellerNamesMap[product.ownerId] || "Toko Unknown";
      const productElement = createProductCard(product);
      productListDiv.appendChild(productElement);
    });
  } catch (error) {
    console.error("Error memuat produk: ", error);
    productListDiv.innerHTML =
      '<p class="text-center col-span-full text-xl py-10 text-red-500">Koneksi ke database gagal. Periksa Firebase atau jaringan Anda.</p>';
  }
}

function handleBackToProductsClick() {
  if (productDetailView) productDetailView.classList.add("hidden");
  if (managementView) managementView.classList.add("hidden");
  if (adminView) adminView.classList.add("hidden");

  if (productListWrapperElement)
    productListWrapperElement.classList.remove("hidden");

  const isSellerLoggedIn = currentUser && sellerControls;

  if (isSellerLoggedIn) {
    if (mainBanner) mainBanner.classList.add("hidden");
  } else {
    if (mainBanner) mainBanner.classList.remove("hidden");
  }

  if (manageBtn) {
    manageBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
        </svg>
        Management
    `;
  }

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

async function loadProductDetails(productId) {
  // --- INISIALISASI TAMPILAN AWAL ---
  detailProductName.textContent = "Memuat...";
  detailProductPrice.textContent = "Rp 0";
  detailProductDescription.textContent = "Sedang memuat deskripsi...";
  detailShopNameText.textContent = "Toko Rahasia";

  // 🔥 INISIALISASI ELEMEN ALAMAT TEKS
  const detailShopAddressText = document.getElementById(
    "detail-shop-address-text"
  );
  // 💡 INISIALISASI ELEMEN WRAPPER/KONTAINER ALAMAT (Termasuk Ikon)
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
  const quantityControlsWrapper = document.getElementById("detail-qty-control"); // Asumsi ID kontrol kuantitas adalah detail-qty-control

  try {
    const productDoc = await db.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      detailProductName.textContent = "Produk Tidak Ditemukan";
      if (detailStockInfo) detailStockInfo.textContent = "Stok: N/A";
      // ✅ LOGIKA: Sembunyikan wrapper jika produk tidak ditemukan
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

    const price =
      typeof product.harga === "number"
        ? product.harga
        : parseInt(product.harga) || 0;
    const isOwner = currentUser && product.ownerId === currentUser.uid;

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

      // ✅ LOGIKA: SEMBUNYIKAN SELURUH BLOK ALAMAT (IKON + TEKS) DI MODE PENJUAL
      if (detailShopAddressWrapper) {
        detailShopAddressWrapper.classList.add("hidden");
      }
      // Kita tidak perlu lagi mengosongkan teksnya secara terpisah karena wrapper sudah disembunyikan:
      // if (detailShopAddressText) detailShopAddressText.textContent = "";

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

      // ✅ LOGIKA: TAMPILKAN SELURUH BLOK ALAMAT (IKON + TEKS) UNTUK PEMBELI/PUBLIK
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
      if (stok <= 0) {
        if (qtyIncrementBtn) qtyIncrementBtn.disabled = true;
        if (productQuantityInput) productQuantityInput.value = 0;
        if (productQuantityInput) productQuantityInput.disabled = true;
        if (actionButtons) actionButtons.classList.add("hidden");
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

function createProductCard(product) {
  const card = document.createElement("div");
  card.className =
    "product-card bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden flex flex-col h-full cursor-pointer border border-gray-100 flex-shrink-0";

  card.dataset.id = product.id;

  const price =
    typeof product.harga === "number"
      ? product.harga
      : parseInt(product.harga) || 0;

  const isOwner = currentUser && product.ownerId === currentUser.uid;
  const shopName = product.shopName || "Toko Terpercaya";

  const ownerControls = isOwner
    ? `
        <div class="mt-3 flex space-x-2 border-t border-gray-100 pt-3">
            <button data-id="${product.id}" class="edit-btn text-xs font-semibold text-blue-500 hover:text-blue-700">Edit</button>
            <button data-id="${product.id}" class="delete-btn text-xs font-semibold text-red-500 hover:text-red-700">Hapus</button>
        </div>
    `
    : "";

  const cartButton = isOwner
    ? ""
    : `
      <button class="w-full bg-yellow-400 text-gray-900 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-500 transition duration-200 shadow-sm">
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
  }

  card.addEventListener("click", handleProductCardClick);

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
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  } else {
    // Aktifkan kembali scroll utama saat modal tertutup
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
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
  if (!currentUser) return;

  if (managementView.classList.contains("hidden")) {
    // Tampilkan Management View
    managementView.classList.remove("hidden");
    productListWrapper.classList.add("hidden");
    if (adminView) adminView.classList.add("hidden");

    if (adminBtn) {
      adminBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Admin (Pelanggan)
        `;
    }

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
                return "Rp " + (value / 1000000).toFixed(1) + "Jt";
              }
              if (value === 0) return "Rp 0";
              return "Rp " + (value / 1000).toFixed(0) + "k";
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
// BAGIAN 6.5: FUNGSI ADMIN (DAFTAR PELANGGAN)
// -----------------------------------------------------------------

function toggleAdminView() {
  if (!currentUser) return;

  if (!adminView || !productListWrapper || !adminBtn) {
    console.error(
      "Error DOM: Salah satu elemen admin/produk tidak ditemukan (adminView, productListWrapper, atau adminBtn)."
    );
    return;
  }

  getSellerData(currentUser.uid)
    .then((sellerData) => {
      if (sellerData.role !== "admin") return;

      if (adminView.classList.contains("hidden")) {
        adminView.classList.remove("hidden");
        productListWrapper.classList.add("hidden");

        if (managementView && !managementView.classList.contains("hidden")) {
          managementView.classList.add("hidden");
          if (manageBtn) {
            manageBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
                    </svg>
                    Management
                `;
          }
        }

        adminBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 4v1h10V7H5zm0 3v1h10v-1H5zm0 3v1h10v-1H5z" clip-rule="evenodd" />
                </svg>
                Lihat Produk
            `;

        loadCustomerList();
      } else {
        adminView.classList.add("hidden");
        productListWrapper.classList.remove("hidden");

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
// BAGIAN 7: FUNGSI PENGATURAN PROFIL & AKUN
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

/**
 * Membuka modal profil dan mengisi data penjual
 */
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
    // 0. Logging: Mulai pengambilan data
    console.log(
      `DEBUG [Profile]: Memulai pengambilan data penjual untuk UID: ${currentUser.uid}`
    );

    const sellerData = await getSellerData(currentUser.uid);

    if (!sellerData) {
      console.warn(
        `DEBUG [Profile]: Data penjual untuk UID ${currentUser.uid} tidak ditemukan di Firestore.`
      );
      return;
    }

    // 1. Logging: Data berhasil diambil
    console.log("DEBUG [Profile]: Data Penjual berhasil dimuat:", sellerData);

    // 2. Isi input nama toko
    if (shopNameInput) {
      shopNameInput.value = sellerData.shopName || "";
      console.log(
        `DEBUG [Profile]: Mengisi shopNameInput dengan: ${shopNameInput.value}`
      );
    } else {
      console.error(
        "DEBUG [Profile]: shopNameInput tidak ditemukan! Pastikan ID 'shop-name' sudah benar di DOMContentLoaded."
      );
    }

    // 3. Isi input Nomor HP dan Alamat
    if (profilePhoneInput) {
      profilePhoneInput.value = sellerData.phone || "";
      console.log(
        `DEBUG [Profile]: Mengisi profilePhoneInput dengan: ${profilePhoneInput.value}`
      );
    } else {
      console.error(
        "DEBUG [Profile]: profilePhoneInput tidak ditemukan! Pastikan ID 'profile-phone' sudah benar di DOMContentLoaded."
      );
    }

    if (profileAddressInput) {
      profileAddressInput.value = sellerData.address || "";
      console.log(
        `DEBUG [Profile]: Mengisi profileAddressInput dengan: ${profileAddressInput.value}`
      );
    } else {
      console.error(
        "DEBUG [Profile]: profileAddressInput tidak ditemukan! Pastikan ID 'profile-address' sudah benar di DOMContentLoaded."
      );
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
 * Menangani update Nomor HP dan Alamat.
 */
async function handleUpdateContact(e) {
  e.preventDefault();

  if (contactError) contactError.classList.add("hidden");

  // Pastikan variabel DOM sudah terinisialisasi
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

// -----------------------------------------------------------------
// BAGIAN 8: EKSEKUSI AWAL DAN EVENT LISTENERS (KODE UTAMA ANDA)
// -----------------------------------------------------------------

// ***************************************************************
// ASUMSI: Fungsi setAuthModeToRegister/Login dan toggleBodyScroll()
// serta semua fungsi handler (handleSubmitAuth, dll) sudah
// didefinisikan di bagian kode Anda yang lain.
// ***************************************************************

/**
 * [ASUMSI FUNGSI] Mengatur modal ke mode Login dan menonaktifkan mode admin.
 */
function setAuthModeToLogin() {
  // Logika utama Login
  authTitle.textContent = "Masuk Penjual";
  authSubmitBtn.textContent = "Masuk";
  authSubmitBtn.setAttribute("data-action", "login");

  // Sembunyikan field registrasi tambahan
  if (authPhoneGroup) authPhoneGroup.classList.add("hidden");
  if (authAddressGroup) authAddressGroup.classList.add("hidden");
  if (authRoleGroup) authRoleGroup.classList.add("hidden");

  // Tampilkan tautan toggle mode ("Ingin daftar sebagai penjual?...")
  if (toggleAuthMode) toggleAuthMode.classList.remove("hidden"); // <-- KRUSIAL: Ditampilkan
  if (adminRegisterInfo) adminRegisterInfo.classList.add("hidden");

  // Pastikan input sandi ditampilkan (jika Anda memiliki logika untuk menyembunyikannya)
  // if (authPasswordGroup) authPasswordGroup.classList.remove("hidden");
}

/**
 * [ASUMSI FUNGSI] Mengatur modal ke mode Register (Default/Admin).
 * @param {boolean} isAdminMode - True jika mode admin register.
 */
function setAuthModeToRegister(isAdminMode = false) {
  // Logika utama Register
  authTitle.textContent = isAdminMode
    ? "Daftarkan User Baru (Admin Mode)"
    : "Daftar Penjual Baru";
  authSubmitBtn.textContent = "Daftar";
  authSubmitBtn.setAttribute("data-action", "register");

  // Tampilkan field registrasi tambahan jika mode Admin
  if (isAdminMode) {
    if (authPhoneGroup) authPhoneGroup.classList.remove("hidden");
    if (authAddressGroup) authAddressGroup.classList.remove("hidden");
    if (authRoleGroup) authRoleGroup.classList.remove("hidden");

    // 🔥 KRUSIAL: Sembunyikan tautan toggle mode saat Admin Register
    if (toggleAuthMode) toggleAuthMode.classList.add("hidden");
    if (adminRegisterInfo) adminRegisterInfo.classList.remove("hidden");
  } else {
    // Mode Register Biasa (Jika ada, sesuaikan)
    if (authPhoneGroup) authPhoneGroup.classList.add("hidden"); // Contoh: disembunyikan di registrasi biasa
    if (authAddressGroup) authAddressGroup.classList.add("hidden"); // Contoh: disembunyikan
    if (authRoleGroup) authRoleGroup.classList.add("hidden"); // Contoh: disembunyikan

    // Tampilkan tautan toggle mode saat Register Biasa
    if (toggleAuthMode) toggleAuthMode.classList.remove("hidden");
    if (adminRegisterInfo) adminRegisterInfo.classList.add("hidden");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // --- INISIALISASI SEMUA VARIABEL DOM ---
  productListDiv = document.getElementById("product-list");
  mainBanner = document.getElementById("main-banner");
  authBtn = document.getElementById("auth-btn");
  authModal = document.getElementById("auth-modal");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  authSubmitBtn = document.getElementById("auth-submit-btn");
  closeModalBtn = document.getElementById("close-modal-btn");
  authError = document.getElementById("auth-error");

  productListTitleElement = document.getElementById("product-list-header");

  // INISIALISASI VARIABEL AUTH TAMBAHAN
  toggleAuthMode = document.getElementById("toggle-auth-mode");
  toggleAuthLink = document.getElementById("toggle-auth-link");
  adminRegisterInfo = document.getElementById("admin-register-info");

  // INISIALISASI INPUT ROLE
  authRoleGroup = document.getElementById("auth-role-group");
  authRoleInput = document.getElementById("auth-role");

  // INISIALISASI INPUT BARU (NOMOR HP & ALAMAT PADA FORM REGISTRASI)
  authPhoneInput = document.getElementById("auth-phone");
  authAddressInput = document.getElementById("auth-address");
  authPhoneGroup = document.getElementById("auth-phone-group");
  authAddressGroup = document.getElementById("auth-address-group");

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

  // INISIALISASI VARIABEL CROPPER
  imageToCrop = document.getElementById("image-to-crop");
  cropModal = document.getElementById("crop-modal");
  closeCropModalBtn = document.getElementById("close-crop-modal-btn");
  applyCropBtn = document.getElementById("apply-crop-btn");

  // INISIALISASI VARIABEL DETAIL PRODUK
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

  // INISIALISASI VARIABEL KUANTITAS
  qtyDecrementBtn = document.getElementById("qty-decrement");
  qtyIncrementBtn = document.getElementById("qty-increment");
  productQuantityInput = document.getElementById("product-quantity");
  detailStockInfo = document.getElementById("detail-stock-info");
  quantityControlsWrapper = document.getElementById("detail-qty-control");

  // INISIALISASI VARIABEL TOGGLE SANDI LOGIN
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

  // INISIALISASI VARIABEL ADMIN BARU
  adminBtn = document.getElementById("admin-btn");
  adminView = document.getElementById("admin-view");
  customerListTableBody = document.getElementById("customer-list-table-body");
  addUserBtn = document.getElementById("add-user-btn");

  // INISIALISASI VARIABEL PROFIL
  profileBtn = document.getElementById("profile-btn");
  profileModal = document.getElementById("profile-modal");
  closeProfileModalBtn = document.getElementById("close-profile-modal-btn");

  // INISIALISASI FORM NAMA TOKO (Menggunakan ID HTML ASLI: shop-name)
  updateShopForm = document.getElementById("update-shop-form");
  shopNameInput = document.getElementById("shop-name");
  shopNameError = document.getElementById("shop-name-error");
  shopNameSubmitBtn = document.getElementById("shop-name-submit-btn");

  // INISIALISASI FORM KONTAK BARU (Menggunakan ID HTML ASLI: profile-phone, profile-address)
  updateContactForm = document.getElementById("update-contact-form"); // Form baru
  profilePhoneInput = document.getElementById("profile-phone");
  profileAddressInput = document.getElementById("profile-address");
  contactSubmitBtn = document.getElementById("contact-submit-btn"); // Button submit kontak
  contactError = document.getElementById("contact-error"); // Elemen error kontak

  // INISIALISASI FORM SANDI
  updatePasswordForm = document.getElementById("update-password-form");
  newPasswordInput = document.getElementById("new-password");
  passwordError = document.getElementById("password-error");
  passwordSubmitBtn = document.getElementById("password-submit-btn");

  // INISIALISASI VARIABEL TOGGLE SANDI
  togglePasswordBtn = document.getElementById("toggle-password-visibility");
  eyeIconOpen = document.getElementById("eye-icon-open");
  eyeIconClosed = document.getElementById("eye-icon-closed");

  // -----------------------------------------------------------------
  // --- EVENT LISTENERS (DENGAN KUNCI SCROLL) ---
  // -----------------------------------------------------------------

  // 4. Profil (MODAL PROFIL)
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      // 🔥 KRUSIAL: Panggil openProfileModal untuk mengisi data
      openProfileModal();
      // openProfileModal() kini bertugas mengisi data dan membuka modal

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
  // ... (Sisa event listeners tetap sama) ...

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
                // 🔥 FIX BUG RESET TAMPILAN ADMIN SETELAH LOGOUT
                if (adminView) adminView.classList.add("hidden"); // Sembunyikan Admin View
                if (managementView) managementView.classList.add("hidden"); // Sembunyikan Management View
                if (productListWrapperElement)
                  productListWrapperElement.classList.remove("hidden"); // Tampilkan Produk

                // Reset teks tombol Admin ke default
                if (adminBtn) adminBtn.textContent = "Admin (Pelanggan)";
                // Reset teks tombol Manage (jika diperlukan)
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

      // 🔥 PENTING: Reset ke mode Login saat modal ditutup
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

      // Logika ini mengasumsikan tautan toggleAuthLink selalu mengarah ke Hubungi Admin,
      // karena mode registrasi user biasa dihilangkan.
      if (currentAction === "login" || currentAction === "register") {
        const adminNumber = "6285161065796"; // Ganti dengan nomor WhatsApp Admin yang valid
        const message = encodeURIComponent(
          "Halo Admin, saya tertarik untuk mendaftar sebagai penjual di platform Dakata Shop. Bisakah membantu saya mendaftar?"
        );

        const whatsappUrl = `https://wa.me/${adminNumber}?text=${message}`;
        window.open(whatsappUrl, "_blank");

        // 🔥 FIX: Sembunyikan modal setelah membuka WhatsApp
        if (authModal) {
          authModal.classList.add("hidden");
          toggleBodyScroll(false); // <-- BUKA SCROLL
        }

        // Opsional: Reset form dan set mode kembali ke login untuk berjaga-jaga
        if (authForm) {
          authForm.reset();
        }
        setAuthModeToLogin(); // Pastikan tampilan kembali ke login
      }

      // JIKA DI MASA DEPAN ADA REGISTER BIASA LAGI, tambahkan logika toggle di sini.
    });
  }
  // 2.2. Event Listener untuk Tombol 'Tambah User' Admin
  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => {
      getSellerData(currentUser.uid)
        .then((sellerData) => {
          if (sellerData.role !== "admin") return;

          // 🔥 KRUSIAL: Atur modal ke mode register, dan aktifkan mode admin
          setAuthModeToRegister(true);

          if (authModal) {
            authModal.classList.remove("hidden");
            toggleBodyScroll(true); // <-- KUNCI SCROLL

            // Tambahan: Kosongkan form saat mode Add User
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

  // 4. Profil (EVENT YANG SUDAH DISESUAIKAN ADA DI ATAS)

  // 4.1. Update Nama Toko
  if (updateShopForm) {
    updateShopForm.addEventListener("submit", handleUpdateShopName);
  }

  // 4.2. Update Kontak & Alamat 🔥 KRUSIAL BARU 🔥
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

  // Panggil setAuthModeToLogin() secara default saat DOMContentLoaded
  if (authSubmitBtn) {
    setAuthModeToLogin();
  }
});

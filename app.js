// Supabase Configuration
const SUPABASE_URL = "https://ndegekylfrhroyyhumyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hwBUpVWGEoWrQgiiG8ZgBw_ZM_aJyH2";
const MASTER_ADMIN_PIN = "1234";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let roomsData = [];
let favorites = JSON.parse(localStorage.getItem("roomdekho_favs") || "[]");
let myCreatedPins = JSON.parse(localStorage.getItem("roomdekho_mypins") || "[]");

let currentLanguage = localStorage.getItem("roomdekho_lang") || "hi";
let selectedCategory = "All";
let selectedOwnerPhone = null;
let showFavoritesOnly = false;
let showMyListingsOnly = false;

// Gallery Modal State
let currentImages = [];
let currentImageIndex = 0;

// Safe Text Update Helper (Taaki kabhi crash na ho)
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// Translations
const translations = {
  en: {
    langBtn: "हिन्दी",
    subHeader: "Pan-India Direct Space & Room Marketplace",
    heroTitle: "Find Any Room, Flat, Hotel or Commercial Space Across India",
    heroSub: "Zero Brokerage • Direct Owner Contact • Verified Commercial & Residential Listings",
    myListings: "My Listings",
    postBtn: "+ Post Property",
    modalTitle: "Post New Property or Space",
    availableListings: "All India Available Listings",
    rentSuffixMonth: "/month",
    rentSuffixDay: "/day",
    callBtn: "📞 Call",
    waBtn: "💬 WhatsApp",
    mapBtn: "📍 View on Google Maps",
    rentedBadge: "Rented / Booked",
    markRented: "Mark as Rented",
    markAvailable: "Mark Available",
    deleteBtn: "Delete"
  },
  hi: {
    langBtn: "English",
    subHeader: "Poore Bharat Ka Direct Space & Room Marketplace",
    heroTitle: "Poore Bharat Me Kisi Bhi Sheher Me Space Ya Room Dhundhein",
    heroSub: "Zero Brokerage • Direct Owner Contact • Rooms, Flats, Hostels, Hotels, Shops & Commercial Spaces",
    myListings: "Mere Listings",
    postBtn: "+ Property Post Karein",
    modalTitle: "Nayi Property / Space List Karein",
    availableListings: "Bharat Me Uplabdh Sabhi Listings",
    rentSuffixMonth: "/mahina",
    rentSuffixDay: "/din",
    callBtn: "📞 Call Karein",
    waBtn: "💬 WhatsApp",
    mapBtn: "📍 Google Maps Par Rasta Dekhein",
    rentedBadge: "Rented / Full",
    markRented: "Mark as Rented",
    markAvailable: "Mark Available",
    deleteBtn: "Delete Karein"
  }
};

// Fetch All Properties
async function fetchRooms() {
  const container = document.getElementById("roomContainer");
  try {
    const { data, error } = await db.from('rooms').select('*').order('id', { ascending: false });

    if (error) throw error;
    roomsData = data || [];
    
    applyLanguageUI();
    updateHeaderCounts();
    applyFilters();
  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = `<p class="col-span-full text-center text-red-500 py-8 font-medium">Database connect nahi ho paya. Refresh karein.</p>`;
    }
  }
}

function updateHeaderCounts() {
  safeSetText("favCount", favorites.length);
  const myRooms = roomsData.filter(r => myCreatedPins.includes(r.pin));
  safeSetText("myCount", myRooms.length);
}

// Language Switcher
function toggleLanguage() {
  currentLanguage = currentLanguage === "hi" ? "en" : "hi";
  localStorage.setItem("roomdekho_lang", currentLanguage);
  applyLanguageUI();
  applyFilters();
}

function applyLanguageUI() {
  const t = translations[currentLanguage];
  safeSetText("currentLangLabel", t.langBtn);
  safeSetText("langSubHeader", t.subHeader);
  safeSetText("t_hero_title", t.heroTitle);
  safeSetText("t_hero_sub", t.heroSub);
  safeSetText("t_my_listings", t.myListings);
  safeSetText("t_post_btn", t.postBtn);
  safeSetText("t_modal_title", t.modalTitle);
  safeSetText("currentViewTitle", t.availableListings);
}

// Display Cards
function displayRooms(rooms) {
  const container = document.getElementById("roomContainer");
  if (!container) return;

  const t = translations[currentLanguage];
  safeSetText("resultsCount", `${rooms.length} listings`);

  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
        <p class="text-4xl mb-2">🔍</p>
        <p class="text-gray-700 font-bold">${currentLanguage === 'hi' ? 'Koi property ya room nahi mila' : 'No properties found'}</p>
        <p class="text-xs text-gray-400 mt-1">${currentLanguage === 'hi' ? 'Kripya doosra sheher ya category chunein.' : 'Please try another city or category.'}</p>
      </div>`;
    return;
  }

  rooms.forEach(room => {
    const rawPhone = String(room.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const roomUrl = window.location.href.split('?')[0];
    
    const categoryBadge = room.category || "Room";
    const spaceDetail = room.space_size ? `• ${room.space_size}` : '';
    const cityState = `${room.city || ''}${room.state ? ', ' + room.state : ''}`;
    const periodSuffix = room.price_period === 'day' ? t.rentSuffixDay : t.rentSuffixMonth;

    const shareText = encodeURIComponent(`India me ye property dekho: "${room.title}" (${categoryBadge}) - ₹${room.rent}${periodSuffix}. Direct Link: ${roomUrl}`);
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

    const message = encodeURIComponent(`Namaste! Maine RoomDekho par aapka "${room.title}" dekha. Kya ye available hai?`);
    const whatsappContactUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    const callUrl = `tel:+${cleanPhone}`;
    
    const mapsQuery = encodeURIComponent(`${room.location || ''}, ${cityState}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
    const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];

    let imgs = [];
    if (room.images && room.images.length > 0) {
      imgs = room.images;
    } else if (room.image) {
      imgs = [room.image];
    } else {
      imgs = ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'];
    }

    const isFav = favorites.includes(room.id);
    const isMyListing = myCreatedPins.includes(room.pin);
    const ownerTotalListings = roomsData.filter(r => r.phone === room.phone).length;
    const safeImgsString = encodeURIComponent(JSON.stringify(imgs));

    const card = `
      <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-between border border-gray-100 overflow-hidden ${room.is_rented ? 'opacity-65 grayscale' : ''}">
        <div>
          <div class="relative cursor-pointer group" onclick="openGallery('${safeImgsString}')">
            ${room.is_rented 
              ? `<span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase z-10 shadow">${t.rentedBadge}</span>` 
              : `<span class="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-md font-bold z-10 shadow">${categoryBadge}</span>`}

            ${isMyListing ? '<span class="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">Aapki Listing</span>' : ''}
            
            <button onclick="toggleFav(event, ${room.id})" class="absolute top-3 right-3 bg-white/90 hover:bg-white text-sm p-1.5 rounded-full z-20 shadow transition">
              ${isFav ? '❤️' : '🤍'}
            </button>

            <img src="${imgs[0]}" alt="${room.title}" class="h-48 w-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'">
            
            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
              📷 ${imgs.length} Photo${imgs.length > 1 ? 's' : ''}
            </div>
          </div>

          <div class="p-4 pb-2">
            <div class="flex justify-between items-baseline mb-1">
              <span class="text-xl font-black text-indigo-700">₹${room.rent}<span class="text-xs text-gray-500 font-normal">${periodSuffix}</span></span>
              <span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">${room.type || 'Open to All'}</span>
            </div>
            
            <h4 class="font-bold text-gray-900 leading-snug line-clamp-1">${room.title}</h4>
            <p class="text-xs text-gray-500 mt-0.5 font-medium">📍 ${room.location || ''} <span class="text-gray-400">(${cityState})</span> <span class="text-indigo-600 font-semibold">${spaceDetail}</span></p>

            ${room.owner_name ? `<p class="text-[11px] text-gray-600 mt-1 font-medium">👤 Owner/Manager: <strong class="text-gray-800">${room.owner_name}</strong></p>` : ''}

            ${ownerTotalListings > 1 ? `
              <button onclick="filterByOwnerPhone('${room.phone}', '${room.owner_name || 'Owner'}')" class="mt-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 w-full justify-center transition">
                🏢 Is Owner ke pass ${ownerTotalListings} spaces hain (Sabhi Dekhein)
              </button>
            ` : ''}

            <div class="flex items-center justify-between mt-2 pt-2 border-t text-xs">
              <a href="${mapsUrl}" target="_blank" class="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                ${t.mapBtn}
              </a>
              <a href="${whatsappShareUrl}" target="_blank" class="text-emerald-600 font-semibold hover:underline">
                📤 Share
              </a>
            </div>

            <div class="flex flex-wrap gap-1 mt-2.5">
              ${amenitiesList.map(tag => `<span class="text-[10px] bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="p-4 pt-2 space-y-2">
          ${!room.is_rented ? `
            <div class="grid grid-cols-2 gap-2">
              <a href="${callUrl}" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                ${t.callBtn}
              </a>
              <a href="${whatsappContactUrl}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                ${t.waBtn}
              </a>
            </div>
          ` : `
            <button disabled class="w-full bg-gray-300 text-gray-600 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
              ${t.rentedBadge}
            </button>
          `}

          <div class="flex gap-2 pt-1.5 border-t text-[11px]">
            <button onclick="handleRentedToggle(${room.id}, ${room.is_rented})" class="flex-1 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
              ${room.is_rented ? t.markAvailable : t.markRented}
            </button>
            <button onclick="handleDeleteRoom(${room.id})" class="px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 font-medium">
              ${t.deleteBtn}
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

function toggleForm() {
  const formSec = document.getElementById("formSection");
  if (formSec) formSec.classList.toggle("hidden");
}

function handleCategoryFieldChanges() {
  const cat = document.getElementById("category").value;
  const pricePeriod = document.getElementById("price_period");
  if (pricePeriod) {
    pricePeriod.value = (cat === "Hotel") ? "day" : "month";
  }
}

// Unlimited Photos Upload
async function addNewRoom(event) {
  event.preventDefault();
  const btn = document.getElementById("submitBtn");
  const fileInput = document.getElementById("imageFiles");

  if (!fileInput.files.length) {
    alert("Kripya kam se kam 1 photo chunein!");
    return;
  }

  const files = Array.from(fileInput.files);
  btn.innerText = `Photos upload ho rahi hain (0/${files.length})...`;
  btn.disabled = true;

  try {
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      btn.innerText = `Photo upload ho rahi hai (${i + 1}/${files.length})...`;

      const { error: uploadError } = await db.storage
        .from('Room finder')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = db.storage
        .from('Room finder')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    btn.innerText = "Database me save ho raha hai...";

    const rawAmenities = document.getElementById("amenities").value;
    const amenitiesArray = rawAmenities ? rawAmenities.split(",").map(i => i.trim()).filter(Boolean) : [];
    const ownerPin = document.getElementById("ownerPin").value;

    const newProperty = {
      category: document.getElementById("category").value,
      title: document.getElementById("title").value,
      owner_name: document.getElementById("owner_name").value,
      location: document.getElementById("location").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      rent: parseInt(document.getElementById("rent").value),
      price_period: document.getElementById("price_period").value,
      space_size: document.getElementById("space_size").value,
      type: document.getElementById("type").value,
      phone: document.getElementById("phone").value,
      pin: ownerPin,
      image: uploadedUrls[0],
      images: uploadedUrls,
      is_rented: false,
      amenities: amenitiesArray
    };

    const { error: insertError } = await db.from('rooms').insert([newProperty]);
    if (insertError) throw insertError;

    if (!myCreatedPins.includes(ownerPin)) {
      myCreatedPins.push(ownerPin);
      localStorage.setItem("roomdekho_mypins", JSON.stringify(myCreatedPins));
    }

    alert("Property safaltapoorvak publish ho gayi!");
    document.getElementById("roomForm").reset();
    toggleForm();
    fetchRooms();
  } catch (err) {
    alert("Upload fail hua: " + err.message);
  } finally {
    btn.innerText = "Publish Listing";
    btn.disabled = false;
  }
}

// Category Tabs
function setCategoryFilter(category) {
  selectedCategory = category;
  selectedOwnerPhone = null;
  
  const notice = document.getElementById("ownerFilterNotice");
  if (notice) notice.classList.add("hidden");

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("bg-white", "text-indigo-900", "font-bold");
    btn.classList.add("bg-indigo-800/80", "text-white");
  });

  if (window.event && window.event.target) {
    window.event.target.classList.remove("bg-indigo-800/80", "text-white");
    window.event.target.classList.add("bg-white", "text-indigo-900", "font-bold");
  }

  applyFilters();
}

function filterByOwnerPhone(phone, ownerName) {
  selectedOwnerPhone = phone;
  const notice = document.getElementById("ownerFilterNotice");
  if (notice) notice.classList.remove("hidden");
  safeSetText("currentViewTitle", `${ownerName} Ke Sabhi Rooms / Floors`);
  window.scrollTo({ top: 350, behavior: 'smooth' });
  applyFilters();
}

function clearOwnerFilter() {
  selectedOwnerPhone = null;
  const notice = document.getElementById("ownerFilterNotice");
  if (notice) notice.classList.add("hidden");
  safeSetText("currentViewTitle", translations[currentLanguage].availableListings);
  applyFilters();
}

function toggleMyListings() {
  showMyListingsOnly = !showMyListingsOnly;
  const btn = document.getElementById("myListingsBtn");

  if (btn) {
    if (showMyListingsOnly) {
      btn.classList.add("bg-indigo-600", "text-white");
      btn.classList.remove("bg-indigo-50/50", "text-indigo-700");
    } else {
      btn.classList.remove("bg-indigo-600", "text-white");
      btn.classList.add("bg-indigo-50/50", "text-indigo-700");
    }
  }
  applyFilters();
}

// Wishlist
function toggleFav(event, id) {
  if (event) event.stopPropagation();
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("roomdekho_favs", JSON.stringify(favorites));
  updateHeaderCounts();
  applyFilters();
}

function toggleFavoritesOnly() {
  showFavoritesOnly = !showFavoritesOnly;
  const btn = document.getElementById("favFilterBtn");
  if (btn) {
    if (showFavoritesOnly) {
      btn.classList.add("bg-rose-600", "text-white");
    } else {
      btn.classList.remove("bg-rose-600", "text-white");
    }
  }
  applyFilters();
}

// Main Filter
function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const budgetFilter = document.getElementById("budgetFilter");
  const sortBy = document.getElementById("sortBy");

  const search = searchInput ? searchInput.value.toLowerCase() : "";
  const maxBudget = budgetFilter ? parseInt(budgetFilter.value) : 10000000;
  const sort = sortBy ? sortBy.value : "newest";

  let filtered = roomsData.filter(room => {
    const titleMatch = room.title ? room.title.toLowerCase().includes(search) : false;
    const locMatch = room.location ? room.location.toLowerCase().includes(search) : false;
    const cityMatch = room.city ? room.city.toLowerCase().includes(search) : false;
    const stateMatch = room.state ? room.state.toLowerCase().includes(search) : false;
    const matchesSearch = titleMatch || locMatch || cityMatch || stateMatch;
    
    const matchesCategory = selectedCategory === "All" || (room.category || "Room") === selectedCategory;
    const matchesBudget = (room.rent || 0) <= maxBudget;
    const matchesFav = !showFavoritesOnly || favorites.includes(room.id);
    const matchesMyListings = !showMyListingsOnly || myCreatedPins.includes(room.pin);
    const matchesOwner = !selectedOwnerPhone || room.phone === selectedOwnerPhone;

    return matchesSearch && matchesCategory && matchesBudget && matchesFav && matchesMyListings && matchesOwner;
  });

  if (sort === "low_high") {
    filtered.sort((a, b) => a.rent - b.rent);
  } else if (sort === "high_low") {
    filtered.sort((a, b) => b.rent - a.rent);
  } else {
    filtered.sort((a, b) => b.id - a.id);
  }

  displayRooms(filtered);
}

function setAreaFilter(cityName) {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = cityName;
  applyFilters();
}

// Navigation
function showSection(sectionName) {
  const homeSec = document.getElementById("homeSection");
  const aboutSec = document.getElementById("aboutSection");
  const privacySec = document.getElementById("privacySection");

  if (homeSec) homeSec.classList.add("hidden");
  if (aboutSec) aboutSec.classList.add("hidden");
  if (privacySec) privacySec.classList.add("hidden");

  if (sectionName === "home" && homeSec) homeSec.classList.remove("hidden");
  else if (sectionName === "about" && aboutSec) aboutSec.classList.remove("hidden");
  else if (sectionName === "privacy" && privacySec) privacySec.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Actions
async function handleRentedToggle(id, currentStatus) {
  const room = roomsData.find(r => r.id === id);
  const inputPin = prompt("Room/Property ka 4-digit PIN enter karein:");
  if (!inputPin) return;

  if (inputPin === room.pin || inputPin === MASTER_ADMIN_PIN) {
    const { error } = await db.from('rooms').update({ is_rented: !currentStatus }).eq('id', id);
    if (error) alert("Err

// Supabase Configuration
const SUPABASE_URL = "https://ndegekylfrhroyyhumyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hwBUpVWGEoWrQgiiG8ZgBw_ZM_aJyH2";
const MASTER_ADMIN_PIN = "1234";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let roomsData = [];
let favorites = JSON.parse(localStorage.getItem("roomdekho_favs") || "[]");
let myCreatedPins = JSON.parse(localStorage.getItem("roomdekho_mypins") || "[]"); // Owner tracking

let selectedCategory = "All";
let showFavoritesOnly = false;
let showMyListingsOnly = false;

// Gallery Modal State
let currentImages = [];
let currentImageIndex = 0;

// Fetch All Properties
async function fetchRooms() {
  const container = document.getElementById("roomContainer");
  const { data, error } = await db.from('rooms').select('*').order('id', { ascending: false });

  if (error) {
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-8 font-medium">Database connection error.</p>`;
    return;
  }

  roomsData = data || [];
  updateHeaderCounts();
  applyFilters();
}

function updateHeaderCounts() {
  document.getElementById("favCount").innerText = favorites.length;
  // Calculate how many listings this user created
  const myRooms = roomsData.filter(r => myCreatedPins.includes(r.pin));
  document.getElementById("myCount").innerText = myRooms.length;
}

// Display Cards
function displayRooms(rooms) {
  const container = document.getElementById("roomContainer");
  const countDisplay = document.getElementById("resultsCount");
  container.innerHTML = "";

  countDisplay.innerText = `${rooms.length} listings uplabdh hain`;

  if (rooms.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
        <p class="text-4xl mb-2">🔍</p>
        <p class="text-gray-700 font-bold">Koi property ya room nahi mila</p>
        <p class="text-xs text-gray-400 mt-1">Filter reset karein ya doosra area search karein.</p>
      </div>`;
    return;
  }

  rooms.forEach(room => {
    const rawPhone = String(room.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const roomUrl = window.location.href.split('?')[0];
    
    const categoryBadge = room.category || "Room";
    const spaceDetail = room.space_size ? `• ${room.space_size}` : '';

    const shareText = encodeURIComponent(`Patna me ye property dekho: "${room.title}" (${categoryBadge}) - ₹${room.rent}/month. Link: ${roomUrl}`);
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

    const message = encodeURIComponent(`Namaste! Maine RoomDekho par aapka "${room.title}" dekha. Kya ye available hai?`);
    const whatsappContactUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    const callUrl = `tel:+${cleanPhone}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.location + ', Patna')}`;
    const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];

    // Images Array
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

    const card = `
      <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-between border border-gray-100 overflow-hidden ${room.is_rented ? 'opacity-65 grayscale' : ''}">
        <div>
          <!-- Photo & Badges -->
          <div class="relative cursor-pointer group" onclick="openGallery(${JSON.stringify(imgs).replace(/"/g, '&quot;')})">
            ${room.is_rented 
              ? '<span class="absolute top-3 left-3 bg-red-600 text-white text-[11px] px-2.5 py-0.5 rounded-md font-bold uppercase z-10 shadow">Rented Out</span>' 
              : `<span class="absolute top-3 left-3 bg-indigo-600 text-white text-[11px] px-2.5 py-0.5 rounded-md font-bold z-10 shadow">${categoryBadge}</span>`}

            ${isMyListing ? '<span class="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">Aapki Listing</span>' : ''}
            
            <button onclick="toggleFav(event, ${room.id})" class="absolute top-3 right-3 bg-white/90 hover:bg-white text-sm p-1.5 rounded-full z-20 shadow transition">
              ${isFav ? '❤️' : '🤍'}
            </button>

            <img src="${imgs[0]}" alt="${room.title}" class="h-48 w-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'">
            
            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
              📷 ${imgs.length} Photo${imgs.length > 1 ? 's' : ''}
            </div>
          </div>

          <!-- Content Details -->
          <div class="p-4 pb-2">
            <div class="flex justify-between items-baseline mb-1">
              <span class="text-xl font-black text-indigo-700">₹${room.rent}<span class="text-xs text-gray-500 font-normal">/month</span></span>
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">${room.type || 'Anyone'}</span>
            </div>
            
            <h4 class="font-bold text-gray-900 leading-snug line-clamp-1">${room.title}</h4>
            <p class="text-xs text-gray-500 mt-0.5 font-medium">${room.location} <span class="text-indigo-600">${spaceDetail}</span></p>

            <div class="flex items-center justify-between mt-2 pt-2 border-t text-xs">
              <a href="${mapsUrl}" target="_blank" class="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                📍 Google Maps Par Dekhein
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

        <!-- Action Buttons -->
        <div class="p-4 pt-2 space-y-2">
          ${!room.is_rented ? `
            <div class="grid grid-cols-2 gap-2">
              <a href="${callUrl}" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                📞 Call
              </a>
              <a href="${whatsappContactUrl}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                💬 WhatsApp
              </a>
            </div>
          ` : `
            <button disabled class="w-full bg-gray-300 text-gray-600 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
              Abhi Rented / Booked Hai
            </button>
          `}

          <!-- Owner / Admin Controls -->
          <div class="flex gap-2 pt-1.5 border-t text-[11px]">
            <button onclick="handleRentedToggle(${room.id}, ${room.is_rented})" class="flex-1 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
              ${room.is_rented ? 'Mark Available' : 'Mark as Rented'}
            </button>
            <button onclick="handleDeleteRoom(${room.id})" class="px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

function toggleForm() {
  document.getElementById("formSection").classList.toggle("hidden");
}

// Add New Property (Unlimited Photos Support)
async function addNewRoom(event) {
  event.preventDefault();
  const btn = document.getElementById("submitBtn");
  const fileInput = document.getElementById("imageFiles");

  if (!fileInput.files.length) {
    alert("Kripya kam se kam 1 photo select karein!");
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
      location: document.getElementById("location").value,
      rent: parseInt(document.getElementById("rent").value),
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

    // Save PIN locally taaki owner ko pata chale ye uski property hai
    if (!myCreatedPins.includes(ownerPin)) {
      myCreatedPins.push(ownerPin);
      localStorage.setItem("roomdekho_mypins", JSON.stringify(myCreatedPins));
    }

    alert("Property kamyabi se publish ho gayi! Apna 4-digit PIN yaad rakhein.");
    document.getElementById("roomForm").reset();
    toggleForm();
    fetchRooms();
  } catch (err) {
    alert("Upload fail hua: " + err.message);
  } finally {
    btn.innerText = "Publish Property";
    btn.disabled = false;
  }
}

// Category Tabs Filter
function setCategoryFilter(category) {
  selectedCategory = category;
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("bg-white", "text-indigo-900", "font-bold");
    btn.classList.add("bg-indigo-800/80", "text-white");
  });
  event.target.classList.remove("bg-indigo-800/80", "text-white");
  event.target.classList.add("bg-white", "text-indigo-900", "font-bold");

  applyFilters();
}

// Owner "Mere Listings" Filter
function toggleMyListings() {
  showMyListingsOnly = !showMyListingsOnly;
  const btn = document.getElementById("myListingsBtn");

  if (showMyListingsOnly) {
    btn.classList.add("bg-indigo-600", "text-white");
    btn.classList.remove("bg-indigo-50/50", "text-indigo-700");
    document.getElementById("currentViewTitle").innerText = "Aapke Dwara Dali Gayi Listings";
  } else {
    btn.classList.remove("bg-indigo-600", "text-white");
    btn.classList.add("bg-indigo-50/50", "text-indigo-700");
    document.getElementById("currentViewTitle").innerText = "Available Listings";
  }
  applyFilters();
}

// Wishlist
function toggleFav(event, id) {
  event.stopPropagation();
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
  if (showFavoritesOnly) {
    btn.classList.add("bg-rose-600", "text-white");
  } else {
    btn.classList.remove("bg-rose-600", "text-white");
  }
  applyFilters();
}

// Main Filter Logic
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const maxBudget = parseInt(document.getElementById("budgetFilter").value);
  const sortBy = document.getElementById("sortBy").value;

  let filtered = roomsData.filter(room => {
    const titleMatch = room.title ? room.title.toLowerCase().includes(search) : false;
    const locMatch = room.location ? room.location.toLowerCase().includes(search) : false;
    const matchesSearch = titleMatch || locMatch;
    
    const matchesCategory = selectedCategory === "All" || (room.category || "Room") === selectedCategory;
    const matchesBudget = room.rent <= maxBudget;
    const matchesFav = !showFavoritesOnly || favorites.includes(room.id);
    const matchesMyListings = !showMyListingsOnly || myCreatedPins.includes(room.pin);

    return matchesSearch && matchesCategory && matchesBudget && matchesFav && matchesMyListings;
  });

  if (sortBy === "low_high") {
    filtered.sort((a, b) => a.rent - b.rent);
  } else if (sortBy === "high_low") {
    filtered.sort((a, b) => b.rent - a.rent);
  } else {
    filtered.sort((a, b) => b.id - a.id);
  }

  displayRooms(filtered);
}

function setAreaFilter(areaName) {
  document.getElementById("searchInput").value = areaName;
  applyFilters();
}

// Page Navigation (Home, About, Privacy)
function showSection(sectionName) {
  document.getElementById("homeSection").classList.add("hidden");
  document.getElementById("aboutSection").classList.add("hidden");
  document.getElementById("privacySection").classList.add("hidden");

  if (sectionName === "home") {
    document.getElementById("homeSection").classList.remove("hidden");
  } else if (sectionName === "about") {
    document.getElementById("aboutSection").classList.remove("hidden");
  } else if (sectionName === "privacy") {
    document.getElementById("privacySection").classList.remove("hidden");
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// PIN Protection
async function handleRentedToggle(id, currentStatus) {
  const room = roomsData.find(r => r.id === id);
  const inputPin = prompt("Room/Property ka 4-digit PIN enter karein:");
  if (!inputPin) return;

  if (inputPin === room.pin || inputPin === MASTER_ADMIN_PIN) {
    const { error } = await db.from('rooms').update({ is_rented: !currentStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchRooms();
  } else {
    alert("❌ Galat PIN! Sirf owner hi ise mark kar sakta hai.");
  }
}

async function handleDeleteRoom(id) {
  const room = roomsData.find(r => r.id === id);
  const inputPin = prompt("Property delete karne ke liye 4-digit PIN enter karein:");
  if (!inputPin) return;

  if (inputPin === room.pin || inputPin === MASTER_ADMIN_PIN) {
    if (confirm("Kya aap sach me is listing ko delete karna chahte hain?")) {
      const { error } = await db.from('rooms').delete().eq('id', id);
      if (error) alert("Error: " + error.message);
      else fetchRooms();
    }
  } else {
    alert("❌ Galat PIN! Access denied.");
  }
}

// Fullscreen Modal Gallery
function openGallery(images) {
  currentImages = images;
  currentImageIndex = 0;
  updateModalImage();
  document.getElementById("imageModal").classList.remove("hidden");
}

function updateModalImage() {
  document.getElementById("modalImg").src = currentImages[currentImageIndex];
  document.getElementById("imageCounter").innerText = `Photo ${currentImageIndex + 1} of ${currentImages.length}`;
}

function prevImage(event) {
  event.stopPropagation();
  currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
  updateModalImage();
}

function nextImage(event) {
  event.stopPropagation();
  currentImageIndex = (currentImageIndex + 1) % currentImages.length;
  updateModalImage();
}

function closeImageModal() {
  document.getElementById("imageModal").classList.add("hidden");
}

fetchRooms();

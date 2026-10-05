// Supabase Configuration
const SUPABASE_URL = "https://ndegekylfrhroyyhumyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hwBUpVWGEoWrQgiiG8ZgBw_ZM_aJyH2";
const MASTER_ADMIN_PIN = "1234";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let roomsData = [];
let favorites = JSON.parse(localStorage.getItem("roomdekho_favs") || "[]");
let showFavoritesOnly = false;

// Modal Gallery State
let currentImages = [];
let currentImageIndex = 0;

// Fetch Rooms
async function fetchRooms() {
  const container = document.getElementById("roomContainer");
  const { data, error } = await db.from('rooms').select('*').order('id', { ascending: false });

  if (error) {
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-8">Database connection error.</p>`;
    return;
  }

  roomsData = data || [];
  updateFavCount();
  applyFilters();
}

function updateFavCount() {
  document.getElementById("favCount").innerText = favorites.length;
}

// Display Cards
function displayRooms(rooms) {
  const container = document.getElementById("roomContainer");
  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10 font-medium">Koi room nahi mila.</p>`;
    return;
  }

  rooms.forEach(room => {
    const rawPhone = String(room.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const roomUrl = window.location.href.split('?')[0];
    
    // Feature 3: WhatsApp Share Message
    const shareText = encodeURIComponent(`Patna me ye room dekho: "${room.title}" - ₹${room.rent}/month (${room.location}). Zero brokerage! Link: ${roomUrl}`);
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

    // Tenant Contact Links
    const message = encodeURIComponent(`Namaste! Maine RoomDekho par aapka room "${room.title}" dekha. Kya ye available hai?`);
    const whatsappContactUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    const callUrl = `tel:+${cleanPhone}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.location + ', Patna')}`;
    const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];

    // Feature 1: Multiple Images Array Setup
    let imgs = [];
    if (room.images && room.images.length > 0) {
      imgs = room.images;
    } else if (room.image) {
      imgs = [room.image];
    } else {
      imgs = ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'];
    }

    const isFav = favorites.includes(room.id);

    const card = `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between border border-gray-100 ${room.is_rented ? 'opacity-60 grayscale' : ''}">
        <div>
          <div class="relative cursor-pointer group" onclick="openGallery(${JSON.stringify(imgs).replace(/"/g, '&quot;')})">
            ${room.is_rented 
              ? '<span class="absolute top-3 left-3 bg-red-600 text-white text-xs px-2.5 py-1 rounded-md font-bold uppercase z-10 shadow">Rented Out</span>' 
              : '<span class="absolute top-3 left-3 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded font-semibold z-10 flex items-center gap-1 shadow">✓ Verified</span>'}
            
            <!-- Feature 2: Wishlist Heart -->
            <button onclick="toggleFav(event, ${room.id})" class="absolute top-3 right-3 bg-white/90 hover:bg-white text-sm p-1.5 rounded-full z-20 shadow transition">
              ${isFav ? '❤️' : '🤍'}
            </button>

            <img src="${imgs[0]}" alt="${room.title}" class="h-48 w-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'">
            
            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              📷 ${imgs.length} Photo${imgs.length > 1 ? 's' : ''} (Tap to view)
            </div>
          </div>

          <div class="p-5 pb-3">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">${room.type}</span>
              <span class="text-lg font-bold text-indigo-600">₹${room.rent}<span class="text-xs text-gray-500 font-normal">/mo</span></span>
            </div>
            
            <h3 class="font-bold text-lg text-gray-800 leading-snug line-clamp-1">${room.title}</h3>
            
            <div class="flex items-center justify-between mt-1 mb-2">
              <p class="text-sm text-gray-500 truncate">📍 ${room.location}</p>
              <a href="${mapsUrl}" target="_blank" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 ml-2 shrink-0">
                🗺️ Map Dekhein
              </a>
            </div>

            <div class="flex flex-wrap gap-1 mb-3">
              ${amenitiesList.map(tag => `<span class="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="p-5 pt-0 space-y-2">
          ${!room.is_rented ? `
            <div class="grid grid-cols-2 gap-2">
              <a href="${callUrl}" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                📞 Call
              </a>
              <a href="${whatsappContactUrl}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                💬 WhatsApp
              </a>
            </div>
          ` : `
            <button disabled class="w-full bg-gray-400 text-white text-xs font-semibold py-2 rounded-lg cursor-not-allowed">
              Room Full Ho Chuka Hai
            </button>
          `}

          <!-- Feature 3 & 4: Share & Report Buttons -->
          <div class="flex justify-between items-center text-[11px] text-gray-500 pt-1">
            <a href="${whatsappShareUrl}" target="_blank" class="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              📤 Share with friend
            </a>
            <button onclick="reportRoom(${room.id})" class="text-gray-400 hover:text-red-500">
              🚩 Report Fake / Rented
            </button>
          </div>

          <!-- Owner PIN Verification Actions -->
          <div class="flex gap-2 pt-2 border-t text-[11px]">
            <button onclick="handleRentedToggle(${room.id}, ${room.is_rented})" class="flex-1 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 font-medium">
              ${room.is_rented ? 'Mark Available' : 'Mark as Rented'}
            </button>
            <button onclick="handleDeleteRoom(${room.id})" class="px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 font-medium">
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

// Feature 1: Multi-file Upload Handler
async function addNewRoom(event) {
  event.preventDefault();
  const btn = document.getElementById("submitBtn");
  const fileInput = document.getElementById("imageFiles");

  if (!fileInput.files.length) {
    alert("Kripya kam se kam 1 photo chunein!");
    return;
  }

  btn.innerText = "Photos upload ho rahi hain...";
  btn.disabled = true;

  try {
    const uploadedUrls = [];
    const files = Array.from(fileInput.files).slice(0, 4); // Max 4 photos

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substring(2)}.${fileExt}`;

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

    const newRoom = {
      title: document.getElementById("title").value,
      location: document.getElementById("location").value,
      rent: parseInt(document.getElementById("rent").value),
      type: document.getElementById("type").value,
      phone: document.getElementById("phone").value,
      pin: document.getElementById("ownerPin").value,
      image: uploadedUrls[0], // primary image
      images: uploadedUrls,   // all uploaded images array
      is_rented: false,
      amenities: amenitiesArray
    };

    const { error: insertError } = await db.from('rooms').insert([newRoom]);
    if (insertError) throw insertError;

    alert("Room successfully publish ho gaya! Apna set kiya hua 4-digit PIN yaad rakhein.");
    document.getElementById("roomForm").reset();
    toggleForm();
    fetchRooms();
  } catch (err) {
    alert("Upload fail hua: " + err.message);
  } finally {
    btn.innerText = "Save & Publish Room";
    btn.disabled = false;
  }
}

// Feature 2: Wishlist Toggle
function toggleFav(event, id) {
  event.stopPropagation();
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("roomdekho_favs", JSON.stringify(favorites));
  updateFavCount();
  applyFilters();
}

function toggleFavoritesOnly() {
  showFavoritesOnly = !showFavoritesOnly;
  const btn = document.getElementById("favFilterBtn");
  if (showFavoritesOnly) {
    btn.classList.add("bg-rose-600", "text-white");
    btn.classList.remove("bg-rose-50", "text-rose-600");
  } else {
    btn.classList.remove("bg-rose-600", "text-white");
    btn.classList.add("bg-rose-50", "text-rose-600");
  }
  applyFilters();
}

// Feature 4: Report Room
async function reportRoom(id) {
  if (confirm("Kya ye room rented ho chuka hai ya number galat hai? Report karein?")) {
    const { error } = await db.rpc('increment_report', { row_id: id }).catch(async () => {
      // Fallback simple update
      const room = roomsData.find(r => r.id === id);
      return await db.from('rooms').update({ report_count: (room.report_count || 0) + 1 }).eq('id', id);
    });
    alert("Shukriya! Aapki report darj kar li gayi hai, admin ise review karega.");
  }
}

// Owner PIN Verification for Rented
async function handleRentedToggle(id, currentStatus) {
  const room = roomsData.find(r => r.id === id);
  const inputPin = prompt("Room add karte waqt jo 4-digit PIN banaya tha, use enter karein:");
  
  if (!inputPin) return;

  if (inputPin === room.pin || inputPin === MASTER_ADMIN_PIN) {
    const { error } = await db.from('rooms').update({ is_rented: !currentStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchRooms();
  } else {
    alert("❌ Galat PIN! Sirf wahi owner jisne room dala tha ise mark kar sakta hai.");
  }
}

// Owner PIN Verification for Delete
async function handleDeleteRoom(id) {
  const room = roomsData.find(r => r.id === id);
  const inputPin = prompt("Room delete karne ke liye apna 4-digit PIN enter karein:");

  if (!inputPin) return;

  if (inputPin === room.pin || inputPin === MASTER_ADMIN_PIN) {
    if (confirm("Kya aap sach me is room ko delete karna chahte hain?")) {
      const { error } = await db.from('rooms').delete().eq('id', id);
      if (error) alert("Error: " + error.message);
      else fetchRooms();
    }
  } else {
    alert("❌ Galat PIN! Aap kisi aur ka room delete nahi kar sakte.");
  }
}

// Feature 5: Filters & Sorting Logic
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const selectedType = document.getElementById("typeFilter").value;
  const maxBudget = parseInt(document.getElementById("budgetFilter").value);
  const sortBy = document.getElementById("sortBy").value;

  let filtered = roomsData.filter(room => {
    const titleMatch = room.title ? room.title.toLowerCase().includes(search) : false;
    const locMatch = room.location ? room.location.toLowerCase().includes(search) : false;
    const matchesSearch = titleMatch || locMatch;
    const matchesType = selectedType === "All" || room.type === selectedType;
    const matchesBudget = room.rent <= maxBudget;
    const matchesFav = !showFavoritesOnly || favorites.includes(room.id);
    return matchesSearch && matchesType && matchesBudget && matchesFav;
  });

  // Sorting
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

// Gallery / Slider Modal Logic
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

// PWA Support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.classList.remove('hidden');
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.classList.add('hidden');
      }
      deferredPrompt = null;
    }
  });
}

fetchRooms();

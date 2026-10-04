// Supabase Configuration
const SUPABASE_URL = "https://ndegekylfrhroyyhumyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hwBUpVWGEoWrQgiiG8ZgBw_ZM_aJyH2";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let roomsData = [];

// SQL Database se rooms fetch karna
async function fetchRooms() {
  const container = document.getElementById("roomContainer");
  container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">SQL Database se rooms load ho rahe hain...</p>`;

  const { data, error } = await db
    .from('rooms')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching rooms:", error);
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-8 font-medium">Database connection error. Kripya refresh karein.</p>`;
    return;
  }

  roomsData = data || [];
  applyFilters();
}

// Display Cards
function displayRooms(rooms) {
  const container = document.getElementById("roomContainer");
  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10 font-medium">Aapke search ke anusaar koi room nahi mila.</p>`;
    return;
  }

  rooms.forEach(room => {
    const rawPhone = String(room.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const message = encodeURIComponent(`Namaste! Maine RoomDekho par aapka room dekha: "${room.title}" (${room.location}). Kya ye room abhi available hai?`);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    const callUrl = `tel:+${cleanPhone}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.location + ', Patna')}`;
    const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];

    const card = `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between border border-gray-100 ${room.is_rented ? 'opacity-60 grayscale' : ''}">
        
        <div>
          <!-- Image Container -->
          <div class="relative cursor-pointer group" onclick="openImageModal('${room.image}')">
            ${room.is_rented 
              ? '<span class="absolute top-3 left-3 bg-red-600 text-white text-xs px-2.5 py-1 rounded-md font-bold uppercase z-10 shadow">Rented Out</span>' 
              : '<span class="absolute top-3 left-3 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded font-semibold z-10 flex items-center gap-1 shadow">✓ Verified</span>'}
            
            <img src="${room.image}" alt="${room.title}" class="h-48 w-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'">
            <span class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">🔍 Click to zoom</span>
          </div>

          <!-- Content Details -->
          <div class="p-5 pb-3">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">${room.type}</span>
              <div class="text-right">
                <span class="text-lg font-bold text-indigo-600">₹${room.rent}<span class="text-xs text-gray-500 font-normal">/mo</span></span>
              </div>
            </div>
            
            <h3 class="font-bold text-lg text-gray-800 leading-snug line-clamp-1">${room.title}</h3>
            
            <!-- Location & Map Link -->
            <div class="flex items-center justify-between mt-1 mb-2">
              <p class="text-sm text-gray-500 truncate">📍 ${room.location}</p>
              <a href="${mapsUrl}" target="_blank" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 ml-2 shrink-0">
                🗺️ Map Dekhein
              </a>
            </div>

            <!-- Amenities -->
            <div class="flex flex-wrap gap-1 mb-3">
              ${amenitiesList.map(tag => `<span class="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="p-5 pt-0 space-y-2">
          ${!room.is_rented ? `
            <div class="grid grid-cols-2 gap-2">
              <a href="${callUrl}" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                📞 Direct Call
              </a>
              <a href="${whatsappUrl}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-1 transition">
                💬 WhatsApp
              </a>
            </div>
          ` : `
            <button disabled class="w-full bg-gray-400 text-white text-xs font-semibold py-2 rounded-lg cursor-not-allowed">
              Room Full Ho Chuka Hai
            </button>
          `}

          <div class="flex gap-2 pt-2 border-t text-[11px]">
            <button onclick="toggleRented(${room.id}, ${room.is_rented})" class="flex-1 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 font-medium">
              ${room.is_rented ? 'Mark Available' : 'Mark as Rented'}
            </button>
            <button onclick="deleteRoom(${room.id})" class="px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 font-medium">
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

// SQL Database me insert karna
async function addNewRoom(event) {
  event.preventDefault();
  const btn = document.getElementById("submitBtn");
  btn.innerText = "Saving to SQL Database...";
  btn.disabled = true;

  const rawAmenities = document.getElementById("amenities").value;
  const amenitiesArray = rawAmenities ? rawAmenities.split(",").map(i => i.trim()).filter(Boolean) : [];

  const newRoom = {
    title: document.getElementById("title").value,
    location: document.getElementById("location").value,
    rent: parseInt(document.getElementById("rent").value),
    type: document.getElementById("type").value,
    phone: document.getElementById("phone").value,
    image: document.getElementById("image").value,
    is_rented: false,
    amenities: amenitiesArray
  };

  const { error } = await db.from('rooms').insert([newRoom]);

  btn.innerText = "Save & Publish Room";
  btn.disabled = false;

  if (error) {
    alert("Room save karne me error aaya: " + error.message);
    return;
  }

  document.getElementById("roomForm").reset();
  toggleForm();
  fetchRooms();
}

// SQL Table me status update karna
async function toggleRented(id, currentStatus) {
  const { error } = await db
    .from('rooms')
    .update({ is_rented: !currentStatus })
    .eq('id', id);

  if (error) {
    alert("Update fail hua: " + error.message);
    return;
  }
  fetchRooms();
}

// SQL Table se delete karna
async function deleteRoom(id) {
  if (confirm("Kya aap sach me is room ko delete karna chahte hain?")) {
    const { error } = await db
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Delete fail hua: " + error.message);
      return;
    }
    fetchRooms();
  }
}

// Search and filters logic
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const selectedType = document.getElementById("typeFilter").value;
  const maxBudget = parseInt(document.getElementById("budgetFilter").value);

  const filtered = roomsData.filter(room => {
    const titleMatch = room.title ? room.title.toLowerCase().includes(search) : false;
    const locMatch = room.location ? room.location.toLowerCase().includes(search) : false;
    const matchesSearch = titleMatch || locMatch;
    const matchesType = selectedType === "All" || room.type === selectedType;
    const matchesBudget = room.rent <= maxBudget;

    return matchesSearch && matchesType && matchesBudget;
  });

  displayRooms(filtered);
}

// Quick Area Chip filter
function setAreaFilter(areaName) {
  document.getElementById("searchInput").value = areaName;
  applyFilters();
}

// Image Lightbox Modal
function openImageModal(imgSrc) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  modalImg.src = imgSrc;
  modal.classList.remove("hidden");
}

function closeImageModal() {
  document.getElementById("imageModal").classList.add("hidden");
}

// App start hote hi fetch call karein
fetchRooms();
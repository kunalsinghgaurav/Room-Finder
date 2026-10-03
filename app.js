// Supabase Configuration
const SUPABASE_URL = "https://ndegekylfrhroyyhumyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hwBUpVWGEoWrQgiiG8ZgBw_ZM_aJyH2";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let roomsData = [];

// SQL Table se Rooms Fetch Karna
async function fetchRooms() {
  const container = document.getElementById("roomContainer");
  container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">SQL Database se rooms load ho rahe hain...</p>`;

  const { data, error } = await db
    .from('rooms')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching rooms:", error);
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-8">Database connect karne me dikkat aayi.</p>`;
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
    container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8 font-medium">Abhi koi room available nahi hai ya search se match nahi hua.</p>`;
    return;
  }

  rooms.forEach(room => {
    const message = encodeURIComponent(`Namaste, maine RoomDekho par aapka room dekha: "${room.title}". Kya ye abhi khali hai?`);
    const whatsappUrl = `https://wa.me/${room.phone}?text=${message}`;
    const amenitiesList = Array.isArray(room.amenities) ? room.amenities : [];

    const card = `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col relative ${room.is_rented ? 'opacity-60 grayscale' : ''}">
        
        ${room.is_rented ? '<span class="absolute top-3 left-3 bg-red-600 text-white text-xs px-2.5 py-1 rounded-md font-bold uppercase z-10 shadow">Rented Out</span>' : ''}

        <img src="${room.image}" alt="${room.title}" class="h-48 w-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'">
        
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">${room.type}</span>
              <span class="text-lg font-bold text-indigo-600">₹${room.rent}<span class="text-xs text-gray-500 font-normal">/month</span></span>
            </div>
            
            <h3 class="font-semibold text-lg text-gray-800">${room.title}</h3>
            <p class="text-sm text-gray-500 mb-3">📍 ${room.location}</p>
            
            <div class="flex flex-wrap gap-1 mb-4">
              ${amenitiesList.map(tag => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}
            </div>
          </div>

          <div class="space-y-2">
            ${!room.is_rented ? `
              <a href="${whatsappUrl}" target="_blank" class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg text-center flex items-center justify-center gap-2 transition">
                <span>Owner Se WhatsApp Karein</span>
              </a>
            ` : `
              <button disabled class="w-full bg-gray-400 text-white font-medium py-2 rounded-lg cursor-not-allowed">
                Room Full Ho Chuka Hai
              </button>
            `}

            <div class="flex gap-2 pt-2 border-t text-xs">
              <button onclick="toggleRented(${room.id}, ${room.is_rented})" class="flex-1 py-1.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 font-medium">
                ${room.is_rented ? 'Mark Available' : 'Mark as Rented'}
              </button>
              <button onclick="deleteRoom(${room.id})" class="px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 font-medium">
                Delete
              </button>
            </div>
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

// SQL Table me Insert Karna
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

// SQL Table me Update (Toggle Rented)
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

// SQL Table se Delete
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

// Filters
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

// App start hote hi Database se load karein
fetchRooms();
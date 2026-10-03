let roomsData = JSON.parse(localStorage.getItem("myRooms")) || [
  {
    id: 1,
    title: "Single Room Near Coaching Hub",
    location: "Kankarbagh / Main Market",
    type: "Boys",
    rent: 3000,
    isRented: false,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
    phone: "919876543210",
    amenities: ["Wi-Fi", "RO Water", "No Restrictions"]
  },
  {
    id: 2,
    title: "1 BHK Flat for Girls/Students",
    location: "Near Girls College",
    type: "Girls",
    rent: 4500,
    isRented: false,
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
    phone: "919876543211",
    amenities: ["Attached Washroom", "Safe Gated", "CCTV"]
  }
];

function displayRooms(rooms) {
  const container = document.getElementById("roomContainer");
  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8 font-medium">Aapke search ke hisab se koi room nahi mila.</p>`;
    return;
  }

  rooms.forEach(room => {
    const message = encodeURIComponent(`Namaste, maine RoomDekho par aapka room dekha: "${room.title}". Kya ye abhi khali hai?`);
    const whatsappUrl = `https://wa.me/${room.phone}?text=${message}`;

    const card = `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col relative ${room.isRented ? 'opacity-60 grayscale' : ''}">
        
        <!-- Status Badge -->
        ${room.isRented ? '<span class="absolute top-3 left-3 bg-red-600 text-white text-xs px-2.5 py-1 rounded-md font-bold uppercase z-10 shadow">Rented Out</span>' : ''}

        <img src="${room.image}" alt="${room.title}" class="h-48 w-full object-cover">
        
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">${room.type}</span>
              <span class="text-lg font-bold text-indigo-600">₹${room.rent}<span class="text-xs text-gray-500 font-normal">/month</span></span>
            </div>
            
            <h3 class="font-semibold text-lg text-gray-800">${room.title}</h3>
            <p class="text-sm text-gray-500 mb-3">📍 ${room.location}</p>
            
            <div class="flex flex-wrap gap-1 mb-4">
              ${room.amenities.map(tag => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}
            </div>
          </div>

          <div class="space-y-2">
            <!-- WhatsApp Button -->
            ${!room.isRented ? `
              <a href="${whatsappUrl}" target="_blank" class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg text-center flex items-center justify-center gap-2 transition">
                <span>Owner Se WhatsApp Karein</span>
              </a>
            ` : `
              <button disabled class="w-full bg-gray-400 text-white font-medium py-2 rounded-lg cursor-not-allowed">
                Room Full Ho Chuka Hai
              </button>
            `}

            <!-- Action Controls (Toggle Rented / Delete) -->
            <div class="flex gap-2 pt-2 border-t text-xs">
              <button onclick="toggleRented(${room.id})" class="flex-1 py-1.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 font-medium">
                ${room.isRented ? 'Mark Available' : 'Mark as Rented'}
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
  const formSection = document.getElementById("formSection");
  formSection.classList.toggle("hidden");
}

function addNewRoom(event) {
  event.preventDefault();

  const newRoom = {
    id: Date.now(),
    title: document.getElementById("title").value,
    location: document.getElementById("location").value,
    rent: parseInt(document.getElementById("rent").value),
    type: document.getElementById("type").value,
    phone: document.getElementById("phone").value,
    image: document.getElementById("image").value,
    isRented: false,
    amenities: document.getElementById("amenities").value.split(",").map(item => item.trim())
  };

  roomsData.unshift(newRoom);
  saveAndRefresh();

  document.getElementById("roomForm").reset();
  toggleForm();
}

function toggleRented(id) {
  roomsData = roomsData.map(room => {
    if (room.id === id) {
      return { ...room, isRented: !room.isRented };
    }
    return room;
  });
  saveAndRefresh();
}

function deleteRoom(id) {
  if (confirm("Kya aap sach me is room ko delete karna chahte hain?")) {
    roomsData = roomsData.filter(room => room.id !== id);
    saveAndRefresh();
  }
}

function saveAndRefresh() {
  localStorage.setItem("myRooms", JSON.stringify(roomsData));
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const selectedType = document.getElementById("typeFilter").value;
  const maxBudget = parseInt(document.getElementById("budgetFilter").value);

  const filtered = roomsData.filter(room => {
    const matchesSearch = room.location.toLowerCase().includes(search) || room.title.toLowerCase().includes(search);
    const matchesType = selectedType === "All" || room.type === selectedType;
    const matchesBudget = room.rent <= maxBudget;

    return matchesSearch && matchesType && matchesBudget;
  });

  displayRooms(filtered);
}

// Initial render
applyFilters();
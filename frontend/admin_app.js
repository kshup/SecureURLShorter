const API_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if not authenticated
    // In a real app, you might check if the user is an admin here
    alert('Admin paneline erişim için giriş yapmalısınız.');
    window.location.href = '/'; // Redirect to main page login
    return;
  }

  // Setup sidebar navigation
  setupSidebarNav();

  // Load initial data
  loadDashboardOverview();
  loadAllUrls();
  loadAllUsers();
  loadAllClickLogs();
  loadBlacklist();

  // Setup event listeners
  setupBlacklistForm();
  setupLogout();
});

function setupSidebarNav() {
  const sidebarLinks = document.querySelectorAll('#sidebar .nav-link');
  const sections = document.querySelectorAll('.admin-section');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all links
      sidebarLinks.forEach(l => l.classList.remove('active'));
      // Add active class to the clicked link
      link.classList.add('active');

      // Hide all sections
      sections.forEach(section => section.classList.add('d-none'));

      // Show the target section
      const targetSectionId = link.getAttribute('data-section') + 'Section';
      const targetSection = document.getElementById(targetSectionId);
      if (targetSection) {
        targetSection.classList.remove('d-none');
      }
    });
  });
}

function setupLogout() {
  const logoutBtn = document.getElementById('adminLogoutBtn');
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/';
  });
}

async function fetchData(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });

    if (response.status === 401 || response.status === 403) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      alert('Oturum süresi doldu veya yetkisiz erişim. Lütfen tekrar giriş yapın.');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    // Optionally show error message to user
    throw error; // Re-throw error to be caught by calling function
  }
}

// --- Load Data Functions ---

async function loadDashboardOverview() {
  try {
    // Use the dedicated endpoint for overall stats
    const data = await fetchData('/api/admin/overall-stats'); 

    document.getElementById('totalUrlsStat').textContent = data.urls || 0;
    document.getElementById('totalUsersStat').textContent = data.users || 0;
    document.getElementById('totalClicksStat').textContent = data.clicks || 0; 
  } catch (error) {
    console.error('Error loading dashboard overview:', error);
    document.getElementById('totalUrlsStat').textContent = 'Hata';
    document.getElementById('totalUsersStat').textContent = 'Hata';
    document.getElementById('totalClicksStat').textContent = 'Hata';
  }
}

async function loadAllUrls() {
  const tableBody = document.getElementById('allUrlsTableBody');
  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Yükleniyor...</td></tr>';
  try {
    // Use the endpoint that fetches all URLs for admin
    const data = await fetchData('/api/admin/all-urls'); 
    console.log('[Admin App] Received data for all URLs:', data); // Log received data
    
    if (!data || !data.urls || data.urls.length === 0) { // Check nested urls property
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Hiç URL bulunamadı.</td></tr>';
      return;
    }

    tableBody.innerHTML = ''; // Clear loading
    data.urls.forEach(url => {
      const tr = document.createElement('tr');
      const created = new Date(url.createdAt).toLocaleDateString();
      const expires = url.expirationDate ? new Date(url.expirationDate).toLocaleDateString() : '-';
      // Backend now populates owner email directly
      const ownerEmail = url.owner?.email || (url.owner ? 'ID: ' + url.owner : 'Anonim'); 
      const originalUrlShort = url.originalUrl.length > 40 ? url.originalUrl.substring(0, 40) + '...' : url.originalUrl;

      tr.innerHTML = `
        <td><a href="/r/${url.shortUrl}" target="_blank">${url.shortUrl}</a></td>
        <td title="${url.originalUrl}">${originalUrlShort}</td>
        <td>${ownerEmail}</td> 
        <td>${url.clicks || 0}</td>
        <td>${created}</td>
        <td>${expires}</td>
        <td>
          <button class="btn btn-sm btn-danger admin-delete-url" data-id="${url._id}" title="URL\'yi Sil">
            <i class="fas fa-trash"></i>
          </button>
          <!-- Optional: Add details button here if needed -->
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Add event listeners for delete buttons
    addAdminDeleteListeners();

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">URL listesi yüklenirken hata oluştu: ${error.message}</td></tr>`;
  }
}

async function loadAllUsers() {
  const tableBody = document.getElementById('allUsersTableBody');
  tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Yükleniyor...</td></tr>';
  try {
    // Use the endpoint that fetches all users
    const data = await fetchData('/api/admin/users');

     if (!data.users || data.users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Hiç kullanıcı bulunamadı.</td></tr>';
      return;
    }

    tableBody.innerHTML = ''; // Clear loading
    data.users.forEach(user => {
      const tr = document.createElement('tr');
      const registered = new Date(user.createdAt).toLocaleDateString();
      // Backend now calculates urlCount for in-memory
      const urlCount = user.urlCount !== undefined ? user.urlCount : '-'; 

      tr.innerHTML = `
        <td>${user.email}</td>
        <td>${registered}</td>
        <td>${urlCount}</td>
        <td>
           <button class="btn btn-sm btn-danger disabled" title="Kullanıcı Silme (Geliştirilecek)">
             <i class="fas fa-user-slash"></i>
           </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Kullanıcı listesi yüklenirken hata oluştu: ${error.message}</td></tr>`;
  }
}

async function loadAllClickLogs() {
  const tableBody = document.getElementById('allClickLogsTableBody');
  tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Yükleniyor...</td></tr>';
  try {
    // Use the endpoint that fetches all click stats
    const data = await fetchData('/api/admin/all-click-stats'); 

     if (!data.stats || data.stats.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Hiç tıklama kaydı bulunamadı (veya veritabanı bağlı değil).</td></tr>';
      return;
    }

    tableBody.innerHTML = ''; // Clear loading
    data.stats.forEach(stat => {
      const tr = document.createElement('tr');
      const timestamp = new Date(stat.timestamp).toLocaleString();
      // Backend now populates shortUrl directly
      const shortUrl = stat.shortUrl || 'N/A'; 

      tr.innerHTML = `
        <td>${timestamp}</td>
        <td><a href="/r/${shortUrl}" target="_blank">${shortUrl}</a></td>
        <td>${stat.ip || '-'}</td>
        <td><small title="${stat.userAgent}">${(stat.userAgent || '-').substring(0, 50)}...</small></td>
        <td><small title="${stat.referrer}">${(stat.referrer || '-').substring(0, 40)}...</small></td>
      `;
      tableBody.appendChild(tr);
    });

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Tıklama kayıtları yüklenirken hata oluştu: ${error.message}</td></tr>`;
  }
}

async function loadBlacklist() {
  const tableBody = document.getElementById('blacklistTableBody');
  tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Yükleniyor...</td></tr>';
  try {
    const data = await fetchData('/api/admin/blacklist');

    if (!data || data.length === 0) {
       tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Engellenmiş IP bulunamadı (veya veritabanı bağlı değil).</td></tr>';
       return;
    }

    tableBody.innerHTML = ''; // Clear loading
    data.forEach(item => {
      const tr = document.createElement('tr');
      const date = new Date(item.createdAt).toLocaleDateString();
      tr.innerHTML = `
        <td>${item.ip}</td>
        <td>${item.reason || '-'}</td>
        <td>${date}</td>
        <td>
          <button class="btn btn-sm btn-warning remove-blacklist" data-id="${item._id}" title="Engeli Kaldır">
            <i class="fas fa-undo"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    addBlacklistRemoveListeners();

  } catch (error) {
     tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">IP engelleme listesi yüklenirken hata oluştu: ${error.message}</td></tr>`;
  }
}

// --- Event Listeners Setup ---

function setupBlacklistForm() {
  const form = document.getElementById('blacklistForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ipInput = document.getElementById('blacklistIpInput');
    const reasonInput = document.getElementById('blacklistReasonInput');
    const ip = ipInput.value.trim();
    const reason = reasonInput.value.trim();

    if (!ip) {
      alert('Lütfen engellenecek IP adresini girin.');
      return;
    }

    try {
      await fetchData('/api/admin/blacklist', {
        method: 'POST',
        body: JSON.stringify({ ip, reason })
      });
      ipInput.value = '';
      reasonInput.value = '';
      loadBlacklist(); // Refresh list
      alert('IP başarıyla engellendi.');
    } catch (error) {
      alert(`IP engellenirken hata oluştu: ${error.message}`);
    }
  });
}

function addBlacklistRemoveListeners() {
  document.querySelectorAll('.remove-blacklist').forEach(button => {
    // Remove existing listener to prevent duplicates if list reloads
    button.replaceWith(button.cloneNode(true));
  });
  // Add listener to the new buttons
  document.querySelectorAll('.remove-blacklist').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-id');
        if (confirm('Bu IP adresinin engelini kaldırmak istediğinizden emin misiniz?')) {
          try {
            await fetchData(`/api/admin/blacklist/${id}`, { method: 'DELETE' });
            loadBlacklist(); // Refresh the list
            alert('IP engeli başarıyla kaldırıldı.');
          } catch (error) {
            alert(`IP engeli kaldırılırken hata oluştu: ${error.message}`);
          }
        }
      });
  });
}

function addAdminDeleteListeners() {
  document.querySelectorAll('.admin-delete-url').forEach(button => {
    button.replaceWith(button.cloneNode(true)); // Prevent duplicate listeners
  });
   document.querySelectorAll('.admin-delete-url').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-id');
        if (confirm('Bu URL\'yi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
          try {
            // IMPORTANT: This uses the user-level delete which requires ownership.
            // For a true admin delete, you would need a dedicated admin endpoint 
            // e.g., DELETE /api/admin/url/:id that bypasses ownership check.
            // Using the existing one for now for simplicity.
            await fetchData(`/api/url/${id}`, { method: 'DELETE' }); 
            loadAllUrls(); // Refresh the list
            alert('URL başarıyla silindi (Eğer yetkiniz varsa).');
          } catch (error) {
            alert(`URL silinirken hata oluştu: ${error.message}`);
          }
        }
      });
  });
} 
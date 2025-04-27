// API base URL
const API_URL = 'http://localhost:5000';

// DOM Elements
const shortenForm = document.getElementById('shortenForm');
const originalUrlInput = document.getElementById('originalUrl');
const expirationDateInput = document.getElementById('expirationDate');
const allowedIpsInput = document.getElementById('allowedIps');
const resultSection = document.getElementById('resultSection');
const shortUrlResult = document.getElementById('shortUrlResult');
const copyBtn = document.getElementById('copyBtn');
const qrBtn = document.getElementById('qrBtn');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const qrCodeImage = document.getElementById('qrCodeImage');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const dashboardLink = document.getElementById('dashboardLink');
const logoutLink = document.getElementById('logoutLink');

const homeSection = document.getElementById('homeSection');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const dashboardSection = document.getElementById('dashboardSection');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const urlList = document.getElementById('urlList');

const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    // Show dashboard link and logout
    dashboardLink.classList.remove('d-none');
    logoutLink.classList.remove('d-none');
    // Hide login and register buttons
    loginBtn.classList.add('d-none');
    registerBtn.classList.add('d-none');
    return true;
  } else {
    // Hide dashboard link and logout
    dashboardLink.classList.add('d-none');
    logoutLink.classList.add('d-none');
    // Show login and register buttons
    loginBtn.classList.remove('d-none');
    registerBtn.classList.remove('d-none');
    return false;
  }
}

// Show section
function showSection(section) {
  // Hide all sections
  homeSection.classList.add('d-none');
  loginSection.classList.add('d-none');
  registerSection.classList.add('d-none');
  dashboardSection.classList.add('d-none');
  
  // Show specified section
  section.classList.remove('d-none');
}

// Event listeners for navigation
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  showSection(loginSection);
});

registerBtn.addEventListener('click', (e) => {
  e.preventDefault();
  showSection(registerSection);
});

dashboardBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (checkAuth()) {
    showSection(dashboardSection);
    fetchUserUrls();
  } else {
    showSection(loginSection);
  }
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showSection(loginSection);
});

showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  showSection(registerSection);
});

// Logout functionality
logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  checkAuth();
  showSection(homeSection);
});

// Shorten URL form submission
shortenForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const originalUrl = originalUrlInput.value;
  const expirationDate = expirationDateInput.value || null;
  
  // Parse allowed IPs
  let allowedIps = null;
  if (allowedIpsInput.value.trim()) {
    allowedIps = allowedIpsInput.value.split(',').map(ip => ip.trim());
  }
  
  // Show loading state
  const submitBtn = shortenForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
  
  // Create request data
  const data = { 
    originalUrl,
    expirationDate,
    allowedIps
  };
  
  try {
    // Get auth token if available
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    if (token) {
      headers['x-auth-token'] = token;
    }
    
    // Send request to API
    const response = await fetch(`${API_URL}/api/url/shorten`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to shorten URL');
    }
    
    const result = await response.json();
    
    // Display result
    shortUrlResult.value = `${window.location.origin.replace(/:\d+$/, '')}:5000/r/${result.shortUrl}`;
    resultSection.classList.remove('d-none');
    resultSection.classList.add('show');
    
    // Show note about automatic IP inclusion
    const noteElement = document.createElement('div');
    noteElement.classList.add('alert', 'alert-info', 'mt-3');
    noteElement.innerHTML = '<small><i class="fas fa-info-circle me-1"></i> Not: Sizin IP adresiniz otomatik olarak izin verilen IP\'ler listesine eklenmiştir.</small>';
    
    // Check if note already exists
    if (!document.querySelector('.alert-info')) {
      document.querySelector('#resultSection .card-body').appendChild(noteElement);
    }
    
    // Reset form
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
  } catch (error) {
    console.error('Error shortening URL:', error);
    alert('Error shortening URL. Please try again.');
    
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'URL\'yi Kısalt';
  }
});

// Copy to clipboard functionality
copyBtn.addEventListener('click', () => {
  shortUrlResult.select();
  document.execCommand('copy');
  
  // Show copy feedback
  const originalText = copyBtn.innerHTML;
  copyBtn.innerHTML = '<i class="fas fa-check me-1"></i>Kopyalandı';
  
  setTimeout(() => {
    copyBtn.innerHTML = originalText;
  }, 2000);
});

// QR code functionality
qrBtn.addEventListener('click', async () => {
  const shortUrl = shortUrlResult.value;
  
  if (!shortUrl) return;
  
  try {
    const response = await fetch(`${API_URL}/api/url/qrcode/${shortUrl.split('/').pop()}`);
    
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
    
    const result = await response.json();
    
    // Display QR code
    qrCodeImage.src = result.qrCode;
    qrCodeContainer.classList.remove('d-none');
    qrCodeContainer.classList.add('show');
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    alert('Error generating QR code. Please try again.');
  }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const result = await response.json();
    
    // Save token to localStorage
    localStorage.setItem('token', result.token);
    
    // Update UI
    checkAuth();
    showSection(homeSection);
    
    // Reset form
    loginForm.reset();
    
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please check your credentials and try again.');
  }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const result = await response.json();
    
    // Save token to localStorage
    localStorage.setItem('token', result.token);
    
    // Update UI
    checkAuth();
    showSection(homeSection);
    
    // Reset form
    registerForm.reset();
    
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  }
});

// Fetch user URLs for dashboard
async function fetchUserUrls() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/url/all`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch URLs');
    }
    
    const urls = await response.json();
    
    // Clear current URL list
    urlList.innerHTML = '';
    
    if (urls.length === 0) {
      urlList.innerHTML = '<tr><td colspan="6" class="text-center">No URLs found</td></tr>';
      return;
    }
    
    // Populate URL list
    urls.forEach(url => {
      const tr = document.createElement('tr');
      
      // Format date
      const createdDate = new Date(url.createdAt).toLocaleDateString();
      const expirationDate = url.expirationDate ? new Date(url.expirationDate).toLocaleDateString() : 'N/A';
      const originalUrlShort = url.originalUrl.length > 30 ? url.originalUrl.substring(0, 30) + '...' : url.originalUrl;
      
      tr.innerHTML = `
        <td><a href="${API_URL}/r/${url.shortUrl}" target="_blank">${url.shortUrl}</a></td>
        <td title="${url.originalUrl}">${originalUrlShort}</td>
        <td>${url.clicks}</td>
        <td>${createdDate}</td>
        <td>${expirationDate}</td>
        <td>
          <button class="btn btn-sm btn-info details-btn" data-id="${url._id}" data-short="${url.shortUrl}" data-original="${url.originalUrl}" title="Detayları Görüntüle">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="btn btn-sm btn-secondary qr-code" data-short="${url.shortUrl}" title="QR Kodu Göster">
            <i class="fas fa-qrcode"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-url" data-id="${url._id}" title="Sil">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      urlList.appendChild(tr);
    });
    
    // Add event listeners for details buttons
    document.querySelectorAll('.details-btn').forEach(button => {
      button.addEventListener('click', () => {
        const urlId = button.getAttribute('data-id');
        const shortUrl = button.getAttribute('data-short');
        const originalUrl = button.getAttribute('data-original');
        fetchUrlDetails(urlId, shortUrl, originalUrl);
      });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-url').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-id');
        
        if (confirm('Are you sure you want to delete this URL?')) {
          try {
            const response = await fetch(`${API_URL}/api/url/${id}`, {
              method: 'DELETE',
              headers: {
                'x-auth-token': token
              }
            });
            
            if (!response.ok) {
              throw new Error('Failed to delete URL');
            }
            
            // Refresh URL list
            fetchUserUrls();
            
          } catch (error) {
            console.error('Error deleting URL:', error);
            alert('Error deleting URL. Please try again.');
          }
        }
      });
    });
    
    // Add event listeners for QR code buttons
    document.querySelectorAll('.qr-code').forEach(button => {
      button.addEventListener('click', async () => {
        const shortUrl = button.getAttribute('data-short');
        
        try {
          const response = await fetch(`${API_URL}/api/url/qrcode/${shortUrl}`);
          
          if (!response.ok) {
            throw new Error('Failed to generate QR code');
          }
          
          const result = await response.json();
          
          // Create modal to display QR code
          const modal = document.createElement('div');
          modal.classList.add('modal', 'fade');
          modal.id = 'qrModal';
          modal.setAttribute('tabindex', '-1');
          modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">QR Code for ${shortUrl}</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                  <img src="${result.qrCode}" alt="QR Code" class="img-fluid" style="max-width: 300px;">
                </div>
                <div class="modal-footer">
                  <a href="${result.qrCode}" download="qrcode.png" class="btn btn-primary">Download</a>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
              </div>
            </div>
          `;
          
          document.body.appendChild(modal);
          
          // Show modal
          const modalInstance = new bootstrap.Modal(modal);
          modalInstance.show();
          
          // Remove modal when hidden
          modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
          });
          
        } catch (error) {
          console.error('Error generating QR code:', error);
          alert('Error generating QR code. Please try again.');
        }
      });
    });
    
  } catch (error) {
    console.error('Error fetching URLs:', error);
    urlList.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading URLs</td></tr>';
  }
}

// Function to fetch and display URL details
async function fetchUrlDetails(urlId, shortUrl, originalUrl) {
  const token = localStorage.getItem('token');
  if (!token) return;

  const modalStatsBody = document.getElementById('modalStatsTableBody');
  const modalShortUrl = document.getElementById('modalShortUrl');
  const modalOriginalUrl = document.getElementById('modalOriginalUrl');
  const modalElement = document.getElementById('urlDetailsModal');
  const urlDetailsModal = new bootstrap.Modal(modalElement);

  // Set basic info
  modalShortUrl.textContent = shortUrl;
  modalOriginalUrl.textContent = originalUrl;
  modalStatsBody.innerHTML = '<tr><td colspan="4" class="text-center"><span class="spinner-border spinner-border-sm"></span> Loading...</td></tr>';
  
  urlDetailsModal.show();

  try {
    const response = await fetch(`${API_URL}/api/admin/stats/${urlId}`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (response.status === 503) {
      modalStatsBody.innerHTML = '<tr><td colspan="4" class="text-center text-warning">Detaylı istatistikler için veritabanı bağlantısı gereklidir.</td></tr>';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch URL details');
    }

    const data = await response.json();

    if (data.stats && data.stats.length > 0) {
      modalStatsBody.innerHTML = ''; // Clear loading indicator
      data.stats.forEach(stat => {
        const tr = document.createElement('tr');
        const timestamp = new Date(stat.timestamp).toLocaleString();
        tr.innerHTML = `
          <td>${timestamp}</td>
          <td>${stat.ip || 'N/A'}</td>
          <td><small>${stat.userAgent || 'N/A'}</small></td>
          <td><small>${stat.referrer || 'N/A'}</small></td>
        `;
        modalStatsBody.appendChild(tr);
      });
    } else {
      modalStatsBody.innerHTML = '<tr><td colspan="4" class="text-center">Bu URL için tıklama kaydı bulunamadı.</td></tr>';
    }

  } catch (error) {
    console.error('Error fetching URL details:', error);
    modalStatsBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Hata: ${error.message}</td></tr>`;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
}); 
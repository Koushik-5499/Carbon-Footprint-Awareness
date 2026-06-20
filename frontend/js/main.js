// Base API URL
const API_URL = window.location.origin;

// Centralized API call function
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            // Handle 401 Unauthorized globally
            if(response.status === 401) {
                logout();
            }
            throw new Error(data.error || 'API Request Failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show alert utility
function showAlert(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `alert ${type}`;
    // Auto hide after 5s
    setTimeout(() => {
        el.className = 'alert hidden';
    }, 5000);
}

// Global Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Generate Auth Navbar (used in protected pages)
function renderAuthNav() {
    const nav = document.createElement('nav');
    nav.innerHTML = `
        <div class="logo">
            <i class="fa-solid fa-leaf"></i> EcoTrack
        </div>
        <ul class="nav-links">
            <li><a href="dashboard.html"><i class="fa-solid fa-chart-pie"></i> Dashboard</a></li>
            <li><a href="impact.html"><i class="fa-solid fa-earth-americas"></i> Impact</a></li>
            <li><a href="calculator.html"><i class="fa-solid fa-calculator"></i> Calculator</a></li>
            <li><a href="challenges.html"><i class="fa-solid fa-trophy"></i> Challenges</a></li>
            <li><a href="leaderboard.html"><i class="fa-solid fa-medal"></i> Leaderboard</a></li>
            <li><a href="ai-assistant.html"><i class="fa-solid fa-robot"></i> AI Assistant</a></li>
            <li><a href="admin.html"><i class="fa-solid fa-user-shield"></i> Admin</a></li>
            <li><a href="#" onclick="logout()" class="btn btn-secondary" style="padding: 0.4rem 1rem;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
        </ul>
    `;
    document.body.insertBefore(nav, document.body.firstChild);

    // Set active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

// Check auth on protected pages
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

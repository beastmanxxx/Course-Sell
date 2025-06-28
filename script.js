// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Authentication state
let currentUser = null;
let isAdmin = false;
let allUsers = [];
let firebaseInitialized = false;

// Global variables for course search
let allCourses = [];
let filteredCourses = [];

// Show demo mode indicator
function showDemoModeIndicator() {
    // Remove existing indicator
    const existingIndicator = document.querySelector('.demo-mode-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create demo mode indicator
    const indicator = document.createElement('div');
    indicator.className = 'demo-mode-indicator';
    indicator.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Demo Mode - Firebase not available</span>
    `;
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ffc107;
        color: #000;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-size: 0.8rem;
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: slideInRight 0.5s ease;
    `;
    
    document.body.appendChild(indicator);
    
    // Add animation keyframes if not exists
    if (!document.querySelector('#demo-mode-styles')) {
        const style = document.createElement('style');
        style.id = 'demo-mode-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Update UI for demo mode
function updateUIForDemoMode() {
    showDemoModeIndicator();
    
    // Update login button to show demo mode
    const loginBtn = document.querySelector('.login-btn');
    const mobileLoginBtn = document.querySelector('.mobile-login-btn');
    
    if (loginBtn) {
        loginBtn.textContent = 'Demo Mode';
        loginBtn.style.background = '#ffc107';
        loginBtn.style.color = '#000';
        loginBtn.onclick = () => {
            alert('Demo Mode: Firebase is not available. You can still test the admin panel functionality.');
            openAdminPanel();
        };
    }
    
    if (mobileLoginBtn) {
        mobileLoginBtn.textContent = 'Demo Mode';
        mobileLoginBtn.style.background = '#ffc107';
        mobileLoginBtn.style.color = '#000';
        mobileLoginBtn.onclick = () => {
            alert('Demo Mode: Firebase is not available. You can still test the admin panel functionality.');
            openAdminPanel();
        };
    }
    
    // Show admin button in demo mode
    isAdmin = true;
    updateAdminButtonVisibility();
}

// Check if Firebase is available
function checkFirebaseAvailability() {
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            firebaseInitialized = true;
            return true;
        }
    } catch (error) {
        console.warn('Firebase not available:', error);
    }
    firebaseInitialized = false;
    return false;
}

// Check authentication state on page load
function initializeAuth() {
    if (!checkFirebaseAvailability()) {
        console.log('Firebase not available, running in demo mode');
        updateUIForDemoMode();
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            checkAdminStatus(user);
            updateUIForAuthenticatedUser(user);
            closeAuthModal();
            
            // Set up real-time listener for admin status changes
            if (firebaseInitialized) {
                const userDocRef = db.collection('users').doc(user.uid);
                userDocRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        const wasAdmin = isAdmin;
                        
                        // Check for permanent admin first, then Firestore admin status
                        if (user.email === 'moghaeashu@gmail.com') {
                            isAdmin = true;
                        } else {
                            isAdmin = userData.isAdmin === true;
                        }
                        
                        // If admin status changed, update UI
                        if (wasAdmin !== isAdmin) {
                            updateAdminButtonVisibility();
                            console.log(`Admin status changed: ${isAdmin ? 'Granted' : 'Revoked'}`);
                        }
                    }
                });
            }
        } else {
            currentUser = null;
            isAdmin = false;
            updateUIForUnauthenticatedUser();
        }
    });
}

// Check if user is admin
async function checkAdminStatus(user) {
    try {
        if (!firebaseInitialized) {
            // Demo mode - allow admin access for testing
            isAdmin = true;
            updateAdminButtonVisibility();
            return;
        }
        
        // Check if user is the permanent admin
        if (user.email === 'moghaeashu@gmail.com') {
            isAdmin = true;
            updateAdminButtonVisibility();
            return;
        }
        
        // Check user's admin status from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            isAdmin = userData.isAdmin === true;
            updateAdminButtonVisibility();
        } else {
            // If user document doesn't exist, they're not admin
            isAdmin = false;
            updateAdminButtonVisibility();
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        // In case of error, don't grant admin access
        isAdmin = false;
        updateAdminButtonVisibility();
    }
}

// Update admin button visibility
function updateAdminButtonVisibility() {
    const adminBtn = document.querySelector('.admin-btn');
    const mobileAdminBtn = document.querySelector('.mobile-admin-btn');
    
    if (isAdmin) {
        if (adminBtn) adminBtn.style.display = 'flex';
        if (mobileAdminBtn) mobileAdminBtn.style.display = 'block';
    } else {
        if (adminBtn) adminBtn.style.display = 'none';
        if (mobileAdminBtn) mobileAdminBtn.style.display = 'none';
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    const mobileLoginBtn = document.querySelector('.mobile-login-btn');
    
    if (loginBtn) {
        loginBtn.textContent = user.displayName || 'My Account';
        loginBtn.onclick = () => showUserMenu();
    }
    
    if (mobileLoginBtn) {
        mobileLoginBtn.textContent = user.displayName || 'My Account';
        mobileLoginBtn.onclick = () => showUserMenu();
    }
    
    updateAdminButtonVisibility();
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    const loginBtn = document.querySelector('.login-btn');
    const mobileLoginBtn = document.querySelector('.mobile-login-btn');
    
    if (loginBtn) {
        loginBtn.textContent = 'Login/Register';
        loginBtn.onclick = () => openAuthModal();
    }
    
    if (mobileLoginBtn) {
        mobileLoginBtn.textContent = 'Login/Register';
        mobileLoginBtn.onclick = () => openAuthModal();
    }
    
    updateAdminButtonVisibility();
}

// Google Sign In function
async function signInWithGoogle() {
    try {
        if (!firebaseInitialized) {
            alert('Firebase not available. Please check your internet connection and try again.');
            return;
        }
        
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Store user data in Firestore
        await storeUserData(user);
        
        console.log('Successfully signed in:', user.displayName);
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Error signing in. Please try again.');
    }
}

// Store user data in Firestore
async function storeUserData(user) {
    try {
        if (!firebaseInitialized) return;
        
        // Get existing user data to preserve admin status
        const existingDoc = await db.collection('users').doc(user.uid).get();
        const existingData = existingDoc.exists ? existingDoc.data() : {};
        
        const userData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: user.email === 'moghaeashu@gmail.com' || existingData.isAdmin || false // Permanent admin or preserve existing admin status
        };
        
        await db.collection('users').doc(user.uid).set(userData, { merge: true });
        console.log('User data stored successfully');
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

// Admin Panel Functions
function openAdminPanel() {
    // Check if we're in demo mode
    if (!firebaseInitialized) {
        // Demo mode - allow admin access
        isAdmin = true;
        currentUser = { displayName: 'Demo User', email: 'demo@example.com' };
    }
    
    // Check if user is logged in
    if (!currentUser) {
        if (firebaseInitialized) {
            openAuthModal();
        } else {
            // In demo mode, allow access
            isAdmin = true;
            currentUser = { displayName: 'Demo User', email: 'demo@example.com' };
        }
        return;
    }
    
    // Check admin privileges
    if (!isAdmin) {
        alert('Access denied. Admin privileges required.\n\nTo get admin access, please contact the website administrator or set isAdmin: true in your Firebase user document.');
        return;
    }
    
    const modal = document.getElementById('adminModal');
    if (!modal) {
        console.error('Admin modal not found');
        return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add mobile-specific optimizations
    if (window.innerWidth <= 768) {
        // Scroll to top of modal on mobile
        setTimeout(() => {
            const modalContent = modal.querySelector('.admin-modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }, 100);
    }
    
    loadUsers();
}

function closeAdminPanel() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function switchAdminTab(tab) {
    const tabs = document.querySelectorAll('.admin-tab-btn');
    const contents = document.querySelectorAll('.admin-tab-content');
    
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.style.display = 'none');
    
    event.target.classList.add('active');
    const targetContent = document.getElementById(tab + 'Tab');
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    if (tab === 'users') {
        loadUsers();
    } else if (tab === 'courses') {
        loadCourses();
    }
    
    // Mobile optimization: scroll to top of content
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            const activeContent = document.getElementById(tab + 'Tab');
            if (activeContent) {
                activeContent.scrollTop = 0;
            }
        }, 100);
    }
}

// Load users from Firestore
async function loadUsers() {
    try {
        if (!firebaseInitialized) {
            // Demo mode - show sample users
            displayDemoUsers();
            return;
        }
        
        const usersSnapshot = await db.collection('users').get();
        allUsers = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                ...userData,
                createdAt: userData.createdAt ? userData.createdAt.toDate() : new Date(),
                lastLogin: userData.lastLogin ? userData.lastLogin.toDate() : new Date()
            });
        });
        
        displayUsers(allUsers);
        
        // Add mobile scroll indicator
        if (window.innerWidth <= 768) {
            addMobileScrollIndicator();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Show demo users if Firebase fails
        displayDemoUsers();
    }
}

// Display demo users for testing
function displayDemoUsers() {
    const demoUsers = [
        {
            id: 'demo1',
            displayName: 'John Doe',
            email: 'john@example.com',
            uid: 'demo-uid-1',
            photoURL: 'https://randomuser.me/api/portraits/men/1.jpg',
            createdAt: new Date('2024-01-15'),
            lastLogin: new Date(),
            isAdmin: false
        },
        {
            id: 'demo2',
            displayName: 'Jane Smith',
            email: 'jane@example.com',
            uid: 'demo-uid-2',
            photoURL: 'https://randomuser.me/api/portraits/women/1.jpg',
            createdAt: new Date('2024-02-20'),
            lastLogin: new Date(),
            isAdmin: true
        },
        {
            id: 'demo3',
            displayName: 'Admin User',
            email: 'moghaeashu@gmail.com',
            uid: 'admin-uid',
            photoURL: 'https://randomuser.me/api/portraits/men/3.jpg',
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date(),
            isAdmin: true
        }
    ];
    
    allUsers = demoUsers;
    displayUsers(demoUsers);
}

// Add mobile scroll indicator
function addMobileScrollIndicator() {
    const tableContainer = document.querySelector('.users-table-container');
    if (!tableContainer) return;
    
    // Remove existing indicator
    const existingIndicator = document.querySelector('.scroll-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create scroll indicator
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '<i class="fas fa-arrows-alt-h"></i> Scroll horizontally';
    indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: fadeInOut 3s ease-in-out;
    `;
    
    tableContainer.appendChild(indicator);
    
    // Remove indicator after animation
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 3000);
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const isMobile = window.innerWidth <= 768;
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="user-info-cell">
                    <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="Profile" class="user-avatar-small">
                    <div>
                        <div class="user-name">${user.displayName || 'Unknown'}</div>
                        <div class="user-uid">${user.uid}</div>
                    </div>
                </div>
            </td>
            <td>${user.email || 'N/A'}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${formatDate(user.lastLogin)}</td>
            <td>
                <div class="user-actions">
                    <button class="action-btn edit-btn" onclick="editUser('${user.id}')" title="Edit User" ${isMobile ? 'style="min-width: 32px; min-height: 32px;"' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')" title="Delete User" ${isMobile ? 'style="min-width: 32px; min-height: 32px;"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn ${user.isAdmin ? 'admin-active' : 'admin-inactive'}" 
                            onclick="toggleAdminStatus('${user.id}', ${!user.isAdmin})" 
                            title="${user.isAdmin ? 'Remove Admin' : 'Make Admin'}" ${isMobile ? 'style="min-width: 32px; min-height: 32px;"' : ''}>
                        <i class="fas fa-crown"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.uid.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
}

// Refresh users
function refreshUsers() {
    loadUsers();
}

// Format date
function formatDate(date) {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Edit user (placeholder)
function editUser(userId) {
    alert('Edit user functionality coming soon!');
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        if (!firebaseInitialized) {
            alert('Firebase not available. User cannot be deleted in demo mode.');
            return;
        }
        
        await db.collection('users').doc(userId).delete();
        console.log('User deleted successfully');
        
        // Refresh users list
        loadUsers();
        
        alert('User deleted successfully!');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
    }
}

// Toggle admin status
async function toggleAdminStatus(userId, makeAdmin) {
    try {
        if (!firebaseInitialized) {
            alert('Firebase not available. Admin status cannot be changed in demo mode.');
            return;
        }
        
        await db.collection('users').doc(userId).update({
            isAdmin: makeAdmin
        });
        
        console.log(`Admin status ${makeAdmin ? 'granted' : 'revoked'} successfully`);
        
        // Refresh users list
        loadUsers();
        
        // If the current user's admin status was changed, refresh their status
        if (currentUser && currentUser.uid === userId) {
            await refreshCurrentUserAdminStatus();
        }
        
        alert(`Admin status ${makeAdmin ? 'granted' : 'revoked'} successfully!`);
    } catch (error) {
        console.error('Error updating admin status:', error);
        alert('Error updating admin status. Please try again.');
    }
}

// Show user menu
function showUserMenu() {
    if (!currentUser) return;
    
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <div class="user-info">
                <img src="${currentUser.photoURL || 'https://via.placeholder.com/40'}" alt="Profile" class="user-avatar">
                <div>
                    <h4>${currentUser.displayName}</h4>
                    <p>${currentUser.email}</p>
                </div>
            </div>
            <div class="user-menu-links">
                <a href="#" onclick="showMyCourses()">My Courses</a>
                <a href="#" onclick="showProfile()">Profile</a>
                ${isAdmin ? '<a href="#" onclick="openAdminPanel()">Admin Panel</a>' : ''}
                <a href="#" onclick="signOut()">Sign Out</a>
            </div>
        </div>
    `;
    
    // Remove existing menu if any
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('.login-btn') && !e.target.closest('.mobile-login-btn')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Sign out function
async function signOut() {
    try {
        await auth.signOut();
        console.log('Successfully signed out');
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Show my courses (placeholder)
function showMyCourses() {
    alert('My Courses feature coming soon!');
}

// Show profile (placeholder)
function showProfile() {
    alert('Profile feature coming soon!');
}

// Close admin modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target.id === 'adminModal') {
                closeAdminPanel();
            }
        });
    }
    
    // Initialize admin button visibility
    updateAdminButtonVisibility();
});

// Custom Cursor
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    // Add delay to follower
    setTimeout(() => {
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
    }, 100);
});

// Cursor effects on interactive elements
const interactiveElements = document.querySelectorAll('a, button, .course-card, .feature-card');

interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursorFollower.style.transform = 'scale(1.5)';
        cursorFollower.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
    });

    element.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursorFollower.style.transform = 'scale(1)';
        cursorFollower.style.backgroundColor = 'rgba(255, 107, 107, 0.3)';
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add scrolled class when page is scrolled
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Hide/show navbar on scroll
    if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down
        navbar.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Parallax effect for hero image
const heroImage = document.querySelector('.hero-image img');

window.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const xPos = (clientX / window.innerWidth - 0.5) * 20;
    const yPos = (clientY / window.innerHeight - 0.5) * 20;
    
    heroImage.style.transform = `perspective(1000px) rotateY(${xPos}deg) rotateX(${-yPos}deg)`;
});

// Course card hover effect
const courseCards = document.querySelectorAll('.course-card');

courseCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Intersection Observer for fade-in animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.course-card, .feature-card, .testimonial-card').forEach(element => {
    observer.observe(element);
});

// Auth Modal Functions
function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        loginTab.style.display = 'block';
        registerTab.style.display = 'none';
    } else {
        loginTab.style.display = 'none';
        registerTab.style.display = 'block';
    }
}

// Close modal when clicking outside
document.getElementById('authModal').addEventListener('click', (e) => {
    if (e.target.id === 'authModal') {
        closeAuthModal();
    }
});

// Slideshow functionality
function changeSlide(button, direction) {
    const slideshow = button.closest('.slideshow-container');
    const slides = slideshow.querySelectorAll('.slide');
    const currentSlide = slideshow.querySelector('.slide.active');
    let currentIndex = Array.from(slides).indexOf(currentSlide);
    
    // Remove active class from current slide
    currentSlide.classList.remove('active');
    
    // Calculate new index
    currentIndex = (currentIndex + direction + slides.length) % slides.length;
    
    // Add active class to new slide
    slides[currentIndex].classList.add('active');
}

// Initialize slideshows
document.addEventListener('DOMContentLoaded', () => {
    const slideshows = document.querySelectorAll('.slideshow-container');
    slideshows.forEach(slideshow => {
        const slides = slideshow.querySelectorAll('.slide');
        if (slides.length > 0) {
            slides[0].classList.add('active');
        }
    });
});

// Course page function
function openCoursePage(courseId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    window.location.href = `course-purchase.html?course=${courseId}`;
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

// Scroll to courses section
function scrollToCourses() {
    const coursesSection = document.getElementById('courses');
    coursesSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// WhatsApp redirect function
function redirectToWhatsApp(type) {
    const phoneNumber = '+1234567890'; // Replace with your actual WhatsApp number
    const message = type === 'contact' ? 'Hi! I would like to know more about Trade Mastery courses.' : 'Hi! I would like to purchase a course.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Course management variables
let editingCourseId = null;

// Load courses from Firestore
async function loadCourses() {
    try {
        if (!firebaseInitialized) {
            // Demo mode - show sample courses
            displayDemoCourses();
            return;
        }
        
        const coursesSnapshot = await db.collection('courses').orderBy('createdAt', 'desc').get();
        const courses = [];
        
        coursesSnapshot.forEach(doc => {
            courses.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        // Show demo courses if Firebase fails
        displayDemoCourses();
    }
}

// Display demo courses for testing
function displayDemoCourses() {
    const demoCourses = [
        {
            id: 'demo-course-1',
            title: 'Web Development Masterclass',
            description: 'Learn HTML, CSS, JavaScript, React, and Node.js',
            price: 99,
            videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            imageLink: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80',
            createdAt: new Date('2024-06-28') // Newest first
        },
        {
            id: 'demo-course-2',
            title: 'Data Science Fundamentals',
            description: 'Master Python, R, and machine learning algorithms',
            price: 129,
            videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            imageLink: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            createdAt: new Date('2024-06-27')
        },
        {
            id: 'demo-course-3',
            title: 'Digital Marketing Pro',
            description: 'SEO, social media marketing, and analytics',
            price: 79,
            videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            imageLink: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            createdAt: new Date('2024-06-26')
        }
    ];
    
    // Sort demo courses by creation date (newest first)
    demoCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    displayCourses(demoCourses);
}

// Display courses in table
function displayCourses(courses) {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const isMobile = window.innerWidth <= 768;
    
    courses.forEach(course => {
        // Check if course is new (created within last 7 days)
        const isNew = course.createdAt && 
                     (new Date() - new Date(course.createdAt.toDate ? course.createdAt.toDate() : course.createdAt)) < (7 * 24 * 60 * 60 * 1000);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="course-info-cell">
                    <img src="${course.imageLink || 'https://via.placeholder.com/48x32'}" alt="Course" class="course-thumbnail">
                    <div>
                        <div class="course-title">
                            ${course.title || 'Untitled Course'}
                            ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                        </div>
                        <div class="course-id">${course.id || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td>
                ${course.title || 'Untitled Course'}
                ${isNew ? '<span class="new-badge">NEW</span>' : ''}
            </td>
            <td>$${course.price || 0}</td>
            <td>
                <a href="${course.videoLink || '#'}" target="_blank" class="video-link">
                    ${course.videoLink || 'No video link'}
                </a>
            </td>
            <td>
                <div class="course-actions">
                    <button class="action-btn edit-btn" onclick="editCourse('${course.id}')" title="Edit Course" ${isMobile ? 'style="min-width: 32px; min-height: 32px;"' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCourse('${course.id}')" title="Delete Course" ${isMobile ? 'style="min-width: 32px; min-height: 32px;"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show add course form
function showAddCourseForm() {
    const container = document.getElementById('courseFormContainer');
    const form = document.getElementById('courseForm');
    const title = document.getElementById('courseFormTitle');
    
    if (container && form && title) {
        // Reset form
        form.reset();
        form.dataset.courseId = '';
        title.textContent = 'Add New Course';
        container.style.display = 'block';
        
        // Scroll to form
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Edit course
function editCourse(courseId) {
    try {
        if (!firebaseInitialized) {
            alert('Firebase not available. Cannot edit courses in demo mode.');
            return;
        }
        
        // Find course in demo data or Firebase
        const course = allUsers.find(c => c.id === courseId) || 
                      (firebaseInitialized ? null : null);
        
        if (!course) {
            alert('Course not found.');
            return;
        }
        
        const container = document.getElementById('courseFormContainer');
        const form = document.getElementById('courseForm');
        const title = document.getElementById('courseFormTitle');
        
        if (container && form && title) {
            // Fill form with course data
            document.getElementById('courseTitle').value = course.title || '';
            document.getElementById('coursePrice').value = course.price || '';
            document.getElementById('courseDescription').value = course.description || '';
            document.getElementById('courseVideoLink').value = course.videoLink || '';
            document.getElementById('courseImageLink').value = course.imageLink || '';
            
            form.dataset.courseId = courseId;
            title.textContent = 'Edit Course';
            container.style.display = 'block';
            
            // Scroll to form
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error('Error editing course:', error);
        alert('Error loading course data. Please try again.');
    }
}

// Cancel course form
function cancelCourseForm() {
    const container = document.getElementById('courseFormContainer');
    const form = document.getElementById('courseForm');
    
    if (container) {
        container.style.display = 'none';
    }
    
    if (form) {
        form.reset();
        form.dataset.courseId = '';
    }
}

// Save course to Firestore
async function saveCourse(event) {
    event.preventDefault();
    
    try {
        if (!firebaseInitialized) {
            alert('Firebase not available. Course cannot be saved in demo mode.');
            return;
        }
        
        const formData = {
            title: document.getElementById('courseTitle').value,
            price: parseFloat(document.getElementById('coursePrice').value),
            description: document.getElementById('courseDescription').value,
            videoLink: document.getElementById('courseVideoLink').value,
            imageLink: document.getElementById('courseImageLink').value || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const courseId = document.getElementById('courseForm').dataset.courseId;
        
        if (courseId) {
            // Update existing course
            await db.collection('courses').doc(courseId).update(formData);
            console.log('Course updated successfully');
        } else {
            // Add new course with creation timestamp
            formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('courses').add(formData);
            console.log('Course added successfully');
        }
        
        // Reset form and hide it
        cancelCourseForm();
        
        // Refresh courses list (new courses will appear at top)
        loadCourses();
        
        alert(courseId ? 'Course updated successfully!' : 'Course added successfully!');
    } catch (error) {
        console.error('Error saving course:', error);
        alert('Error saving course. Please try again.');
    }
}

// Delete course from Firestore
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) {
        return;
    }
    
    try {
        if (!firebaseInitialized) {
            alert('Firebase not available. Course cannot be deleted in demo mode.');
            return;
        }
        
        await db.collection('courses').doc(courseId).delete();
        console.log('Course deleted successfully');
        
        // Refresh courses list
        loadCourses();
        
        alert('Course deleted successfully!');
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course. Please try again.');
    }
}

// Refresh courses
function refreshCourses() {
    loadCourses();
}

// Load and display courses on main page
async function loadFeaturedCourses() {
    try {
        if (!firebaseInitialized) {
            // Demo mode - show default courses
            displayDefaultCourses();
            return;
        }
        
        const coursesSnapshot = await db.collection('courses').orderBy('createdAt', 'desc').limit(6).get();
        const courses = [];
        
        coursesSnapshot.forEach(doc => {
            courses.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Store all courses globally for search
        allCourses = courses;
        
        displayFeaturedCourses(courses);
    } catch (error) {
        console.error('Error loading featured courses:', error);
        // Show default courses if Firebase fails
        displayDefaultCourses();
    }
}

// Convert YouTube URL to embedded video URL
function getEmbeddedVideoUrl(url) {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    let videoId = null;
    
    // youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
        }
    }
    // youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
        const questionPosition = videoId.indexOf('?');
        if (questionPosition !== -1) {
            videoId = videoId.substring(0, questionPosition);
        }
    }
    // youtube.com/embed/VIDEO_ID
    else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1];
        const questionPosition = videoId.indexOf('?');
        if (questionPosition !== -1) {
            videoId = videoId.substring(0, questionPosition);
        }
    }
    
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
    }
    
    return null;
}

// Display featured courses on main page
function displayFeaturedCourses(courses) {
    const courseGrid = document.querySelector('.course-grid');
    if (!courseGrid) return;
    
    if (courses.length === 0) {
        displayDefaultCourses();
        return;
    }
    
    courseGrid.innerHTML = '';
    
    courses.forEach((course, index) => {
        // Check if course is new (created within last 7 days)
        const isNew = course.createdAt && 
                     (new Date() - new Date(course.createdAt.toDate ? course.createdAt.toDate() : course.createdAt)) < (7 * 24 * 60 * 60 * 1000);
        
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.setAttribute('data-aos', 'fade-up');
        if (index > 0) {
            courseCard.setAttribute('data-aos-delay', (index * 100).toString());
        }
        
        // Get embedded video URL
        const embeddedVideoUrl = getEmbeddedVideoUrl(course.videoLink);
        
        courseCard.innerHTML = `
            <div class="course-video-container">
                ${embeddedVideoUrl ? 
                    `<iframe 
                        src="${embeddedVideoUrl}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        class="course-video"
                        title="${course.title} Preview">
                    </iframe>` :
                    `<div class="course-video-placeholder">
                        <i class="fas fa-play-circle"></i>
                        <p>Video Preview</p>
                    </div>`
                }
                ${isNew ? '<div class="new-course-badge">NEW</div>' : ''}
            </div>
            <div class="course-content">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <span class="price">$${course.price}</span>
                <div class="course-actions">
                    <button class="buy-btn" onclick="openCoursePage('${course.id}')">Buy Now</button>
                </div>
            </div>
        `;
        
        courseGrid.appendChild(courseCard);
    });
}

// Play video preview in modal
function playVideoPreview(videoUrl, title) {
    // Create modal for video preview
    const modal = document.createElement('div');
    modal.className = 'video-preview-modal';
    modal.innerHTML = `
        <div class="video-preview-content">
            <div class="video-preview-header">
                <h3>${title}</h3>
                <button class="close-video-preview" onclick="closeVideoPreview()">&times;</button>
            </div>
            <div class="video-preview-frame">
                <iframe 
                    src="${videoUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    title="${title} Preview">
                </iframe>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoPreview();
        }
    });
}

// Close video preview modal
function closeVideoPreview() {
    const modal = document.querySelector('.video-preview-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Display default courses if no courses from admin
function displayDefaultCourses() {
    const courseGrid = document.querySelector('.course-grid');
    if (!courseGrid) return;
    
    const defaultCourses = [
        {
            id: 'web-development',
            title: 'Web Development',
            description: 'Master modern web technologies',
            price: 99,
            createdAt: new Date('2024-06-28')
        },
        {
            id: 'data-science',
            title: 'Data Science',
            description: 'Learn data analysis and ML',
            price: 129,
            createdAt: new Date('2024-06-27')
        },
        {
            id: 'digital-marketing',
            title: 'Digital Marketing',
            description: 'Master online marketing strategies',
            price: 79,
            createdAt: new Date('2024-06-26')
        }
    ];
    
    // Store default courses globally for search
    allCourses = defaultCourses;
    
    courseGrid.innerHTML = `
        <div class="course-card" data-aos="fade-up">
            <div class="course-video-container">
                <div class="course-video-placeholder">
                    <i class="fas fa-play-circle"></i>
                    <p>Web Development Course</p>
                </div>
            </div>
            <div class="course-content">
                <h3>Web Development</h3>
                <p>Master modern web technologies</p>
                <span class="price">$99</span>
                <div class="course-actions">
                    <button class="buy-btn" onclick="openCoursePage('web-development')">Buy Now</button>
                </div>
            </div>
        </div>
        <div class="course-card" data-aos="fade-up" data-aos-delay="100">
            <div class="course-video-container">
                <div class="course-video-placeholder">
                    <i class="fas fa-play-circle"></i>
                    <p>Data Science Course</p>
                </div>
            </div>
            <div class="course-content">
                <h3>Data Science</h3>
                <p>Learn data analysis and ML</p>
                <span class="price">$129</span>
                <div class="course-actions">
                    <button class="buy-btn" onclick="openCoursePage('data-science')">Buy Now</button>
                </div>
            </div>
        </div>
        <div class="course-card" data-aos="fade-up" data-aos-delay="200">
            <div class="course-video-container">
                <div class="course-video-placeholder">
                    <i class="fas fa-play-circle"></i>
                    <p>Digital Marketing Course</p>
                </div>
            </div>
            <div class="course-content">
                <h3>Digital Marketing</h3>
                <p>Master online marketing strategies</p>
                <span class="price">$79</span>
                <div class="course-actions">
                    <button class="buy-btn" onclick="openCoursePage('digital-marketing')">Buy Now</button>
                </div>
            </div>
        </div>
    `;
}

// Load featured courses when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase availability check
    initializeAuth();
    
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target.id === 'adminModal') {
                closeAdminPanel();
            }
        });
    }
    
    // Initialize admin button visibility
    updateAdminButtonVisibility();
    
    // Load featured courses from admin panel
    loadFeaturedCourses();
});

// Search courses by title
function searchCourses() {
    const searchInput = document.getElementById('courseSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (searchTerm.length > 0) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
    
    // Filter courses
    if (searchTerm === '') {
        // Show all courses
        if (firebaseInitialized) {
            loadFeaturedCourses();
        } else {
            displayDefaultCourses();
        }
        return;
    }
    
    // Filter existing courses
    const filtered = allCourses.filter(course => 
        course.title && course.title.toLowerCase().includes(searchTerm)
    );
    
    // Display filtered courses
    if (filtered.length > 0) {
        displayFeaturedCourses(filtered);
    } else {
        displayNoResults(searchTerm);
    }
}

// Clear course search
function clearCourseSearch() {
    const searchInput = document.getElementById('courseSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    
    // Reload all courses
    if (firebaseInitialized) {
        loadFeaturedCourses();
    } else {
        displayDefaultCourses();
    }
}

// Display no results message
function displayNoResults(searchTerm) {
    const courseGrid = document.querySelector('.course-grid');
    if (!courseGrid) return;
    
    courseGrid.innerHTML = `
        <div class="no-results" style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 3rem 1rem;
            color: #6c757d;
        ">
            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3 style="margin-bottom: 0.5rem; color: #2d3436;">No courses found</h3>
            <p style="margin-bottom: 1rem;">No courses match "<strong>${searchTerm}</strong>"</p>
            <button onclick="clearCourseSearch()" style="
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 25px;
                cursor: pointer;
                font-family: var(--heading-font);
                font-weight: 600;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='#ff5252'" onmouseout="this.style.background='#ff6b6b'">
                <i class="fas fa-times"></i> Clear Search
            </button>
        </div>
    `;
}

// Refresh admin status for current user
async function refreshCurrentUserAdminStatus() {
    if (currentUser && firebaseInitialized) {
        await checkAdminStatus(currentUser);
    }
} 
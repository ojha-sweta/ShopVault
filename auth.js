// Firebase configuration (placeholder - user needs to add their config)
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Simulated Firebase Auth (since we can't use real Firebase without config)
class MockFirebaseAuth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }
    
    async createUserWithEmailAndPassword(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Check if user already exists
                if (this.users.find(user => user.email === email)) {
                    reject(new Error('User already exists'));
                    return;
                }
                
                const user = {
                    uid: 'user_' + Date.now(),
                    email: email,
                    displayName: email.split('@')[0],
                    createdAt: new Date().toISOString()
                };
                
                this.users.push({ ...user, password });
                localStorage.setItem('users', JSON.stringify(this.users));
                
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                resolve({ user });
            }, 500);
        });
    }
    
    async signInWithEmailAndPassword(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = this.users.find(u => u.email === email && u.password === password);
                if (!user) {
                    reject(new Error('Invalid email or password'));
                    return;
                }
                
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: user.createdAt
                };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                resolve({ user: this.currentUser });
            }, 500);
        });
    }
    
    async sendPasswordResetEmail(email) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = this.users.find(u => u.email === email);
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }
                resolve();
            }, 500);
        });
    }
    
    async signOut() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.currentUser = null;
                localStorage.removeItem('currentUser');
                resolve();
            }, 200);
        });
    }
    
    onAuthStateChanged(callback) {
        callback(this.currentUser);
    }
}

// Initialize mock auth
const auth = new MockFirebaseAuth();

// Auth state management
function checkAuthState() {
    const user = auth.currentUser;
    
    if (user) {
        shopState.currentUser = user;
        showUserSection();
        loadUserCart();
    } else {
        shopState.currentUser = null;
        showAuthSection();
    }
}

function showAuthSection() {
    if (elements.authSection) elements.authSection.style.display = 'flex';
    if (elements.userSection) elements.userSection.style.display = 'none';
}

function showUserSection() {
    if (elements.authSection) elements.authSection.style.display = 'none';
    if (elements.userSection) elements.userSection.style.display = 'flex';
    
    if (elements.userWelcome && shopState.currentUser) {
        elements.userWelcome.textContent = `Hi, ${shopState.currentUser.displayName}!`;
    }
}

function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmit');
    const toggleText = document.getElementById('authToggle');
    const toggleLink = document.getElementById('toggleAuth');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const form = document.getElementById('authForm');
    
    // Reset form
    form.reset();
    
    if (mode === 'login') {
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuth">Sign up</a>';
        confirmPasswordGroup.style.display = 'none';
    } else {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleAuth">Login</a>';
        confirmPasswordGroup.style.display = 'block';
    }
    
    // Re-attach event listeners
    document.getElementById('toggleAuth').addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal(mode === 'login' ? 'signup' : 'login');
    });
    
    document.getElementById('forgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordModal();
    });
    
    showModal('authModal');
}

function showForgotPasswordModal() {
    const email = prompt('Enter your email address:');
    if (email) {
        handlePasswordReset(email);
    }
}

// Auth form handling
document.getElementById('authForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('authSubmit');
    const isSignup = submitBtn.textContent === 'Sign Up';
    
    // Validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    if (isSignup && password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = isSignup ? 'Creating Account...' : 'Logging in...';
    
    try {
        if (isSignup) {
            await auth.createUserWithEmailAndPassword(email, password);
            showAlert('Account created successfully!');
        } else {
            await auth.signInWithEmailAndPassword(email, password);
            showAlert('Logged in successfully!');
        }
        
        checkAuthState();
        closeModal('authModal');
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? 'Sign Up' : 'Login';
    }
});

async function handlePasswordReset(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        showAlert('Password reset email sent!');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function logout() {
    try {
        await auth.signOut();
        
        // Clear user-specific data
        shopState.currentUser = null;
        shopState.cart = [];
        localStorage.removeItem('userCart');
        
        showAuthSection();
        updateCartUI();
        showAlert('Logged out successfully');
        
        // Redirect to home if on user-specific pages
        if (window.location.hash.includes('dashboard')) {
            window.location.hash = '';
            location.reload();
        }
        
    } catch (error) {
        showAlert('Error logging out: ' + error.message, 'error');
    }
}

function loadUserCart() {
    if (shopState.currentUser) {
        const userCartKey = `cart_${shopState.currentUser.uid}`;
        const userCart = JSON.parse(localStorage.getItem(userCartKey)) || [];
        
        // Merge with current cart (from localStorage for anonymous users)
        const currentCart = shopState.cart;
        
        // Combine carts and remove duplicates
        const combinedCart = [...userCart];
        currentCart.forEach(item => {
            const existingItem = combinedCart.find(cartItem => cartItem.productId === item.productId);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                combinedCart.push(item);
            }
        });
        
        shopState.cart = combinedCart;
        localStorage.setItem(userCartKey, JSON.stringify(combinedCart));
        localStorage.removeItem('cart'); // Clear anonymous cart
        updateCartUI();
    }
}

function saveUserCart() {
    if (shopState.currentUser) {
        const userCartKey = `cart_${shopState.currentUser.uid}`;
        localStorage.setItem(userCartKey, JSON.stringify(shopState.cart));
    } else {
        localStorage.setItem('cart', JSON.stringify(shopState.cart));
    }
}

function showDashboard() {
    if (!shopState.currentUser) {
        showAuthModal('login');
        return;
    }
    
    const dashboardHTML = `
        <div class="dashboard-page">
            <div class="container">
                <h2 class="section-title">My Dashboard</h2>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <h3>Profile Information</h3>
                        <div class="profile-info">
                            <p><strong>Email:</strong> ${shopState.currentUser.email}</p>
                            <p><strong>Name:</strong> ${shopState.currentUser.displayName}</p>
                            <p><strong>Member since:</strong> ${formatDate(shopState.currentUser.createdAt)}</p>
                        </div>
                        <button class="btn btn-primary" onclick="editProfile()">Edit Profile</button>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>Order History</h3>
                        <div id="orderHistory">
                            <!-- Order history will be loaded here -->
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>Account Actions</h3>
                        <div class="dashboard-actions">
                            <button class="btn btn-outline" onclick="showProducts('all')">Continue Shopping</button>
                            <button class="btn btn-secondary" onclick="logout()">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.main').innerHTML = dashboardHTML;
    loadOrderHistory();
}

function loadOrderHistory() {
    const orderHistoryKey = `orders_${shopState.currentUser.uid}`;
    const orders = JSON.parse(localStorage.getItem(orderHistoryKey)) || [];
    const orderHistoryContainer = document.getElementById('orderHistory');
    
    if (orders.length === 0) {
        orderHistoryContainer.innerHTML = '<p>No orders yet. <a href="#" onclick="showProducts(\'all\')">Start shopping!</a></p>';
        return;
    }
    
    const ordersHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <h4>Order #${order.id}</h4>
                <span class="order-date">${formatDate(order.date)}</span>
            </div>
            <div class="order-details">
                <p><strong>Items:</strong> ${order.items.length}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="order-status">${order.status}</span></p>
            </div>
        </div>
    `).join('');
    
    orderHistoryContainer.innerHTML = ordersHTML;
}

function editProfile() {
    const newName = prompt('Enter new display name:', shopState.currentUser.displayName);
    if (newName && newName.trim()) {
        shopState.currentUser.displayName = newName.trim();
        localStorage.setItem('currentUser', JSON.stringify(shopState.currentUser));
        
        // Update in users array
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.uid === shopState.currentUser.uid);
        if (userIndex !== -1) {
            users[userIndex].displayName = newName.trim();
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        showAlert('Profile updated successfully!');
        showUserSection();
        showDashboard(); // Refresh dashboard
    }
}

// Export functions for global access
window.showAuthModal = showAuthModal;
window.logout = logout;
window.showDashboard = showDashboard;
window.editProfile = editProfile;
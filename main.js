// Global state
window.shopState = {
    currentUser: null,
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    products: [],
    categories: ['electronics', 'fashion', 'home-decor', 'books', 'health'],
    currentCategory: null,
    currentPage: 1,
    itemsPerPage: 12,
    searchQuery: '',
    filters: {
        minPrice: 0,
        maxPrice: 1000,
        rating: 0,
        category: 'all'
    }
};

// DOM elements
const elements = {
    authSection: document.getElementById('authSection'),
    userSection: document.getElementById('userSection'),
    userWelcome: document.getElementById('userWelcome'),
    cartCount: document.getElementById('cartCount'),
    featuredProducts: document.getElementById('featuredProducts'),
    searchInput: document.getElementById('searchInput'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    cartBtn: document.getElementById('cartBtn'),
    shopNowBtn: document.getElementById('shopNowBtn'),
    dashboardBtn: document.getElementById('dashboardBtn')
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthState();
    updateCartUI();
});

function initializeApp() {
    // Generate products if not exists
    if (!localStorage.getItem('products')) {
        generateProducts();
    }
    
    // Load products
    shopState.products = JSON.parse(localStorage.getItem('products')) || [];
    
    // Display featured products
    displayFeaturedProducts();
}

function setupEventListeners() {
    // Auth buttons
    elements.loginBtn?.addEventListener('click', () => showAuthModal('login'));
    elements.signupBtn?.addEventListener('click', () => showAuthModal('signup'));
    elements.logoutBtn?.addEventListener('click', logout);
    elements.dashboardBtn?.addEventListener('click', showDashboard);
    
    // Cart button
    elements.cartBtn?.addEventListener('click', showCart);
    
    // Shop now button
    elements.shopNowBtn?.addEventListener('click', () => {
        window.location.href = '#products';
        showProducts('all');
    });
    
    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            showProducts(category);
        });
    });
    
    // Search functionality
    elements.searchInput?.addEventListener('input', handleSearch);
    document.getElementById('searchBtn')?.addEventListener('click', performSearch);
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
}

function generateProducts() {
    const products = [];
    const categories = [
        {
            name: 'electronics',
            items: [
                'Smartphone', 'Laptop', 'Tablet', 'Headphones', 'Smart Watch', 'Camera', 
                'Speaker', 'Monitor', 'Keyboard', 'Mouse', 'Router', 'Hard Drive',
                'Graphics Card', 'Processor', 'Motherboard', 'RAM', 'Power Supply',
                'Gaming Console', 'VR Headset', 'Drone', 'Smart TV', 'Soundbar',
                'Wireless Charger', 'Phone Case', 'Screen Protector', 'USB Cable',
                'External Battery', 'Webcam', 'Microphone', 'Printer', 'Scanner',
                'Smart Home Hub', 'Security Camera', 'Smart Doorbell', 'Smart Lock',
                'Fitness Tracker', 'Electric Toothbrush', 'Air Purifier', 'Robot Vacuum',
                'Smart Thermostat', 'Electric Scooter', 'Bluetooth Earbuds', 'Portable Speaker',
                'Gaming Mouse', 'Gaming Keyboard', 'Monitor Stand', 'Desk Lamp', 'Phone Stand'
            ]
        },
        {
            name: 'fashion',
            items: [
                'T-Shirt', 'Jeans', 'Dress', 'Sweater', 'Jacket', 'Shoes', 'Sneakers',
                'Boots', 'Sandals', 'Hat', 'Scarf', 'Gloves', 'Belt', 'Watch',
                'Sunglasses', 'Backpack', 'Handbag', 'Wallet', 'Jewelry', 'Necklace',
                'Earrings', 'Bracelet', 'Ring', 'Hoodie', 'Shorts', 'Skirt', 'Blouse',
                'Suit', 'Tie', 'Formal Shirt', 'Casual Shirt', 'Polo Shirt', 'Tank Top',
                'Leggings', 'Yoga Pants', 'Sports Bra', 'Running Shoes', 'Casual Shoes',
                'High Heels', 'Flats', 'Loafers', 'Winter Coat', 'Raincoat', 'Cardigan',
                'Blazer', 'Vest', 'Pajamas', 'Underwear', 'Socks', 'Tights'
            ]
        },
        {
            name: 'home-decor',
            items: [
                'Sofa', 'Chair', 'Table', 'Bed', 'Mattress', 'Pillow', 'Blanket',
                'Curtains', 'Rug', 'Lamp', 'Vase', 'Mirror', 'Picture Frame', 'Clock',
                'Candle', 'Plant Pot', 'Bookshelf', 'Storage Box', 'Wardrobe', 'Dresser',
                'Nightstand', 'Coffee Table', 'Dining Table', 'Bar Stool', 'Office Chair',
                'Desk', 'Shelf', 'Cabinet', 'TV Stand', 'Floor Lamp', 'Table Lamp',
                'Ceiling Fan', 'Wall Art', 'Throw Pillow', 'Bed Sheet', 'Comforter',
                'Window Blinds', 'Area Rug', 'Door Mat', 'Waste Basket', 'Laundry Basket',
                'Coat Rack', 'Umbrella Stand', 'Garden Chair', 'Outdoor Table', 'Planter',
                'Wind Chimes', 'Garden Lights', 'Patio Umbrella'
            ]
        },
        {
            name: 'books',
            items: [
                'Fiction Novel', 'Non-Fiction Book', 'Biography', 'Self-Help Book', 'Cookbook',
                'Travel Guide', 'History Book', 'Science Book', 'Art Book', 'Photography Book',
                'Children\'s Book', 'Textbook', 'Dictionary', 'Encyclopedia', 'Poetry Book',
                'Comic Book', 'Graphic Novel', 'Magazine', 'Journal', 'Notebook',
                'Planner', 'Calendar', 'Recipe Book', 'Gardening Book', 'DIY Manual',
                'Computer Programming Book', 'Business Book', 'Finance Book', 'Health Book',
                'Fitness Guide', 'Language Learning Book', 'Music Book', 'Philosophy Book',
                'Psychology Book', 'Education Book', 'Parenting Book', 'Romance Novel',
                'Mystery Novel', 'Thriller Book', 'Fantasy Novel', 'Science Fiction',
                'Horror Book', 'Adventure Book', 'Drama Book', 'Comedy Book', 'Reference Book',
                'Atlas', 'Almanac', 'Workbook'
            ]
        },
        {
            name: 'health',
            items: [
                'Vitamins', 'Supplements', 'Protein Powder', 'Energy Bars', 'First Aid Kit',
                'Thermometer', 'Blood Pressure Monitor', 'Scale', 'Yoga Mat', 'Dumbbells',
                'Resistance Bands', 'Exercise Ball', 'Jump Rope', 'Foam Roller', 'Water Bottle',
                'Pill Organizer', 'Hand Sanitizer', 'Face Mask', 'Sunscreen', 'Moisturizer',
                'Shampoo', 'Conditioner', 'Body Wash', 'Toothbrush', 'Toothpaste', 'Mouthwash',
                'Floss', 'Deodorant', 'Perfume', 'Cologne', 'Nail Clippers', 'Tweezers',
                'Hair Brush', 'Comb', 'Hair Dryer', 'Razor', 'Shaving Cream', 'Massage Oil',
                'Essential Oils', 'Diffuser', 'Heating Pad', 'Ice Pack', 'Compression Socks',
                'Knee Brace', 'Back Support', 'Posture Corrector', 'Sleep Mask', 'Earplugs',
                'Meditation Cushion', 'Stress Ball'
            ]
        }
    ];

    let productId = 1;
    
    categories.forEach(category => {
        category.items.forEach(item => {
            const product = {
                id: productId++,
                name: item,
                category: category.name,
                price: Math.floor(Math.random() * 500) + 10,
                originalPrice: null,
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
                reviews: Math.floor(Math.random() * 1000) + 10,
                description: `High-quality ${item.toLowerCase()} with excellent features and durability. Perfect for everyday use and built to last.`,
                image: `https://images.pexels.com/photos/1000/product-placeholder.jpg?auto=compress&cs=tinysrgb&w=300`,
                stock: Math.floor(Math.random() * 100) + 1,
                inStock: Math.random() > 0.1, // 90% chance of being in stock
                featured: Math.random() > 0.8, // 20% chance of being featured
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0,
                brand: generateBrand(),
                tags: generateTags(category.name, item)
            };
            
            // Apply discount
            if (product.discount > 0) {
                product.originalPrice = product.price;
                product.price = Math.floor(product.price * (1 - product.discount / 100));
            }
            
            products.push(product);
        });
    });
    
    localStorage.setItem('products', JSON.stringify(products));
    shopState.products = products;
}

function generateBrand() {
    const brands = [
        'TechPro', 'StyleMax', 'HomeEssentials', 'BookWorld', 'HealthPlus',
        'QualityFirst', 'PremiumChoice', 'EverydayBest', 'TopTier', 'Excellence'
    ];
    return brands[Math.floor(Math.random() * brands.length)];
}

function generateTags(category, item) {
    const tagMap = {
        electronics: ['tech', 'digital', 'smart', 'wireless', 'portable'],
        fashion: ['style', 'trendy', 'comfortable', 'fashionable', 'elegant'],
        'home-decor': ['home', 'decor', 'furniture', 'interior', 'cozy'],
        books: ['reading', 'knowledge', 'education', 'entertainment', 'literature'],
        health: ['wellness', 'fitness', 'health', 'care', 'natural']
    };
    
    const baseTags = tagMap[category] || [];
    const itemTags = item.toLowerCase().split(' ');
    
    return [...baseTags, ...itemTags].slice(0, 5);
}

function displayFeaturedProducts() {
    const featuredProducts = shopState.products
        .filter(product => product.featured)
        .slice(0, 8);
    
    if (elements.featuredProducts) {
        elements.featuredProducts.innerHTML = featuredProducts
            .map(product => createProductCard(product))
            .join('');
    }
}

function createProductCard(product) {
    const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
    const discountBadge = product.discount > 0 ? 
        `<div class="discount-badge">-${product.discount}%</div>` : '';
    
    return `
        <div class="product-card ${!product.inStock ? 'out-of-stock' : ''}" onclick="showProductDetail(${product.id})">
            ${discountBadge}
            <div class="product-image">
                📦
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    $${product.price}
                    ${product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span>` : ''}
                </div>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-text">(${product.reviews})</span>
                </div>
                <div class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock-text'}">
                    ${product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); addToCart(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                    <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); buyNow(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showProducts(category) {
    // Create products page content
    const productsHTML = `
        <div class="products-page">
            <div class="filters">
                <div class="container">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Category</label>
                            <select id="categoryFilter">
                                <option value="all">All Categories</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="home-decor">Home Decor</option>
                                <option value="books">Books</option>
                                <option value="health">Health</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Price Range</label>
                            <div class="price-range">
                                <input type="number" id="minPrice" placeholder="Min" min="0">
                                <span>-</span>
                                <input type="number" id="maxPrice" placeholder="Max" min="0">
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Rating</label>
                            <select id="ratingFilter">
                                <option value="0">All Ratings</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Sort By</label>
                            <select id="sortBy">
                                <option value="name">Name</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Rating</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="applyFilters()">Apply Filters</button>
                        <button class="btn btn-outline" onclick="clearFilters()">Clear</button>
                    </div>
                </div>
            </div>
            <div class="container">
                <h2 class="section-title">${category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}</h2>
                <div class="product-grid" id="productsGrid">
                    <!-- Products will be loaded here -->
                </div>
                <div class="pagination" id="pagination">
                    <!-- Pagination will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    // Replace main content
    document.querySelector('.main').innerHTML = productsHTML;
    
    // Set current category and load products
    shopState.currentCategory = category;
    shopState.currentPage = 1;
    
    // Set category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && category !== 'all') {
        categoryFilter.value = category;
    }
    
    // Setup filter event listeners
    setupFilterListeners();
    
    // Load products
    loadProducts();
}

function setupFilterListeners() {
    ['categoryFilter', 'minPrice', 'maxPrice', 'ratingFilter', 'sortBy'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });
}

function loadProducts() {
    let products = [...shopState.products];
    
    // Apply category filter
    if (shopState.currentCategory && shopState.currentCategory !== 'all') {
        products = products.filter(p => p.category === shopState.currentCategory);
    }
    
    // Apply search filter
    if (shopState.searchQuery) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(shopState.searchQuery.toLowerCase()) ||
            p.tags.some(tag => tag.toLowerCase().includes(shopState.searchQuery.toLowerCase()))
        );
    }
    
    // Apply filters
    const categoryFilter = document.getElementById('categoryFilter')?.value;
    const minPrice = parseInt(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('maxPrice')?.value) || Infinity;
    const ratingFilter = parseFloat(document.getElementById('ratingFilter')?.value) || 0;
    
    if (categoryFilter && categoryFilter !== 'all') {
        products = products.filter(p => p.category === categoryFilter);
    }
    
    products = products.filter(p => 
        p.price >= minPrice && 
        p.price <= maxPrice && 
        parseFloat(p.rating) >= ratingFilter
    );
    
    // Apply sorting
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    switch (sortBy) {
        case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            products.sort((a, b) => b.rating - a.rating);
            break;
        default:
            products.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Pagination
    const totalPages = Math.ceil(products.length / shopState.itemsPerPage);
    const startIndex = (shopState.currentPage - 1) * shopState.itemsPerPage;
    const paginatedProducts = products.slice(startIndex, startIndex + shopState.itemsPerPage);
    
    // Display products
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        if (paginatedProducts.length === 0) {
            productsGrid.innerHTML = '<div class="empty-cart"><p>No products found matching your criteria.</p></div>';
        } else {
            productsGrid.innerHTML = paginatedProducts
                .map(product => createProductCard(product))
                .join('');
        }
    }
    
    // Display pagination
    displayPagination(totalPages);
}

function displayPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${shopState.currentPage - 1})" 
                ${shopState.currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === shopState.currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - shopState.currentPage) <= 2) {
            paginationHTML += `<button onclick="changePage(${i})">${i}</button>`;
        } else if (Math.abs(i - shopState.currentPage) === 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${shopState.currentPage + 1})" 
                ${shopState.currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    shopState.currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    shopState.currentPage = 1;
    loadProducts();
}

function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('ratingFilter').value = '0';
    document.getElementById('sortBy').value = 'name';
    shopState.currentPage = 1;
    loadProducts();
}

// Utility functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Add fade-in animation
        setTimeout(() => {
            modal.classList.add('fade-in');
        }, 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modal.classList.remove('fade-in');
    }
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fade-in`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

// Export global functions
window.showProducts = showProducts;
window.changePage = changePage;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
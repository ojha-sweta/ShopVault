// Product management functions

function showProductDetail(productId) {
    const product = shopState.products.find(p => p.id === productId);
    if (!product) return;
    
    const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
    
    const productDetailHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                📦
            </div>
            <div class="product-detail-info">
                <h3>${product.name}</h3>
                <div class="product-detail-price">
                    $${product.price}
                    ${product.originalPrice ? `<span class="original-price" style="text-decoration: line-through; color: #94a3b8; font-size: 1.2rem; margin-left: 0.5rem;">$${product.originalPrice}</span>` : ''}
                    ${product.discount > 0 ? `<span class="discount-badge" style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem; margin-left: 0.5rem;">-${product.discount}%</span>` : ''}
                </div>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
                </div>
                <div class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock-text'}">
                    ${product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                </div>
                <p class="product-detail-description">${product.description}</p>
                <div class="product-meta">
                    <p><strong>Brand:</strong> ${product.brand}</p>
                    <p><strong>Category:</strong> ${product.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div class="quantity-selector">
                    <label>Quantity:</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="changeQuantity(-1)" ${!product.inStock ? 'disabled' : ''}>-</button>
                        <input type="number" class="quantity-input" id="quantityInput" value="1" min="1" max="${product.stock}" ${!product.inStock ? 'disabled' : ''}>
                        <button class="quantity-btn" onclick="changeQuantity(1)" ${!product.inStock ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCartWithQuantity(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                    <button class="btn btn-success" onclick="buyNowWithQuantity(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('productModalBody').innerHTML = productDetailHTML;
    showModal('productModal');
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantityInput');
    if (!quantityInput) return;
    
    const currentValue = parseInt(quantityInput.value) || 1;
    const newValue = Math.max(1, Math.min(currentValue + delta, parseInt(quantityInput.max)));
    quantityInput.value = newValue;
}

function addToCartWithQuantity(productId) {
    const quantityInput = document.getElementById('quantityInput');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    
    addToCart(productId, quantity);
    closeModal('productModal');
}

function buyNowWithQuantity(productId) {
    const quantityInput = document.getElementById('quantityInput');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    
    buyNow(productId, quantity);
}

function addToCart(productId, quantity = 1) {
    const product = shopState.products.find(p => p.id === productId);
    if (!product || !product.inStock) {
        showAlert('Product is out of stock', 'error');
        return;
    }
    
    // Check if product is already in cart
    const existingItem = shopState.cart.find(item => item.productId === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            showAlert(`Only ${product.stock} items available`, 'warning');
            existingItem.quantity = product.stock;
        } else {
            existingItem.quantity = newQuantity;
        }
    } else {
        if (quantity > product.stock) {
            showAlert(`Only ${product.stock} items available`, 'warning');
            quantity = product.stock;
        }
        
        shopState.cart.push({
            productId: productId,
            quantity: quantity,
            addedAt: new Date().toISOString()
        });
    }
    
    saveCart();
    updateCartUI();
    showAlert(`${product.name} added to cart!`);
}

function buyNow(productId, quantity = 1) {
    const product = shopState.products.find(p => p.id === productId);
    if (!product || !product.inStock) {
        showAlert('Product is out of stock', 'error');
        return;
    }
    
    if (quantity > product.stock) {
        showAlert(`Only ${product.stock} items available`, 'warning');
        quantity = product.stock;
    }
    
    // Create temporary cart with single item for checkout
    const tempCart = [{
        productId: productId,
        quantity: quantity,
        addedAt: new Date().toISOString()
    }];
    
    showCheckout(tempCart);
}

function saveCart() {
    if (shopState.currentUser) {
        const userCartKey = `cart_${shopState.currentUser.uid}`;
        localStorage.setItem(userCartKey, JSON.stringify(shopState.cart));
    } else {
        localStorage.setItem('cart', JSON.stringify(shopState.cart));
    }
}

function updateCartUI() {
    const cartCount = shopState.cart.reduce((total, item) => total + item.quantity, 0);
    if (elements.cartCount) {
        elements.cartCount.textContent = cartCount;
        elements.cartCount.style.display = cartCount > 0 ? 'block' : 'none';
    }
}

function showCart() {
    if (shopState.cart.length === 0) {
        document.getElementById('cartModalBody').innerHTML = `
            <div class="empty-cart">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
                <button class="btn btn-primary" onclick="closeModal('cartModal'); showProducts('all')">
                    Start Shopping
                </button>
            </div>
        `;
    } else {
        const cartHTML = generateCartHTML(shopState.cart);
        document.getElementById('cartModalBody').innerHTML = cartHTML;
    }
    
    showModal('cartModal');
}

function generateCartHTML(cart) {
    const cartItems = cart.map(item => {
        const product = shopState.products.find(p => p.id === item.productId);
        if (!product) return '';
        
        const itemTotal = product.price * item.quantity;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">📦</div>
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${product.name}</h4>
                    <p class="cart-item-price">$${product.price} each</p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${product.id}, ${item.quantity - 1})">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${product.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <p class="item-total">$${itemTotal.toFixed(2)}</p>
                    <button class="btn btn-danger btn-small" onclick="removeFromCart(${product.id})">Remove</button>
                </div>
            </div>
        `;
    }).join('');
    
    const subtotal = cart.reduce((total, item) => {
        const product = shopState.products.find(p => p.id === item.productId);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    
    return `
        <div class="cart-items">
            ${cartItems}
        </div>
        <div class="cart-summary">
            <div class="cart-summary-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
                <span>Tax:</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
                <span>Shipping:</span>
                <span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row cart-total">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <div class="cart-actions">
                <button class="btn btn-outline" onclick="closeModal('cartModal')">Continue Shopping</button>
                <button class="btn btn-primary" onclick="proceedToCheckout()">Checkout</button>
            </div>
        </div>
    `;
}

function updateCartItemQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const product = shopState.products.find(p => p.id === productId);
    if (!product) return;
    
    if (newQuantity > product.stock) {
        showAlert(`Only ${product.stock} items available`, 'warning');
        newQuantity = product.stock;
    }
    
    const cartItem = shopState.cart.find(item => item.productId === productId);
    if (cartItem) {
        cartItem.quantity = newQuantity;
        saveCart();
        updateCartUI();
        showCart(); // Refresh cart display
    }
}

function removeFromCart(productId) {
    shopState.cart = shopState.cart.filter(item => item.productId !== productId);
    saveCart();
    updateCartUI();
    
    if (shopState.cart.length === 0) {
        showCart(); // Refresh to show empty cart
    } else {
        showCart(); // Refresh cart display
    }
    
    const product = shopState.products.find(p => p.id === productId);
    if (product) {
        showAlert(`${product.name} removed from cart`);
    }
}

function proceedToCheckout() {
    closeModal('cartModal');
    showCheckout(shopState.cart);
}

function showCheckout(cartItems = shopState.cart) {
    if (!shopState.currentUser) {
        showAlert('Please login to proceed with checkout', 'warning');
        showAuthModal('login');
        return;
    }
    
    if (cartItems.length === 0) {
        showAlert('Your cart is empty', 'warning');
        return;
    }
    
    const checkoutHTML = generateCheckoutHTML(cartItems);
    
    // Create checkout page
    document.querySelector('.main').innerHTML = `
        <div class="checkout-page">
            <div class="container">
                <h2 class="section-title">Checkout</h2>
                ${checkoutHTML}
            </div>
        </div>
    `;
}

function generateCheckoutHTML(cartItems) {
    const orderItems = cartItems.map(item => {
        const product = shopState.products.find(p => p.id === item.productId);
        if (!product) return '';
        
        const itemTotal = product.price * item.quantity;
        
        return `
            <div class="checkout-item">
                <div class="checkout-item-image">📦</div>
                <div class="checkout-item-info">
                    <h4>${product.name}</h4>
                    <p>$${product.price} × ${item.quantity}</p>
                </div>
                <div class="checkout-item-total">$${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    const subtotal = cartItems.reduce((total, item) => {
        const product = shopState.products.find(p => p.id === item.productId);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    
    return `
        <div class="checkout-container">
            <div class="checkout-form">
                <h3>Shipping Information</h3>
                <form id="checkoutForm">
                    <div class="form-group">
                        <label for="fullName">Full Name</label>
                        <input type="text" id="fullName" required>
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <input type="text" id="address" required>
                    </div>
                    <div class="form-group">
                        <label for="city">City</label>
                        <input type="text" id="city" required>
                    </div>
                    <div class="form-group">
                        <label for="zipCode">ZIP Code</label>
                        <input type="text" id="zipCode" required>
                    </div>
                    
                    <h3>Payment Information</h3>
                    <div class="form-group">
                        <label for="cardNumber">Card Number</label>
                        <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" required>
                    </div>
                    <div class="form-group">
                        <label for="expiryDate">Expiry Date</label>
                        <input type="text" id="expiryDate" placeholder="MM/YY" required>
                    </div>
                    <div class="form-group">
                        <label for="cvv">CVV</label>
                        <input type="text" id="cvv" placeholder="123" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-full">Place Order</button>
                </form>
            </div>
            
            <div class="checkout-summary">
                <h3>Order Summary</h3>
                <div class="checkout-items">
                    ${orderItems}
                </div>
                <div class="checkout-totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax:</span>
                        <span>$${tax.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
                    </div>
                    <div class="total-row total-final">
                        <span>Total:</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize checkout form handling
document.addEventListener('submit', function(e) {
    if (e.target.id === 'checkoutForm') {
        e.preventDefault();
        processOrder();
    }
});

function processOrder() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!form.checkValidity()) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate payment processing
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    setTimeout(() => {
        // Create order
        const order = {
            id: 'ORD-' + Date.now(),
            userId: shopState.currentUser.uid,
            items: [...shopState.cart],
            total: calculateOrderTotal(shopState.cart),
            shippingInfo: {
                fullName: document.getElementById('fullName').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                zipCode: document.getElementById('zipCode').value
            },
            paymentInfo: {
                cardNumber: '**** **** **** ' + document.getElementById('cardNumber').value.slice(-4),
                expiryDate: document.getElementById('expiryDate').value
            },
            date: new Date().toISOString(),
            status: 'Processing'
        };
        
        // Save order to user's order history
        const orderHistoryKey = `orders_${shopState.currentUser.uid}`;
        const orderHistory = JSON.parse(localStorage.getItem(orderHistoryKey)) || [];
        orderHistory.unshift(order);
        localStorage.setItem(orderHistoryKey, JSON.stringify(orderHistory));
        
        // Update product stock
        order.items.forEach(item => {
            const product = shopState.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
                if (product.stock <= 0) {
                    product.inStock = false;
                    product.stock = 0;
                }
            }
        });
        localStorage.setItem('products', JSON.stringify(shopState.products));
        
        // Clear cart
        shopState.cart = [];
        saveCart();
        updateCartUI();
        
        // Show success message
        showOrderSuccess(order);
        
    }, 2000);
}

function calculateOrderTotal(cartItems) {
    const subtotal = cartItems.reduce((total, item) => {
        const product = shopState.products.find(p => p.id === item.productId);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    return subtotal + tax + shipping;
}

function showOrderSuccess(order) {
    const successHTML = `
        <div class="order-success">
            <div class="container">
                <div class="success-content">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #22c55e; margin-bottom: 1rem;">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                    <h2>Order Placed Successfully!</h2>
                    <p>Thank you for your purchase. Your order has been received and is being processed.</p>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                        <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
                    </div>
                    
                    <div class="success-actions">
                        <button class="btn btn-primary" onclick="showDashboard()">View Orders</button>
                        <button class="btn btn-outline" onclick="showProducts('all')">Continue Shopping</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.main').innerHTML = successHTML;
}

// Export functions for global access
window.showProductDetail = showProductDetail;
window.changeQuantity = changeQuantity;
window.addToCart = addToCart;
window.addToCartWithQuantity = addToCartWithQuantity;
window.buyNow = buyNow;
window.buyNowWithQuantity = buyNowWithQuantity;
window.showCart = showCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
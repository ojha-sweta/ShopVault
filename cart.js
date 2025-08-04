// Cart management functions - additional utilities

function clearCart() {
    shopState.cart = [];
    saveCart();
    updateCartUI();
    showAlert('Cart cleared');
}

function getCartTotal() {
    return shopState.cart.reduce((total, item) => {
        const product = shopState.products.find(p => p.id === item.productId);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function getCartItemCount() {
    return shopState.cart.reduce((total, item) => total + item.quantity, 0);
}

function isProductInCart(productId) {
    return shopState.cart.some(item => item.productId === productId);
}

function getCartItemQuantity(productId) {
    const item = shopState.cart.find(item => item.productId === productId);
    return item ? item.quantity : 0;
}

function validateCartStock() {
    let hasStockIssues = false;
    
    shopState.cart.forEach(item => {
        const product = shopState.products.find(p => p.id === item.productId);
        if (product) {
            if (!product.inStock) {
                // Remove out of stock items
                removeFromCart(item.productId);
                showAlert(`${product.name} is no longer available and has been removed from your cart`, 'warning');
                hasStockIssues = true;
            } else if (item.quantity > product.stock) {
                // Adjust quantity to available stock
                item.quantity = product.stock;
                showAlert(`${product.name} quantity adjusted to available stock (${product.stock})`, 'warning');
                hasStockIssues = true;
            }
        }
    });
    
    if (hasStockIssues) {
        saveCart();
        updateCartUI();
    }
    
    return !hasStockIssues;
}

function exportCart() {
    const cartData = {
        items: shopState.cart,
        total: getCartTotal(),
        itemCount: getCartItemCount(),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(cartData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `cart-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importCart(jsonData) {
    try {
        const cartData = JSON.parse(jsonData);
        if (cartData.items && Array.isArray(cartData.items)) {
            shopState.cart = cartData.items;
            saveCart();
            updateCartUI();
            showAlert('Cart imported successfully!');
        } else {
            throw new Error('Invalid cart data format');
        }
    } catch (error) {
        showAlert('Error importing cart: ' + error.message, 'error');
    }
}

function shareCart() {
    const cartSummary = shopState.cart.map(item => {
        const product = shopState.products.find(p => p.id === item.productId);
        return product ? `${product.name} (${item.quantity}x $${product.price})` : '';
    }).filter(item => item).join('\n');
    
    const shareText = `Check out my shopping cart:\n\n${cartSummary}\n\nTotal: $${getCartTotal().toFixed(2)}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Shopping Cart',
            text: shareText,
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showAlert('Cart details copied to clipboard!');
        }).catch(() => {
            showAlert('Unable to copy cart details', 'error');
        });
    }
}

function saveCartForLater() {
    if (!shopState.currentUser) {
        showAlert('Please login to save cart for later', 'warning');
        return;
    }
    
    const savedCartKey = `savedCart_${shopState.currentUser.uid}`;
    const savedCart = {
        items: [...shopState.cart],
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(savedCartKey, JSON.stringify(savedCart));
    showAlert('Cart saved for later!');
}

function loadSavedCart() {
    if (!shopState.currentUser) {
        showAlert('Please login to load saved cart', 'warning');
        return;
    }
    
    const savedCartKey = `savedCart_${shopState.currentUser.uid}`;
    const savedCart = JSON.parse(localStorage.getItem(savedCartKey));
    
    if (!savedCart || !savedCart.items.length) {
        showAlert('No saved cart found', 'warning');
        return;
    }
    
    // Merge with current cart
    savedCart.items.forEach(savedItem => {
        const existingItem = shopState.cart.find(item => item.productId === savedItem.productId);
        if (existingItem) {
            existingItem.quantity += savedItem.quantity;
        } else {
            shopState.cart.push(savedItem);
        }
    });
    
    saveCart();
    updateCartUI();
    showAlert('Saved cart loaded!');
    
    // Clear saved cart
    localStorage.removeItem(savedCartKey);
}

function quickAddToCart(productId) {
    const product = shopState.products.find(p => p.id === productId);
    if (!product || !product.inStock) {
        showAlert('Product unavailable', 'error');
        return;
    }
    
    addToCart(productId, 1);
    
    // Show mini cart preview
    showMiniCartPreview();
}

function showMiniCartPreview() {
    const existingPreview = document.querySelector('.mini-cart-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const cartTotal = getCartTotal();
    const itemCount = getCartItemCount();
    
    const preview = document.createElement('div');
    preview.className = 'mini-cart-preview';
    preview.innerHTML = `
        <div class="mini-cart-content">
            <p><strong>${itemCount}</strong> items in cart</p>
            <p>Total: <strong>$${cartTotal.toFixed(2)}</strong></p>
            <div class="mini-cart-actions">
                <button class="btn btn-small btn-outline" onclick="showCart()">View Cart</button>
                <button class="btn btn-small btn-primary" onclick="proceedToCheckout()">Checkout</button>
            </div>
        </div>
    `;
    
    // Style the preview
    preview.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1rem;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        min-width: 200px;
    `;
    
    document.body.appendChild(preview);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        preview.remove();
    }, 3000);
}

// Wishlist functions (bonus feature)
function addToWishlist(productId) {
    if (!shopState.currentUser) {
        showAlert('Please login to add to wishlist', 'warning');
        showAuthModal('login');
        return;
    }
    
    const wishlistKey = `wishlist_${shopState.currentUser.uid}`;
    const wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        
        const product = shopState.products.find(p => p.id === productId);
        showAlert(`${product?.name || 'Product'} added to wishlist!`);
    } else {
        showAlert('Product already in wishlist', 'warning');
    }
}

function removeFromWishlist(productId) {
    if (!shopState.currentUser) return;
    
    const wishlistKey = `wishlist_${shopState.currentUser.uid}`;
    let wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    
    wishlist = wishlist.filter(id => id !== productId);
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    
    const product = shopState.products.find(p => p.id === productId);
    showAlert(`${product?.name || 'Product'} removed from wishlist`);
}

function isInWishlist(productId) {
    if (!shopState.currentUser) return false;
    
    const wishlistKey = `wishlist_${shopState.currentUser.uid}`;
    const wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    
    return wishlist.includes(productId);
}

function showWishlist() {
    if (!shopState.currentUser) {
        showAlert('Please login to view wishlist', 'warning');
        showAuthModal('login');
        return;
    }
    
    const wishlistKey = `wishlist_${shopState.currentUser.uid}`;
    const wishlistIds = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    
    const wishlistProducts = wishlistIds
        .map(id => shopState.products.find(p => p.id === parseInt(id)))
        .filter(product => product);
    
    const wishlistHTML = `
        <div class="wishlist-page">
            <div class="container">
                <h2 class="section-title">My Wishlist</h2>
                ${wishlistProducts.length === 0 ? 
                    '<div class="empty-cart"><p>Your wishlist is empty</p></div>' :
                    `<div class="product-grid">${wishlistProducts.map(product => createProductCard(product)).join('')}</div>`
                }
            </div>
        </div>
    `;
    
    document.querySelector('.main').innerHTML = wishlistHTML;
}

// Export additional functions
window.clearCart = clearCart;
window.quickAddToCart = quickAddToCart;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.showWishlist = showWishlist;
window.saveCartForLater = saveCartForLater;
window.loadSavedCart = loadSavedCart;
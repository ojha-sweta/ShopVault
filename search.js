// Search and filter functionality

let searchTimeout;
let currentSearchQuery = '';

function handleSearch(event) {
    const query = event.target.value.trim();
    currentSearchQuery = query;
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    if (query.length === 0) {
        hideSuggestions();
        return;
    }
    
    // Debounce search to avoid too many calls
    searchTimeout = setTimeout(() => {
        if (query.length >= 2) {
            showSearchSuggestions(query);
        }
    }, 300);
}

function showSearchSuggestions(query) {
    const suggestions = searchProducts(query).slice(0, 8); // Limit to 8 suggestions
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!suggestionsContainer) return;
    
    if (suggestions.length === 0) {
        hideSuggestions();
        return;
    }
    
    const suggestionsHTML = suggestions.map(product => `
        <div class="suggestion-item" onclick="selectSuggestion(${product.id}, '${product.name.replace(/'/g, '\\\'')}')" data-product-id="${product.id}">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.5rem;">📦</span>
                <div>
                    <div style="font-weight: 500;">${highlightMatch(product.name, query)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">$${product.price} • ${product.category.replace('-', ' ')}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    suggestionsContainer.innerHTML = suggestionsHTML;
    suggestionsContainer.style.display = 'block';
}

function hideSuggestions() {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectSuggestion(productId, productName) {
    // Fill search input with selected product name
    if (elements.searchInput) {
        elements.searchInput.value = productName;
    }
    
    hideSuggestions();
    
    // Show product detail
    showProductDetail(productId);
}

function highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchProducts(query) {
    if (!query || query.length < 2) return [];
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return shopState.products.filter(product => {
        const searchableText = [
            product.name,
            product.description,
            product.brand,
            product.category,
            ...product.tags
        ].join(' ').toLowerCase();
        
        // Check if all search terms are found
        return searchTerms.every(term => searchableText.includes(term));
    }).sort((a, b) => {
        // Sort by relevance (name matches first, then others)
        const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
        const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Secondary sort by rating
        return parseFloat(b.rating) - parseFloat(a.rating);
    });
}

function performSearch() {
    const query = elements.searchInput?.value.trim();
    if (!query) return;
    
    shopState.searchQuery = query;
    hideSuggestions();
    
    // Navigate to products page with search results
    showSearchResults(query);
}

function showSearchResults(query) {
    const results = searchProducts(query);
    
    const searchResultsHTML = `
        <div class="search-results-page">
            <div class="container">
                <div class="search-header">
                    <h2 class="section-title">Search Results for "${query}"</h2>
                    <p class="search-count">${results.length} products found</p>
                </div>
                
                <div class="search-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Sort by</label>
                            <select id="searchSort" onchange="sortSearchResults('${query}')">
                                <option value="relevance">Relevance</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Rating</option>
                                <option value="name">Name A-Z</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Category</label>
                            <select id="searchCategoryFilter" onchange="filterSearchResults('${query}')">
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
                                <input type="number" id="searchMinPrice" placeholder="Min" onchange="filterSearchResults('${query}')">
                                <span>-</span>
                                <input type="number" id="searchMaxPrice" placeholder="Max" onchange="filterSearchResults('${query}')">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="product-grid" id="searchResultsGrid">
                    ${results.length === 0 ? 
                        '<div class="empty-results"><h3>No products found</h3><p>Try adjusting your search terms or browse our categories.</p></div>' :
                        results.map(product => createProductCard(product)).join('')
                    }
                </div>
                
                ${results.length > 12 ? '<div class="pagination" id="searchPagination"></div>' : ''}
            </div>
        </div>
    `;
    
    document.querySelector('.main').innerHTML = searchResultsHTML;
    
    // Setup search-specific pagination if needed
    if (results.length > 12) {
        setupSearchPagination(results, query);
    }
}

function sortSearchResults(query) {
    const sortBy = document.getElementById('searchSort')?.value || 'relevance';
    let results = searchProducts(query);
    
    // Apply category filter if set
    const categoryFilter = document.getElementById('searchCategoryFilter')?.value;
    if (categoryFilter && categoryFilter !== 'all') {
        results = results.filter(p => p.category === categoryFilter);
    }
    
    // Apply price filter if set
    const minPrice = parseInt(document.getElementById('searchMinPrice')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('searchMaxPrice')?.value) || Infinity;
    results = results.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    // Sort results
    switch (sortBy) {
        case 'price-low':
            results.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            results.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            results.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
            break;
        case 'name':
            results.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default: // relevance
            // Already sorted by relevance in searchProducts function
            break;
    }
    
    // Update grid
    const grid = document.getElementById('searchResultsGrid');
    if (grid) {
        grid.innerHTML = results.length === 0 ? 
            '<div class="empty-results"><h3>No products found</h3><p>Try adjusting your filters.</p></div>' :
            results.map(product => createProductCard(product)).join('');
    }
}

function filterSearchResults(query) {
    sortSearchResults(query); // This function handles both sorting and filtering
}

function setupSearchPagination(results, query) {
    // Implementation for search result pagination
    // Similar to product pagination but for search results
    const itemsPerPage = 12;
    const totalPages = Math.ceil(results.length / itemsPerPage);
    
    // This would be similar to displayPagination but for search results
    // Simplified for now
}

// Advanced search functionality
function showAdvancedSearch() {
    const advancedSearchHTML = `
        <div class="advanced-search-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Advanced Search</h2>
                    <button class="modal-close" onclick="closeAdvancedSearch()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="advancedSearchForm">
                        <div class="form-group">
                            <label>Product Name</label>
                            <input type="text" id="advancedName" placeholder="Enter product name">
                        </div>
                        
                        <div class="form-group">
                            <label>Category</label>
                            <select id="advancedCategory">
                                <option value="">All Categories</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="home-decor">Home Decor</option>
                                <option value="books">Books</option>
                                <option value="health">Health</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Brand</label>
                            <input type="text" id="advancedBrand" placeholder="Enter brand name">
                        </div>
                        
                        <div class="form-group">
                            <label>Price Range</label>
                            <div class="price-range">
                                <input type="number" id="advancedMinPrice" placeholder="Min price">
                                <span>to</span>
                                <input type="number" id="advancedMaxPrice" placeholder="Max price">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Minimum Rating</label>
                            <select id="advancedRating">
                                <option value="">Any Rating</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="2">2+ Stars</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Availability</label>
                            <select id="advancedAvailability">
                                <option value="">All Products</option>
                                <option value="in-stock">In Stock Only</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </select>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Search</button>
                            <button type="button" class="btn btn-outline" onclick="resetAdvancedSearch()">Reset</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = advancedSearchHTML;
    modalDiv.className = 'modal';
    modalDiv.id = 'advancedSearchModal';
    document.body.appendChild(modalDiv);
    
    showModal('advancedSearchModal');
    
    // Setup form handler
    document.getElementById('advancedSearchForm').addEventListener('submit', performAdvancedSearch);
}

function performAdvancedSearch(event) {
    event.preventDefault();
    
    const searchCriteria = {
        name: document.getElementById('advancedName')?.value.trim() || '',
        category: document.getElementById('advancedCategory')?.value || '',
        brand: document.getElementById('advancedBrand')?.value.trim() || '',
        minPrice: parseInt(document.getElementById('advancedMinPrice')?.value) || 0,
        maxPrice: parseInt(document.getElementById('advancedMaxPrice')?.value) || Infinity,
        minRating: parseFloat(document.getElementById('advancedRating')?.value) || 0,
        availability: document.getElementById('advancedAvailability')?.value || ''
    };
    
    const results = shopState.products.filter(product => {
        // Name filter
        if (searchCriteria.name && !product.name.toLowerCase().includes(searchCriteria.name.toLowerCase())) {
            return false;
        }
        
        // Category filter
        if (searchCriteria.category && product.category !== searchCriteria.category) {
            return false;
        }
        
        // Brand filter
        if (searchCriteria.brand && !product.brand.toLowerCase().includes(searchCriteria.brand.toLowerCase())) {
            return false;
        }
        
        // Price filter
        if (product.price < searchCriteria.minPrice || product.price > searchCriteria.maxPrice) {
            return false;
        }
        
        // Rating filter
        if (parseFloat(product.rating) < searchCriteria.minRating) {
            return false;
        }
        
        // Availability filter
        if (searchCriteria.availability === 'in-stock' && !product.inStock) {
            return false;
        }
        if (searchCriteria.availability === 'out-of-stock' && product.inStock) {
            return false;
        }
        
        return true;
    });
    
    closeAdvancedSearch();
    showAdvancedSearchResults(results, searchCriteria);
}

function showAdvancedSearchResults(results, criteria) {
    const criteriaText = Object.entries(criteria)
        .filter(([key, value]) => value !== '' && value !== 0 && value !== Infinity)
        .map(([key, value]) => {
            switch(key) {
                case 'name': return `Name: "${value}"`;
                case 'category': return `Category: ${value.replace('-', ' ')}`;
                case 'brand': return `Brand: "${value}"`;
                case 'minPrice': return `Min Price: $${value}`;
                case 'maxPrice': return `Max Price: $${value}`;
                case 'minRating': return `Min Rating: ${value}+ stars`;
                case 'availability': return `Availability: ${value.replace('-', ' ')}`;
                default: return '';
            }
        })
        .filter(text => text)
        .join(', ');
    
    const resultsHTML = `
        <div class="advanced-search-results">
            <div class="container">
                <h2 class="section-title">Advanced Search Results</h2>
                <div class="search-criteria">
                    <p><strong>Search Criteria:</strong> ${criteriaText || 'No specific criteria'}</p>
                    <p><strong>Results:</strong> ${results.length} products found</p>
                </div>
                
                <div class="product-grid">
                    ${results.length === 0 ? 
                        '<div class="empty-results"><h3>No products found</h3><p>Try adjusting your search criteria.</p></div>' :
                        results.map(product => createProductCard(product)).join('')
                    }
                </div>
                
                <div class="search-actions">
                    <button class="btn btn-outline" onclick="showAdvancedSearch()">Refine Search</button>
                    <button class="btn btn-primary" onclick="showProducts('all')">Browse All Products</button>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.main').innerHTML = resultsHTML;
}

function closeAdvancedSearch() {
    const modal = document.getElementById('advancedSearchModal');
    if (modal) {
        modal.remove();
    }
}

function resetAdvancedSearch() {
    document.getElementById('advancedSearchForm').reset();
}

// Search history and saved searches
function saveSearch(query, filters = {}) {
    if (!shopState.currentUser) return;
    
    const searchHistoryKey = `searchHistory_${shopState.currentUser.uid}`;
    const searchHistory = JSON.parse(localStorage.getItem(searchHistoryKey)) || [];
    
    const searchEntry = {
        query: query,
        filters: filters,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };
    
    // Add to beginning and limit to 20 entries
    searchHistory.unshift(searchEntry);
    const limitedHistory = searchHistory.slice(0, 20);
    
    localStorage.setItem(searchHistoryKey, JSON.stringify(limitedHistory));
}

function getSearchHistory() {
    if (!shopState.currentUser) return [];
    
    const searchHistoryKey = `searchHistory_${shopState.currentUser.uid}`;
    return JSON.parse(localStorage.getItem(searchHistoryKey)) || [];
}

function clearSearchHistory() {
    if (!shopState.currentUser) return;
    
    const searchHistoryKey = `searchHistory_${shopState.currentUser.uid}`;
    localStorage.removeItem(searchHistoryKey);
    showAlert('Search history cleared');
}

// Hide suggestions when clicking outside
document.addEventListener('click', (event) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(event.target)) {
        hideSuggestions();
    }
});

// Export functions for global access
window.selectSuggestion = selectSuggestion;
window.performSearch = performSearch;
window.sortSearchResults = sortSearchResults;
window.filterSearchResults = filterSearchResults;
window.showAdvancedSearch = showAdvancedSearch;
window.closeAdvancedSearch = closeAdvancedSearch;
window.resetAdvancedSearch = resetAdvancedSearch;
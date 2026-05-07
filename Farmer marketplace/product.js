// Product Details Page JavaScript

const API_BASE_URL = window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'http://localhost:3000';

let currentProduct = null;
let marketChart = null;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
    loadProductDetails();
    updateAuthButton();
    updateCartCount();
});

// Get product ID from URL parameters
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// Load product details from API
async function loadProductDetails() {
    const productId = getProductId();
    if (!productId) {
        showError('Product not found');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Product not found');
        }

        const product = await response.json();
        currentProduct = product;
        displayProductDetails(product);
        loadMarketInsights(product);
        loadAIRecommendation(product);
        loadFarmerDetails(product);
        loadReviews(product);
    } catch (error) {
        console.error('Error loading product:', error);
        showError('Failed to load product details');
    }
}

// Display product details in the UI
function displayProductDetails(product) {
    // Basic info
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-price').textContent = product.price.toFixed(2);
    document.getElementById('product-quantity').textContent = product.quantity;
    document.getElementById('product-description').textContent = product.description;

    // Rating
    const rating = product.rating || 4.5;
    document.getElementById('product-stars').textContent = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    document.getElementById('product-reviews').textContent = `(${product.reviewCount || 0} reviews)`;

    // Badges
    const badgesContainer = document.getElementById('product-badges');
    badgesContainer.innerHTML = '';
    (product.badges || ['Organic', 'Fresh Harvest']).forEach(badge => {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'badge';
        badgeEl.textContent = badge;
        badgesContainer.appendChild(badgeEl);
    });

    // Tags
    const tagsContainer = document.getElementById('product-tags');
    tagsContainer.innerHTML = '';
    (product.tags || ['Chemical Free', 'Naturally Grown', 'High Quality']).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
    });

    // Images
    displayProductImages(product.images || []);

    // Product details
    document.getElementById('detail-category').textContent = product.category;
    document.getElementById('detail-harvest-date').textContent = product.harvestDate || 'Fresh harvest';
    document.getElementById('detail-shelf-life').textContent = product.shelfLife || '7-10 days';
    document.getElementById('detail-organic').textContent = product.organic ? 'Yes' : 'No';
    document.getElementById('detail-storage').textContent = product.storage || 'Store in cool, dry place';
    document.getElementById('detail-delivery').textContent = product.delivery || '1-2 days';

    // Update page title
    document.title = `${product.name} - FarmDirect`;
}

// Display product images
function displayProductImages(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');

    // Default images if none provided
    if (!images || images.length === 0) {
        images = [`https://via.placeholder.com/400x400?text=${encodeURIComponent(currentProduct.name)}`];
    }

    // Main image
    mainImage.src = images[0];
    mainImage.alt = currentProduct.name;

    // Thumbnails
    thumbnailGallery.innerHTML = '';
    images.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = `${currentProduct.name} ${index + 1}`;
        thumbnail.className = 'thumbnail';
        if (index === 0) thumbnail.classList.add('active');

        thumbnail.addEventListener('click', () => {
            mainImage.src = image;
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });

        thumbnailGallery.appendChild(thumbnail);
    });

    // Image zoom functionality
    mainImage.addEventListener('click', () => openImageModal(images[0]));
}

// Load market insights
function loadMarketInsights(product) {
    const marketData = product.marketInsights || {
        minPrice: product.price * 0.8,
        maxPrice: product.price * 1.2,
        farmerPrice: product.price,
        averagePrice: product.price * 0.95
    };

    document.getElementById('min-price').textContent = marketData.minPrice.toFixed(2);
    document.getElementById('max-price').textContent = marketData.maxPrice.toFixed(2);
    document.getElementById('farmer-price').textContent = marketData.farmerPrice.toFixed(2);
    document.getElementById('average-price').textContent = marketData.averagePrice.toFixed(2);

    // Create market trend chart
    const ctx = document.getElementById('market-chart').getContext('2d');
    const chartData = product.marketTrend || generateSampleMarketData(product.price);

    if (marketChart) {
        marketChart.destroy();
    }

    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Price Trend',
                data: chartData.prices,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

// Generate sample market data for chart
function generateSampleMarketData(basePrice) {
    const labels = [];
    const prices = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        // Random price variation
        const variation = (Math.random() - 0.5) * 0.2; // ±10%
        prices.push((basePrice * (1 + variation)).toFixed(2));
    }

    return { labels, prices };
}

// Load AI recommendation
function loadAIRecommendation(product) {
    const recommendation = product.aiRecommendation || {
        minPrice: product.price * 0.9,
        maxPrice: product.price * 1.1,
        demandLevel: 'Medium',
        demandPercentage: 60,
        insights: [
            'Increased demand due to seasonal trends',
            'Supply shortage in local markets',
            'Freshness factor adds value',
            'Competitive pricing recommended'
        ]
    };

    document.getElementById('rec-min-price').textContent = recommendation.minPrice.toFixed(2);
    document.getElementById('rec-max-price').textContent = recommendation.maxPrice.toFixed(2);
    document.getElementById('demand-level').textContent = recommendation.demandLevel;
    document.getElementById('demand-meter-fill').style.width = `${recommendation.demandPercentage}%`;

    const insightsContainer = document.getElementById('ai-insights');
    insightsContainer.innerHTML = '';
    recommendation.insights.forEach(insight => {
        const insightEl = document.createElement('div');
        insightEl.className = 'insight-item';
        insightEl.textContent = insight;
        insightsContainer.appendChild(insightEl);
    });
}

// Load farmer details
function loadFarmerDetails(product) {
    const farmer = product.farmerDetails || {
        name: product.farmer,
        avatar: `https://via.placeholder.com/120x120?text=${encodeURIComponent(product.farmer.charAt(0))}`,
        rating: 4.8,
        reviewCount: 127,
        orders: 89,
        experience: 12,
        location: 'Local Farm',
        bio: 'Experienced farmer committed to sustainable and organic farming practices.',
        badges: ['Natural Farming', 'Pesticide Free', 'Sustainable']
    };

    document.getElementById('farmer-avatar').src = farmer.avatar;
    document.getElementById('farmer-name').textContent = farmer.name;
    document.getElementById('farmer-stars').textContent = '★'.repeat(Math.floor(farmer.rating)) + '☆'.repeat(5 - Math.floor(farmer.rating));
    document.getElementById('farmer-reviews').textContent = `(${farmer.reviewCount} reviews)`;
    document.getElementById('farmer-orders').textContent = farmer.orders;
    document.getElementById('farmer-experience').textContent = farmer.experience;
    document.getElementById('farmer-location').textContent = farmer.location;
    document.getElementById('farmer-bio').textContent = farmer.bio;

    const badgesContainer = document.getElementById('farmer-badges');
    badgesContainer.innerHTML = '';
    farmer.badges.forEach(badge => {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'badge';
        badgeEl.textContent = badge;
        badgesContainer.appendChild(badgeEl);
    });
}

// Load reviews
function loadReviews(product) {
    const reviews = product.reviews || generateSampleReviews();
    const container = document.getElementById('reviews-container');

    container.innerHTML = '';
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';

        reviewCard.innerHTML = `
            <div class="review-header">
                <img src="${review.avatar}" alt="${review.name}" class="reviewer-avatar">
                <div class="reviewer-info">
                    <h4>${review.name}</h4>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                </div>
            </div>
            <div class="review-text">${review.text}</div>
        `;

        container.appendChild(reviewCard);
    });
}

// Generate sample reviews
function generateSampleReviews() {
    return [
        {
            name: 'Rajesh Kumar',
            avatar: 'https://via.placeholder.com/40x40?text=R',
            rating: 5,
            text: 'Excellent quality produce! Fresh and exactly as described. Will definitely order again.'
        },
        {
            name: 'Priya Sharma',
            avatar: 'https://via.placeholder.com/40x40?text=P',
            rating: 4,
            text: 'Very good quality. Delivery was on time and the farmer was very responsive to messages.'
        },
        {
            name: 'Amit Patel',
            avatar: 'https://via.placeholder.com/40x40?text=A',
            rating: 5,
            text: 'Best tomatoes I\'ve had in years. Truly organic and fresh. Highly recommended!'
        }
    ];
}

// Action button handlers
document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    if (!currentProduct) return;

    if (!getStoredToken()) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    addToCart(currentProduct.id);
    updateCartCount();
    showToast('Added to cart successfully!');
});

document.getElementById('buy-now-btn').addEventListener('click', () => {
    if (!currentProduct) return;

    if (!getStoredToken()) {
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }

    addToCart(currentProduct.id);
    window.location.href = 'index.html#cart';
});

document.getElementById('chat-farmer-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    messageJavaScript(currentProduct.farmerId, currentProduct.farmer);
});

document.getElementById('chat-farmer-detail-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    messageJavaScript(currentProduct.farmerId, currentProduct.farmer);
});

document.getElementById('view-farmer-btn').addEventListener('click', () => {
    // Placeholder for farmer profile page
    alert('Farmer profile page coming soon!');
});

// Image modal functions
function openImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    modal.style.display = 'block';
    modalImg.src = imageSrc;
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

// Utility functions
function showError(message) {
    const container = document.querySelector('.product-details-container');
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2>Error</h2>
            <p>${message}</p>
            <button onclick="window.location.href='index.html'" class="btn-primary">Back to Home</button>
        </div>
    `;
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Add toast animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
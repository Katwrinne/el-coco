// Variables globales
let products = [];
let cart = [];
let currentProductId = null;

// Categorías de productos
const categories = [
    { id: 'churros', name: 'Churros' },
    { id: 'verduras', name: 'Verduras' },
    { id: 'pan', name: 'Pan' },
    { id: 'dulces', name: 'Dulces' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'limpieza', name: 'Limpieza' },
    { id: 'otros', name: 'Otros' }
];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    loadProductsFromStorage();
    loadCartFromStorage();
    updateCartCount();
    setupEventListeners();
    displayProducts();
    displayEditProductsList();
    displayCartItems();
});

// Configurar event listeners
function setupEventListeners() {
    // Navegación por pestañas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Filtro de categorías
    document.getElementById('category-filter').addEventListener('change', displayProducts);
    
    // Formulario de producto
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    document.getElementById('clear-form').addEventListener('click', clearProductForm);
    
    // Carrito
    document.getElementById('clear-cart').addEventListener('click', clearCart);
    document.getElementById('calculate-total').addEventListener('click', calculateTotal);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('price-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// Cargar productos desde localStorage
function loadProductsFromStorage() {
    const storedProducts = localStorage.getItem('elcoco_products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        // Productos de ejemplo
        products = [
            {
                id: 1,
                name: 'Jabón PODER Ultra',
                category: 'limpieza',
                prices: {
                    package: { price: 2.50, unit: 'paquete' },
                    unit: { price: 0.90, packageUnits: 3 },
                    weight: null
                }
            },
            {
                id: 2,
                name: 'Papas',
                category: 'verduras',
                prices: {
                    package: null,
                    unit: null,
                    weight: { perPound: 1.00, perKilo: 2.20 }
                }
            },
            {
                id: 3,
                name: 'Pan Integral',
                category: 'pan',
                prices: {
                    package: { price: 1.50, unit: 'paquete' },
                    unit: { price: 0.50, packageUnits: 3 },
                    weight: null
                }
            },
            {
                id: 4,
                name: 'Refresco de Cola',
                category: 'bebidas',
                prices: {
                    package: { price: 4.50, unit: 'pack 6 unidades' },
                    unit: { price: 0.85, packageUnits: 6 },
                    weight: null
                }
            },
            {
                id: 5,
                name: 'Churros de Canela',
                category: 'churros',
                prices: {
                    package: { price: 3.00, unit: 'paquete' },
                    unit: null,
                    weight: null
                }
            }
        ];
        saveProductsToStorage();
    }
}

// Guardar productos en localStorage
function saveProductsToStorage() {
    localStorage.setItem('elcoco_products', JSON.stringify(products));
}

// Cargar carrito desde localStorage
function loadCartFromStorage() {
    const storedCart = localStorage.getItem('elcoco_cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

// Guardar carrito en localStorage
function saveCartToStorage() {
    localStorage.setItem('elcoco_cart', JSON.stringify(cart));
}

// Cambiar entre pestañas
function switchTab(tabId) {
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activar pestaña seleccionada
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    // Actualizar la vista si es necesario
    if (tabId === 'products') {
        displayProducts();
    } else if (tabId === 'cart') {
        displayCartItems();
    }
}

// Mostrar productos en la pestaña de productos
function displayProducts() {
    const productsList = document.getElementById('products-list');
    const noProducts = document.getElementById('no-products');
    const categoryFilter = document.getElementById('category-filter').value;
    
    // Filtrar productos por categoría
    let filteredProducts = products;
    if (categoryFilter !== 'all') {
        filteredProducts = products.filter(product => product.category === categoryFilter);
    }
    
    // Mostrar mensaje si no hay productos
    if (filteredProducts.length === 0) {
        productsList.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }
    
    noProducts.style.display = 'none';
    
    // Generar HTML para cada producto
    productsList.innerHTML = filteredProducts.map(product => {
        const categoryName = categories.find(cat => cat.id === product.category)?.name || product.category;
        
        // Determinar cuántas opciones de precio tiene el producto
        const priceOptionsCount = countPriceOptions(product);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-header">
                    <h3>${product.name}</h3>
                    <span class="product-category">${categoryName}</span>
                </div>
                <div class="product-prices">
                    ${renderProductPrices(product)}
                </div>
                <div class="product-actions">
                    ${priceOptionsCount > 1 
                        ? `<button class="btn btn-primary btn-select-price" data-id="${product.id}">
                            <i class="fas fa-cart-plus"></i> Elegir Opción
                           </button>`
                        : `<button class="btn btn-primary btn-add-to-cart" data-id="${product.id}" data-price-type="${getFirstPriceType(product)}">
                            <i class="fas fa-cart-plus"></i> Agregar al Carrito
                           </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-select-price').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            openPriceModal(productId);
        });
    });
    
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            const priceType = this.getAttribute('data-price-type');
            addToCart(productId, priceType);
        });
    });
}

// Contar opciones de precio de un producto
function countPriceOptions(product) {
    let count = 0;
    if (product.prices.package && product.prices.package.price) count++;
    if (product.prices.unit && product.prices.unit.price) count++;
    if (product.prices.weight && (product.prices.weight.perPound || product.prices.weight.perKilo)) count++;
    return count;
}

// Obtener el primer tipo de precio disponible
function getFirstPriceType(product) {
    if (product.prices.package && product.prices.package.price) return 'package';
    if (product.prices.unit && product.prices.unit.price) return 'unit';
    if (product.prices.weight && (product.prices.weight.perPound || product.prices.weight.perKilo)) return 'weight';
    return 'package';
}

// Renderizar precios de un producto
function renderProductPrices(product) {
    let html = '';
    
    if (product.prices.package && product.prices.package.price) {
        html += `
            <div class="price-option">
                <div class="price-type">
                    <i class="fas fa-box"></i> Paquete
                </div>
                <div class="price-amount">$${product.prices.package.price.toFixed(2)}</div>
                <div class="price-unit">por ${product.prices.package.unit}</div>
            </div>
        `;
    }
    
    if (product.prices.unit && product.prices.unit.price) {
        html += `
            <div class="price-

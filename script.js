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
    initApp();
});

// Función de inicialización principal
function initApp() {
    loadProductsFromStorage();
    loadCartFromStorage();
    updateCartCount();
    setupEventListeners();
    displayProducts();
    displayEditProductsList();
    displayCartItems();
    showNotification('Sistema cargado correctamente', 'success');
}

// Configurar todos los event listeners
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
        // Productos de ejemplo para inicializar
        products = [
            {
                id: 1,
                name: 'Jabón PODER Ultra',
                category: 'limpieza',
                prices: {
                    package: { price: 2.50, unit: 'paquete de 3' },
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
            },
            {
                id: 6,
                name: 'Tomates',
                category: 'verduras',
                prices: {
                    package: null,
                    unit: null,
                    weight: { perPound: 0.80, perKilo: 1.76 }
                }
            },
            {
                id: 7,
                name: 'Galletas Chocolate',
                category: 'dulces',
                prices: {
                    package: { price: 2.20, unit: 'paquete' },
                    unit: { price: 0.25, packageUnits: 10 },
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
                        : `<button class="btn btn-primary btn-add-to-cart" data-id="${product.id}" 
                           data-price-type="${getFirstPriceType(product)}">
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
            <div class="price-option">
                <div class="price-type">
                    <i class="fas fa-cube"></i> Individual
                </div>
                <div class="price-amount">$${product.prices.unit.price.toFixed(2)}</div>
                <div class="price-unit">cada uno (${product.prices.unit.packageUnits} por paquete)</div>
            </div>
        `;
    }
    
    if (product.prices.weight) {
        if (product.prices.weight.perPound) {
            html += `
                <div class="price-option">
                    <div class="price-type">
                        <i class="fas fa-weight-hanging"></i> Por Peso
                    </div>
                    <div class="price-amount">$${product.prices.weight.perPound.toFixed(2)}</div>
                    <div class="price-unit">por libra</div>
                </div>
            `;
        }
        if (product.prices.weight.perKilo) {
            html += `
                <div class="price-option">
                    <div class="price-type">
                        <i class="fas fa-weight-hanging"></i> Por Peso
                    </div>
                    <div class="price-amount">$${product.prices.weight.perKilo.toFixed(2)}</div>
                    <div class="price-unit">por kilo</div>
                </div>
            `;
        }
    }
    
    return html;
}

// Abrir modal para seleccionar opción de precio
function openPriceModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentProductId = productId;
    const modal = document.getElementById('price-modal');
    const productName = document.getElementById('modal-product-name');
    const priceOptions = document.getElementById('price-options');
    
    productName.textContent = `Seleccionar opción para: ${product.name}`;
    priceOptions.innerHTML = '';
    
    // Agregar opciones según los tipos de precio disponibles
    if (product.prices.package && product.prices.package.price) {
        priceOptions.innerHTML += `
            <div class="price-option-modal" data-price-type="package">
                <h4><i class="fas fa-box"></i> Paquete</h4>
                <p>$${product.prices.package.price.toFixed(2)} por ${product.prices.package.unit}</p>
                <button class="btn btn-primary btn-select-option" data-price-type="package">
                    Seleccionar
                </button>
            </div>
        `;
    }
    
    if (product.prices.unit && product.prices.unit.price) {
        priceOptions.innerHTML += `
            <div class="price-option-modal" data-price-type="unit">
                <h4><i class="fas fa-cube"></i> Individual</h4>
                <p>$${product.prices.unit.price.toFixed(2)} cada unidad (${product.prices.unit.packageUnits} por paquete)</p>
                <button class="btn btn-primary btn-select-option" data-price-type="unit">
                    Seleccionar
                </button>
            </div>
        `;
    }
    
    if (product.prices.weight) {
        if (product.prices.weight.perPound) {
            priceOptions.innerHTML += `
                <div class="price-option-modal" data-price-type="weight" data-weight-unit="pound">
                    <h4><i class="fas fa-weight-hanging"></i> Por Libra</h4>
                    <p>$${product.prices.weight.perPound.toFixed(2)} por libra</p>
                    <button class="btn btn-primary btn-select-option" data-price-type="weight" data-weight-unit="pound">
                        Seleccionar
                    </button>
                </div>
            `;
        }
        if (product.prices.weight.perKilo) {
            priceOptions.innerHTML += `
                <div class="price-option-modal" data-price-type="weight" data-weight-unit="kilo">
                    <h4><i class="fas fa-weight-hanging"></i> Por Kilo</h4>
                    <p>$${product.prices.weight.perKilo.toFixed(2)} por kilo</p>
                    <button class="btn btn-primary btn-select-option" data-price-type="weight" data-weight-unit="kilo">
                        Seleccionar
                    </button>
                </div>
            `;
        }
    }
    
    // Agregar event listeners a los botones del modal
    document.querySelectorAll('.btn-select-option').forEach(button => {
        button.addEventListener('click', function() {
            const priceType = this.getAttribute('data-price-type');
            const weightUnit = this.getAttribute('data-weight-unit');
            addToCart(productId, priceType, weightUnit);
            closeModal();
        });
    });
    
    modal.style.display = 'flex';
}

// Cerrar modal
function closeModal() {
    document.getElementById('price-modal').style.display = 'none';
}

// Agregar producto al carrito
function addToCart(productId, priceType, weightUnit = null) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Verificar que el tipo de precio existe para este producto
    if (priceType === 'package' && (!product.prices.package || !product.prices.package.price)) {
        showNotification('Este producto no tiene precio por paquete configurado', 'error');
        return;
    }
    
    if (priceType === 'unit' && (!product.prices.unit || !product.prices.unit.price)) {
        showNotification('Este producto no tiene precio individual configurado', 'error');
        return;
    }
    
    if (priceType === 'weight' && (!product.prices.weight || 
        (!product.prices.weight.perPound && !product.prices.weight.perKilo))) {
        showNotification('Este producto no tiene precio por peso configurado', 'error');
        return;
    }
    
    // Buscar si el producto ya está en el carrito con la misma opción
    const existingItemIndex = cart.findIndex(item => 
        item.productId === productId && 
        item.priceType === priceType && 
        item.weightUnit === weightUnit
    );
    
    if (existingItemIndex !== -1) {
        // Incrementar cantidad si ya existe
        cart[existingItemIndex].quantity += 1;
        showNotification(`Cantidad aumentada para ${product.name}`, 'success');
    } else {
        // Agregar nuevo item al carrito
        const newItem = {
            id: Date.now(),
            productId: productId,
            name: product.name,
            category: product.category,
            priceType: priceType,
            weightUnit: weightUnit,
            quantity: 1,
            price: getPriceForType(product, priceType, weightUnit)
        };
        
        cart.push(newItem);
        showNotification(`${product.name} agregado al carrito`, 'success');
    }
    
    saveCartToStorage();
    updateCartCount();
    updateCartBadge();
}

// Obtener precio según el tipo seleccionado
function getPriceForType(product, priceType, weightUnit = null) {
    switch(priceType) {
        case 'package':
            return product.prices.package.price;
        case 'unit':
            return product.prices.unit.price;
        case 'weight':
            if (weightUnit === 'pound') {
                return product.prices.weight.perPound;
            } else if (weightUnit === 'kilo') {
                return product.prices.weight.perKilo;
            }
            return product.prices.weight.perPound || product.prices.weight.perKilo;
        default:
            return 0;
    }
}

// Actualizar contador de productos en el carrito
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

// Actualizar badge del carrito
function updateCartBadge() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-badge').textContent = totalItems;
}

// Mostrar productos para editar
function displayEditProductsList() {
    const editList = document.getElementById('edit-products-list');
    
    if (products.length === 0) {
        editList.innerHTML = '<p class="empty-state">No hay productos para editar</p>';
        return;
    }
    
    editList.innerHTML = products.map(product => {
        const categoryName = categories.find(cat => cat.id === product.category)?.name || product.category;
        
        return `
            <div class="edit-product-item">
                <div class="edit-product-info">
                    <h4>${product.name}</h4>
                    <p>Categoría: ${categoryName}</p>
                    <p>Precios: ${countPriceOptions(product)} opciones</p>
                </div>
                <div class="edit-product-actions">
                    <button class="btn btn-secondary btn-edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-delete-product" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners para editar y eliminar
    document.querySelectorAll('.btn-edit-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.btn-delete-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            deleteProduct(productId);
        });
    });
}

// Editar producto
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Llenar formulario con datos del producto
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    
    // Llenar precios
    if (product.prices.package && product.prices.package.price) {
        document.getElementById('package-price').value = product.prices.package.price;
    }
    
    if (product.prices.unit && product.prices.unit.price) {
        document.getElementById('unit-price').value = product.prices.unit.price;
        document.getElementById('units-per-package').value = product.prices.unit.packageUnits;
    }
    
    if (product.prices.weight) {
        if (product.prices.weight.perPound) {
            document.getElementById('price-per-pound').value = product.prices.weight.perPound;
        }
        if (product.prices.weight.perKilo) {
            document.getElementById('price-per-kilo').value = product.prices.weight.perKilo;
        }
    }
    
    // Cambiar a pestaña de agregar producto
    switchTab('add-product');
    showNotification('Puedes editar el producto en el formulario', 'info');
}

// Eliminar producto
function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    // Eliminar de la lista de productos
    products = products.filter(p => p.id !== productId);
    
    // Eliminar del carrito si está presente
    cart = cart.filter(item => item.productId !== productId);
    
    saveProductsToStorage();
    saveCartToStorage();
    displayProducts();
    displayEditProductsList();
    displayCartItems();
    updateCartCount();
    updateCartBadge();
    showNotification('Producto eliminado correctamente', 'success');
}

// Guardar producto (crear o actualizar)
function saveProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const packagePrice = parseFloat(document.getElementById('package-price').value) || null;
    const unitPrice = parseFloat(document.getElementById('unit-price').value) || null;
    const unitsPerPackage = parseInt(document.getElementById('units-per-package').value) || null;
    const pricePerPound = parseFloat(document.getElementById('price-per-pound').value) || null;
    const pricePerKilo = parseFloat(document.getElementById('price-per-kilo').value) || null;
    
    // Validaciones básicas
    if (!name || !category) {
        showNotification('Nombre y categoría son obligatorios', 'error');
        return;
    }
    
    if (!packagePrice && !unitPrice && !pricePerPound && !pricePerKilo) {
        showNotification('Debe configurar al menos un tipo de precio', 'error');
        return;
    }
    
    // Preparar objeto de precios
    const prices = {
        package: packagePrice ? { price: packagePrice, unit: 'paquete' } : null,
        unit: (unitPrice && unitsPerPackage) ? { price: unitPrice, packageUnits: unitsPerPackage } : null,
        weight: (pricePerPound || pricePerKilo) ? { 
            perPound: pricePerPound, 
            perKilo: pricePerKilo 
        } : null
    };
    
    // Buscar si estamos editando un producto existente
    const existingProductIndex = products.findIndex(p => p.id === currentProductId);
    
    if (existingProductIndex !== -1) {
        // Actualizar producto existente
        products[existingProductIndex].name = name;
        products[existingProductIndex].category = category;
        products[existingProductIndex].prices = prices;
        showNotification('Producto actualizado correctamente', 'success');
        currentProductId = null;
    } else {
        // Crear nuevo producto
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: name,
            category: category,
            prices: prices
        };
        
        products.push(newProduct);
        showNotification('Producto agregado correctamente', 'success');
    }
    
    saveProductsToStorage();
    clearProductForm();
    displayProducts();
    displayEditProductsList();
    switchTab('products');
}

// Limpiar formulario de producto
function clearProductForm() {
    document.getElementById('product-form').reset();
    currentProductId = null;
}

// Mostrar items del carrito
function displayCartItems() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.style.display = 'block';
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }
    
    emptyCart.style.display = 'none';
    
    cartItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        const priceText = getPriceText(product, item.priceType, item.weightUnit);
        
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${priceText}</div>
                    <span class="cart-item-type">${getPriceTypeText(item.priceType, item.weightUnit)}</span>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="decrease-quantity" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                    <button class="remove-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners para controles del carrito
    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            updateCartItemQuantity(itemId, -1);
        });
    });
    
    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            updateCartItemQuantity(itemId, 1);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            removeCartItem(itemId);
        });
    });
    
    calculateTotal();
}

// Obtener texto del precio para mostrar
function getPriceText(product, priceType, weightUnit) {
    if (!product) return '';
    
    switch(priceType) {
        case 'package':
            return `$${product.prices.package.price.toFixed(2)} por ${product.prices.package.unit}`;
        case 'unit':
            return `$${product.prices.unit.price.toFixed(2)} por unidad`;
        case 'weight':
            if (weightUnit === 'pound') {
                return `$${product.prices.weight.perPound.toFixed(2)} por libra`;
            } else if (weightUnit === 'kilo') {
                return `$${product.prices.weight.perKilo.toFixed(2)} por kilo`;
            }
            return `$${(product.prices.weight.perPound || product.prices.weight.perKilo).toFixed(2)}`;
        default:
            return '';
    }
}

// Obtener texto del tipo de precio
function getPriceTypeText(priceType, weightUnit) {
    switch(priceType) {
        case 'package': return 'Paquete';
        case 'unit': return 'Individual';
        case 'weight': 
            return weightUnit === 'pound' ? 'Por Libra' : 
                   weightUnit === 'kilo' ? 'Por Kilo' : 'Por Peso';
        default: return '';
    }
}

// Actualizar cantidad de item en el carrito
function updateCartItemQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    const newQuantity = cart[itemIndex].quantity + change;
    
    if (newQuantity < 1) {
        removeCartItem(itemId);
        return;
    }
    
    cart[itemIndex].quantity = newQuantity;
    saveCartToStorage();
    updateCartCount();
    updateCartBadge();
    displayCartItems();
}

// Eliminar item del carrito
function removeCartItem(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCartToStorage();
    updateCartCount();
    updateCartBadge();
    displayCartItems();
    showNotification('Producto eliminado del carrito', 'info');
}

// Calcular total del carrito
function calculateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
    showNotification(`Total calculado: $${total.toFixed(2)}`, 'success');
}

// Limpiar carrito
function clearCart() {
    if (cart.length === 0) {
        showNotification('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        saveCartToStorage();
        updateCartCount();
        updateCartBadge();
        displayCartItems();
        showNotification('Carrito vaciado correctamente', 'success');
    }
}

// Mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    // Configurar color según tipo
    let bgColor = '#a3dc9a'; // verde por defecto (success)
    if (type === 'error') bgColor = '#ff7b7b';
    if (type === 'info') bgColor = '#fff9bd';
    if (type === 'warning') bgColor = '#ffd6ba';
    
    notification.style.backgroundColor = bgColor;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Constantes para LocalStorage
const STORAGE_KEY_PRODUCTS = 'elCocoProducts';
const STORAGE_KEY_CART = 'elCocoCart';
const KG_PER_LB = 0.453592; // Factor de conversión

// Variables globales del DOM
const tabsContainer = document.querySelector('.tabs');
const tabContents = document.querySelectorAll('.tab-content');
const productList = document.getElementById('product-list');
const addProductForm = document.getElementById('add-product-form');
const cartList = document.getElementById('cart-list');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const productCounterElement = document.getElementById('product-counter');
const categoryFilter = document.getElementById('category-filter');
const modal = document.getElementById('selection-modal');
const modalOptions = document.getElementById('modal-options');
const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const emptyCartMessage = document.getElementById('empty-cart-message');
const noProductsMessage = document.getElementById('no-products-message');
const notificationsContainer = document.getElementById('notifications-container');

// Evento para habilitar/deshabilitar campos opcionales
document.getElementById('enable-individual-price').addEventListener('change', (e) => {
    document.querySelector('.individual-fields').classList.toggle('hidden', !e.target.checked);
    document.getElementById('price-individual').required = e.target.checked;
    document.getElementById('units-per-pack').required = e.target.checked;
});

document.getElementById('enable-weight-price').addEventListener('change', (e) => {
    document.querySelector('.weight-fields').classList.toggle('hidden', !e.target.checked);
    document.getElementById('price-per-lb').required = e.target.checked;
});

// --- Manejo de Datos (localStorage) ---

/**
 * Carga los datos desde localStorage.
 * @param {string} key La clave de localStorage.
 * @returns {Array} Los datos parseados o un array vacío si no hay.
 */
function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

/**
 * Guarda los datos en localStorage.
 * @param {string} key La clave de localStorage.
 * @param {Array} data El array de datos a guardar.
 */
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Inicialización de productos y carrito
let products = loadData(STORAGE_KEY_PRODUCTS);
let cart = loadData(STORAGE_KEY_CART);

// --- Notificaciones ---
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    notificationsContainer.appendChild(notification);
    
    // Mostrar y luego ocultar
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 3000);
}

// --- Manejo de Pestañas ---
function changeTab(tabId) {
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Activar la pestaña y contenido seleccionados
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    // Refrescar el carrito si cambiamos a esa pestaña
    if (tabId === 'cart') {
        renderCart();
    }
}

tabsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
        changeTab(e.target.dataset.tab);
    }
});

// --- Pestaña 2: Agregar Productos ---

addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const priceNormal = parseFloat(document.getElementById('price-normal').value);
    const unitNormal = document.getElementById('unit-normal').value;
    
    const newProduct = {
        id: Date.now(),
        name,
        category,
        prices: [{ type: 'normal', price: priceNormal, unit: unitNormal, label: `Paquete: $${priceNormal.toFixed(2)} por ${unitNormal}` }]
    };

    // Agregar Precio Individual
    if (document.getElementById('enable-individual-price').checked) {
        const priceIndividual = parseFloat(document.getElementById('price-individual').value);
        const unitsPerPack = parseInt(document.getElementById('units-per-pack').value);
        if (priceIndividual > 0 && unitsPerPack > 0) {
            newProduct.prices.push({ 
                type: 'individual', 
                price: priceIndividual, 
                unit: 'unidad', 
                unitsPerPack,
                label: `Individual: $${priceIndividual.toFixed(2)} c/u (${unitsPerPack} por paquete)`
            });
        }
    }

    // Agregar Precio por Peso
    if (document.getElementById('enable-weight-price').checked) {
        const pricePerLb = parseFloat(document.getElementById('price-per-lb').value);
        if (pricePerLb > 0) {
            const pricePerKg = pricePerLb / KG_PER_LB;
            newProduct.prices.push({ 
                type: 'weight', 
                priceLb: pricePerLb,
                priceKg: pricePerKg,
                unit: 'peso',
                label: `Peso: $${pricePerLb.toFixed(2)} por libra ($${pricePerKg.toFixed(2)} por kilo)`
            });
        }
    }

    products.push(newProduct);
    saveData(STORAGE_KEY_PRODUCTS, products);
    addProductForm.reset();
    showNotification(`✅ Producto "${name}" agregado con éxito.`);
    
    // Cambiar a la pestaña de productos y refrescar la vista
    changeTab('products');
    renderProducts();
});

// --- Pestaña 1: Productos Disponibles ---

/**
 * Renderiza la lista de productos en la interfaz.
 * @param {string} filterCategory Categoría para filtrar.
 */
function renderProducts(filterCategory = 'all') {
    productList.innerHTML = '';
    
    const filteredProducts = products.filter(p => filterCategory === 'all' || p.category === filterCategory);

    if (filteredProducts.length === 0) {
        noProductsMessage.style.display = 'block';
        return;
    }
    noProductsMessage.style.display = 'none';

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h3>${product.name}</h3>
            <p>Categoría: **${product.category.charAt(0).toUpperCase() + product.category.slice(1)}**</p>
            <hr style="margin: 8px 0;">
            ${product.prices.map(price => `<div class="price-option">${price.label}</div>`).join('')}
            <button class="select-button" data-id="${product.id}">Elegir Opción</button>
        `;
        productList.appendChild(card);
    });

    // Actualizar contador
    productCounterElement.textContent = `Productos Totales: ${products.length}`;

    // Llenar el filtro de categorías (solo categorías de productos existentes)
    const existingCategories = [...new Set(products.map(p => p.category))];
    categoryFilter.innerHTML = '<option value="all">Todas</option>' + 
        existingCategories.map(cat => `<option value="${cat}" ${cat === filterCategory ? 'selected' : ''}>${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join('');
}

// Evento para el filtro de categoría
categoryFilter.addEventListener('change', (e) => {
    renderProducts(e.target.value);
});

// --- Modal de Selección (para agregar al carrito) ---

let currentProduct = null;
let currentPriceOption = null;

productList.addEventListener('click', (e) => {
    if (e.target.classList.contains('select-button')) {
        const productId = parseInt(e.target.dataset.id);
        currentProduct = products.find(p => p.id === productId);

        if (!currentProduct) return;

        // Mostrar nombre del producto en el modal
        document.getElementById('modal-product-details').innerHTML = `<h4>${currentProduct.name}</h4>`;
        modalOptions.innerHTML = '';
        currentPriceOption = null;
        addToCartModalBtn.disabled = true;

        // Crear opciones en el modal
        currentProduct.prices.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'price-option';
            optionDiv.dataset.index = index;
            
            let inputField;
            if (option.type === 'weight') {
                // Para peso: campo para ingresar la cantidad en libras
                inputField = `<input type="number" step="0.01" min="0.01" value="1.00" class="modal-price-input" data-unit="lb" placeholder="Libras" onchange="updateWeightDisplay(this, ${option.priceLb})">`;
                optionDiv.innerHTML = `
                    <span>${option.label.split('(')[0]}</span>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        ${inputField} <span class="weight-unit">lb</span>
                    </div>
                `;
            } else {
                // Para normal/individual/cantidad: campo para ingresar la cantidad de unidades/paquetes
                inputField = `<input type="number" min="1" value="1" class="modal-price-input" data-unit="${option.unit}" placeholder="Cantidad">`;
                optionDiv.innerHTML = `
                    <span>${option.label}</span>
                    ${inputField}
                `;
            }

            modalOptions.appendChild(optionDiv);

            // Manejar la selección y el campo de cantidad
            optionDiv.addEventListener('click', () => {
                document.querySelectorAll('#modal-options .price-option').forEach(o => o.classList.remove('selected'));
                optionDiv.classList.add('selected');
                currentPriceOption = { ...option, index };
                addToCartModalBtn.disabled = false;
            });

            // Prevenir que el click en el input active la selección
            optionDiv.querySelector('.modal-price-input').addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        modal.style.display = 'block';
    }
});

// Helper para actualizar el display de peso (libras/kilos)
function updateWeightDisplay(input, priceLb) {
    const value = parseFloat(input.value) || 0;
    const kgValue = (value * KG_PER_LB).toFixed(2);
    const totalCost = (value * priceLb).toFixed(2);
    
    // Muestra también el peso en kilos y el costo total en una etiqueta cercana (ejemplo de mejora de UX)
    // Para simplificar el ejemplo, solo aseguramos que el valor sea válido.
    // En un proyecto real, agregarías un span para mostrar el cálculo de Kg.
}

// Evento para agregar producto (desde el modal) al carrito
addToCartModalBtn.addEventListener('click', () => {
    if (!currentProduct || !currentPriceOption) {
        showNotification('⚠️ Por favor, selecciona una opción de precio.');
        return;
    }

    const selectedOptionDiv = document.querySelector('#modal-options .price-option.selected');
    const quantityInput = selectedOptionDiv ? selectedOptionDiv.querySelector('.modal-price-input') : null;
    const quantity = parseFloat(quantityInput?.value) || 1;

    if (quantity <= 0) {
        showNotification('⚠️ La cantidad debe ser mayor a cero.');
        return;
    }

    // Estructura del objeto del carrito
    const cartItem = {
        cartId: Date.now(), // ID único para este elemento en el carrito
        productId: currentProduct.id,
        name: currentProduct.name,
        category: currentProduct.category,
        priceOption: currentPriceOption, // El objeto de precio seleccionado
        quantity: quantity,
        unitLabel: currentPriceOption.type === 'weight' ? 'lb' : 'unidades', // Unidad para mostrar
        total: 0 // Se calculará después
    };

    cart.push(cartItem);
    saveData(STORAGE_KEY_CART, cart);
    closeModal();
    showNotification(`🛒 Agregado ${quantity} ${cartItem.unitLabel} de ${cartItem.name} al carrito.`);
    renderCart(); // Refrescar el carrito
});

// Cerrar Modal
function closeModal() {
    modal.style.display = 'none';
    currentProduct = null;
    currentPriceOption = null;
}

document.querySelector('.close-button').addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});


// --- Pestaña 3: Carrito de Compra ---

/**
 * Calcula el subtotal para un ítem del carrito.
 * @param {object} item El ítem del carrito.
 * @returns {number} El subtotal.
 */
function calculateItemTotal(item) {
    const option = item.priceOption;
    let total = 0;

    switch (option.type) {
        case 'normal':
        case 'individual':
            // Precio por unidad o por paquete (cantidad simple)
            // Nota: Usamos el campo 'price' para precio normal e individual
            total = option.price * item.quantity; 
            break;
        case 'weight':
            // Precio por peso (cantidad en libras)
            total = option.priceLb * item.quantity;
            break;
        default:
            total = 0;
    }
    
    // Actualizar el total del ítem en el objeto
    item.total = total; 
    return total;
}

/**
 * Renderiza el carrito de compra y calcula el total.
 */
function renderCart() {
    cartList.innerHTML = '';
    let grandTotal = 0;

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartCountElement.textContent = 0;
        cartTotalElement.textContent = '$0.00';
        return;
    }
    emptyCartMessage.style.display = 'none';
    
    cart.forEach(item => {
        const itemTotal = calculateItemTotal(item);
        grandTotal += itemTotal;

        const option = item.priceOption;
        
        let unitText = '';
        if (option.type === 'weight') {
            const kgValue = (item.quantity * KG_PER_LB).toFixed(2);
            unitText = `(${item.quantity.toFixed(2)} lb / ${kgValue} kg)`;
        } else if (option.type === 'individual') {
            unitText = `(${item.quantity} unidades individuales)`;
        } else {
            unitText = `(${item.quantity} ${option.unit})`;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.dataset.cartId = item.cartId;
        itemDiv.innerHTML = `
            <div class="item-header">
                <span>${item.name}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
            <div class="item-details">
                **Opción:** ${option.label.split(':')[0]} <br>
                **Cantidad:** ${item.quantity.toFixed(option.type === 'weight' ? 2 : 0)} ${unitText}
            </div>
            <div class="quantity-controls">
                <label for="qty-${item.cartId}">Ajustar Cantidad (${item.unitLabel}):</label>
                <input type="number" 
                       id="qty-${item.cartId}" 
                       value="${item.quantity.toFixed(option.type === 'weight' ? 2 : 0)}" 
                       step="${option.type === 'weight' ? '0.01' : '1'}" 
                       min="${option.type === 'weight' ? '0.01' : '1'}" 
                       data-cart-id="${item.cartId}"
                       class="cart-quantity-input">
                <button class="remove-btn" data-cart-id="${item.cartId}">Eliminar</button>
            </div>
        `;
        cartList.appendChild(itemDiv);
    });

    cartTotalElement.textContent = `$${grandTotal.toFixed(2)}`;
    cartCountElement.textContent = cart.length;
    saveData(STORAGE_KEY_CART, cart);
}

// Evento para ajustar la cantidad
cartList.addEventListener('change', (e) => {
    if (e.target.classList.contains('cart-quantity-input')) {
        const cartId = parseInt(e.target.dataset.cartId);
        const newQuantity = parseFloat(e.target.value);
        
        if (newQuantity <= 0) {
            showNotification('⚠️ Cantidad inválida, use el botón "Eliminar".');
            e.target.value = cart.find(i => i.cartId === cartId).quantity; // Revertir valor
            return;
        }

        const itemIndex = cart.findIndex(i => i.cartId === cartId);
        if (itemIndex > -1) {
            cart[itemIndex].quantity = newQuantity;
            renderCart();
        }
    }
});

// Evento para recalcular total
document.getElementById('calculate-total-btn').addEventListener('click', () => {
    renderCart();
    showNotification('Recalculando Total...');
});


// Evento para eliminar ítem del carrito
cartList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const cartId = parseInt(e.target.dataset.cartId);
        const itemIndex = cart.findIndex(i => i.cartId === cartId);
        
        if (itemIndex > -1) {
            const removedItemName = cart[itemIndex].name;
            cart.splice(itemIndex, 1);
            showNotification(`❌ Eliminado "${removedItemName}" del carrito.`);
            renderCart();
        }
    }
});

// Evento para limpiar carrito
document.getElementById('clear-cart-btn').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        saveData(STORAGE_KEY_CART, cart);
        showNotification('🗑️ Carrito vaciado.');
        renderCart();
    }
});

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderCart();
});

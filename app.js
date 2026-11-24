
"use strict";

/* ==========================================
   RETAILFLOW POS
   HTML + CSS + VANILLA JAVASCRIPT
   ========================================== */

const STORAGE_KEYS = {
    products: "retailflow_products_v1",
    sales: "retailflow_sales_v1",
    cart: "retailflow_cart_v1",
    settings: "retailflow_settings_v1"
};

const $ = (selector) => document.querySelector(selector);

const money = (amount) =>
    new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES"
    }).format(Number(amount) || 0);

const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

const todayKey = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const dateTime = (value) =>
    new Date(value).toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short"
    });

function loadStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(`Could not load ${key}:`, error);
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Could not save ${key}:`, error);
        showToast("Storage unavailable or full. Your changes may not persist.");
        return false;
    }
}

/* ==========================================
   SAMPLE DATA
   ========================================== */

function createSampleProducts() {
    return [
        {
            id: "PRD-1001",
            name: "Premium Coffee",
            sku: "COF-001",
            category: "Beverages",
            stock: 32,
            lowStock: 8,
            cost: 280,
            price: 450,
            batch: "BATCH-COF-01",
            expiry: futureDate(120)
        },
        {
            id: "PRD-1002",
            name: "Fresh Milk 500ml",
            sku: "MLK-002",
            category: "Dairy",
            stock: 4,
            lowStock: 10,
            cost: 45,
            price: 70,
            batch: "MILK-2026-A",
            expiry: futureDate(12)
        },
        {
            id: "PRD-1003",
            name: "Mineral Water 1L",
            sku: "WTR-003",
            category: "Beverages",
            stock: 50,
            lowStock: 10,
            cost: 35,
            price: 60,
            batch: "WATER-01",
            expiry: futureDate(300)
        },
        {
            id: "PRD-1004",
            name: "Cooking Oil 1L",
            sku: "OIL-004",
            category: "Groceries",
            stock: 15,
            lowStock: 5,
            cost: 220,
            price: 310,
            batch: "OIL-B-12",
            expiry: futureDate(45)
        },
        {
            id: "PRD-1005",
            name: "Wheat Flour 2kg",
            sku: "FLR-005",
            category: "Groceries",
            stock: 0,
            lowStock: 8,
            cost: 130,
            price: 180,
            batch: "FLOUR-2026",
            expiry: futureDate(90)
        },
        {
            id: "PRD-1006",
            name: "Laundry Detergent",
            sku: "DET-006",
            category: "Household",
            stock: 23,
            lowStock: 6,
            cost: 160,
            price: 230,
            batch: "DET-009",
            expiry: ""
        }
    ];
}

function futureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* ==========================================
   APPLICATION STATE
   ========================================== */

let products = loadStorage(STORAGE_KEYS.products, null);
let sales = loadStorage(STORAGE_KEYS.sales, []);
let cart = loadStorage(STORAGE_KEYS.cart, []);
let settings = loadStorage(STORAGE_KEYS.settings, {
    taxRate: 16,
    paymentMethod: "cash"
});

if (!Array.isArray(products)) {
    products = createSampleProducts();
    saveStorage(STORAGE_KEYS.products, products);
}

if (!Array.isArray(sales)) sales = [];
if (!Array.isArray(cart)) cart = [];

settings = {
    taxRate: 16,
    paymentMethod: "cash",
    ...settings
};

let selectedReceipt = null;
let toastTimer = null;

/* ==========================================
   STORAGE HELPERS
   ========================================== */

function persistProducts() {
    saveStorage(STORAGE_KEYS.products, products);
}

function persistSales() {
    saveStorage(STORAGE_KEYS.sales, sales);
}

function persistCart() {
    saveStorage(STORAGE_KEYS.cart, cart);
}

function persistSettings() {
    saveStorage(STORAGE_KEYS.settings, settings);
}

/* ==========================================
   GENERAL HELPERS
   ========================================== */

function showToast(message) {
    const toast = $("#toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function findProduct(id) {
    return products.find((product) => product.id === id);
}

function getProductStatus(product) {
    if (product.stock <= 0) return "out";
    if (product.stock <= product.lowStock) return "low";
    return "available";
}

function getExpiryStatus(product) {
    if (!product.expiry) return null;

    const expiry = new Date(`${product.expiry}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const difference = Math.ceil(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (difference < 0) {
        return { type: "expired", label: "Expired" };
    }

    if (difference === 0) {
        return { type: "warning", label: "Expires today" };
    }

    if (difference <= 30) {
        return {
            type: "warning",
            label: `${difference} days left`
        };
    }

    return { type: "success", label: "Valid" };
}

function formatDate(date) {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;
}

function getTotals() {
    const subtotal = cart.reduce((total, item) => {
        const product = findProduct(item.productId);

        return total + (product ? product.price * item.quantity : 0);
    }, 0);

    const rate = Math.min(100, Math.max(0, Number(settings.taxRate) || 0));
    const tax = subtotal * rate / 100;

    return {
        subtotal,
        tax,
        total: subtotal + tax,
        rate
    };
}

function getCartQuantity() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/* ==========================================
   NAVIGATION
   ========================================== */

document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach((item) => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});

$("#quick-checkout").addEventListener("click", () => {
    $("#checkout").scrollIntoView({ behavior: "smooth" });
});

$("#quick-inventory").addEventListener("click", () => {
    $("#inventory").scrollIntoView({ behavior: "smooth" });
});

/* ==========================================
   DASHBOARD
   ========================================== */

function renderDashboard() {
    const today = todayKey();

    const todaysSales = sales.filter((sale) => {
        return sale.date.slice(0, 10) === today;
    });

    const revenue = todaysSales.reduce(
        (total, sale) => total + sale.subtotal,
        0
    );

    const cogs = todaysSales.reduce(
        (total, sale) => total + sale.cogs,
        0
    );

    const profit = revenue - cogs;

    $("#today-revenue").textContent = money(revenue);
    $("#today-cogs").textContent = money(cogs);
    $("#today-profit").textContent = money(profit);
    $("#today-transactions").textContent = todaysSales.length;

    $("#today-label").textContent = new Date().toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    $("#current-date").textContent = new Date().toLocaleDateString("en-KE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    renderAlerts();
}

function renderAlerts() {
    const alerts = [];

    products.forEach((product) => {
        if (product.stock <= product.lowStock) {
            alerts.push({
                name: product.name,
                detail: `${product.stock} units remaining`,
                type: product.stock === 0 ? "danger" : "warning",
                label: product.stock === 0 ? "Out of stock" : "Low stock"
            });
        }

        const expiry = getExpiryStatus(product);

        if (expiry && ["expired", "warning"].includes(expiry.type)) {
            alerts.push({
                name: product.name,
                detail: `Batch ${product.batch || "Not specified"} · ${formatDate(product.expiry)}`,
                type: expiry.type === "expired" ? "danger" : "warning",
                label: expiry.label
            });
        }
    });

    $("#low-stock-count").textContent = alerts.length;

    if (!alerts.length) {
        $("#inventory-alerts").innerHTML = `
            <div class="empty-state">No inventory alerts. Everything looks good.</div>
        `;
        return;
    }

    $("#inventory-alerts").innerHTML = alerts.map((alert) => `
        <div class="alert-item">
            <div>
                <strong>${escapeHTML(alert.name)}</strong>
                <small>${escapeHTML(alert.detail)}</small>
            </div>
            <span class="alert-tag ${alert.type}">
                ${escapeHTML(alert.label)}
            </span>
        </div>
    `).join("");
}

/* ==========================================
   PRODUCT INVENTORY
   ========================================== */

function renderCategoryFilter() {
    const select = $("#category-filter");
    const current = select.value;

    const categories = [...new Set(
        products.map((product) => product.category).filter(Boolean)
    )].sort();

    select.innerHTML = `
        <option value="all">All categories</option>
        ${categories.map((category) => `
            <option value="${escapeHTML(category)}">
                ${escapeHTML(category)}
            </option>
        `).join("")}
    `;

    if (categories.includes(current)) {
        select.value = current;
    }
}

function renderInventory() {
    const search = $("#product-search").value.toLowerCase().trim();
    const category = $("#category-filter").value;
    const stockFilter = $("#stock-filter").value;

    const filtered = products.filter((product) => {
        const matchesSearch = [
            product.name,
            product.sku,
            product.category,
            product.batch
        ].some((value) => String(value || "").toLowerCase().includes(search));

        const matchesCategory =
            category === "all" || product.category === category;

        const status = getProductStatus(product);

        const matchesStock =
            stockFilter === "all" ||
            (stockFilter === "low" && status === "low") ||
            (stockFilter === "out" && status === "out") ||
            (stockFilter === "available" && status === "available");

        return matchesSearch && matchesCategory && matchesStock;
    });

    $("#product-count").textContent =
        `${filtered.length} of ${products.length} products`;

    if (!filtered.length) {
        $("#product-table-body").innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">No matching products found.</div>
                </td>
            </tr>
        `;
        return;
    }

    $("#product-table-body").innerHTML = filtered.map((product) => {
        const stockStatus = getProductStatus(product);
        const expiry = getExpiryStatus(product);

        let statusClass = "success";
        let statusLabel = "In stock";

        if (stockStatus === "low") {
            statusClass = "warning";
            statusLabel = "Low stock";
        }

        if (stockStatus === "out") {
            statusClass = "danger";
            statusLabel = "Out of stock";
        }

        const expiryText = expiry
            ? `${formatDate(product.expiry)} · ${expiry.label}`
            : "No expiry";

        return `
            <tr>
                <td>
                    <span class="product-name">${escapeHTML(product.name)}</span>
                    <span class="product-category">${escapeHTML(product.category)}</span>
                </td>

                <td>${escapeHTML(product.sku)}</td>

                <td>
                    <span class="stock-value">${product.stock}</span>
                    <small> / ${product.lowStock} min.</small>
                </td>

                <td>${money(product.cost)}</td>
                <td><strong>${money(product.price)}</strong></td>

                <td>
                    ${escapeHTML(expiryText)}
                    <small class="product-category">
                        ${escapeHTML(product.batch || "No batch")}
                    </small>
                </td>

                <td>
                    <span class="status ${statusClass}">
                        ${statusLabel}
                    </span>
                </td>

                <td>
                    <button
                        class="table-action"
                        data-edit-product="${escapeHTML(product.id)}"
                    >Edit</button>

                    <button
                        class="table-action danger-text"
                        data-delete-product="${escapeHTML(product.id)}"
                    >Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

$("#product-search").addEventListener("input", renderInventory);
$("#category-filter").addEventListener("change", renderInventory);
$("#stock-filter").addEventListener("change", renderInventory);

/* ==========================================
   PRODUCT FORM
   ========================================== */

function openProductDialog(product = null) {
    $("#product-form").reset();

    $("#product-id").value = product?.id || "";
    $("#product-dialog-title").textContent = product
        ? "Edit product"
        : "Add new product";

    $("#product-name").value = product?.name || "";
    $("#product-sku").value = product?.sku || "";
    $("#product-category").value = product?.category || "";
    $("#product-stock").value = product?.stock ?? 0;
    $("#product-low-stock").value = product?.lowStock ?? 5;
    $("#product-cost").value = product?.cost ?? "";
    $("#product-price").value = product?.price ?? "";
    $("#product-batch").value = product?.batch || "";
    $("#product-expiry").value = product?.expiry || "";

    $("#product-dialog").showModal();
}

function closeProductDialog() {
    $("#product-dialog").close();
}

$("#header-add-product").addEventListener("click", () => openProductDialog());
$("#quick-add-product").addEventListener("click", () => openProductDialog());
$("#inventory-add-product").addEventListener("click", () => openProductDialog());

$("#close-product-dialog").addEventListener("click", closeProductDialog);
$("#cancel-product").addEventListener("click", closeProductDialog);

$("#product-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const id = $("#product-id").value;
    const sku = $("#product-sku").value.trim().toUpperCase();

    const existingSku = products.find((product) => {
        return product.sku.toUpperCase() === sku && product.id !== id;
    });

    if (existingSku) {
        showToast("This SKU already exists. Use a unique SKU.");
        return;
    }

    const product = {
        id: id || makeId("PRD"),
        name: $("#product-name").value.trim(),
        sku,
        category: $("#product-category").value.trim(),
        stock: Number($("#product-stock").value),
        lowStock: Number($("#product-low-stock").value),
        cost: Number($("#product-cost").value),
        price: Number($("#product-price").value),
        batch: $("#product-batch").value.trim(),
        expiry: $("#product-expiry").value
    };

    if (
        !product.name ||
        !product.sku ||
        !product.category ||
        !Number.isInteger(product.stock) ||
        !Number.isInteger(product.lowStock) ||
        product.stock < 0 ||
        product.lowStock < 0 ||
        !Number.isFinite(product.cost) ||
        !Number.isFinite(product.price) ||
        product.cost < 0 ||
        product.price < 0
    ) {
        showToast("Please enter valid product information.");
        return;
    }

    if (product.expiry && product.expiry < todayKey()) {
        if (!confirm("This expiry date is in the past. Save this product anyway?")) {
            return;
        }
    }

    const index = products.findIndex((item) => item.id === id);

    if (index >= 0) {
        products[index] = product;
        showToast("Product updated successfully.");
    } else {
        products.push(product);
        showToast("Product added successfully.");
    }

    persistProducts();
    closeProductDialog();
    renderAll();
});

$("#product-table-body").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");

    if (editButton) {
        const product = findProduct(editButton.dataset.editProduct);
        if (product) openProductDialog(product);
    }

    if (deleteButton) {
        const id = deleteButton.dataset.deleteProduct;
        const product = findProduct(id);

        if (!product) return;

        if (cart.some((item) => item.productId === id)) {
            showToast("Remove this product from the cart before deleting it.");
            return;
        }

        if (confirm(`Delete ${product.name} from inventory?`)) {
            products = products.filter((item) => item.id !== id);
            persistProducts();
            renderAll();
            showToast("Product deleted.");
        }
    }
});

/* ==========================================
   POS PRODUCT SELECTOR
   ========================================== */

function renderPOSProducts() {
    const search = $("#pos-search").value.toLowerCase().trim();

    const filtered = products.filter((product) => {
        return (
            product.name.toLowerCase().includes(search) ||
            product.sku.toLowerCase().includes(search)
        );
    });

    if (!filtered.length) {
        $("#pos-product-grid").innerHTML = `
            <div class="empty-state">No products found.</div>
        `;
        return;
    }

    $("#pos-product-grid").innerHTML = filtered.map((product) => {
        const disabled = product.stock <= 0;

        return `
            <button
                class="pos-product"
                type="button"
                data-add-cart="${escapeHTML(product.id)}"
                ${disabled ? "disabled" : ""}
            >
                <span class="product-symbol">▤</span>

                <strong>${escapeHTML(product.name)}</strong>

                <small>${escapeHTML(product.sku)} · ${product.stock} in stock</small>

                <span class="pos-price-row">
                    <strong>${money(product.price)}</strong>
                    <small>${disabled ? "Unavailable" : "Add +"}</small>
                </span>
            </button>
        `;
    }).join("");
}

$("#pos-search").addEventListener("input", renderPOSProducts);

$("#pos-product-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-cart]");

    if (!button) return;

    addToCart(button.dataset.addCart);
});

function addToCart(productId) {
    const product = findProduct(productId);

    if (!product || product.stock <= 0) {
        showToast("This product is out of stock.");
        return;
    }

    const item = cart.find((entry) => entry.productId === productId);
    const currentQuantity = item ? item.quantity : 0;

    if (currentQuantity >= product.stock) {
        showToast("You cannot add more than available stock.");
        return;
    }

    if (item) {
        item.quantity += 1;
    } else {
        cart.push({
            productId,
            quantity: 1
        });
    }

    persistCart();
    renderCart();
}

/* ==========================================
   SHOPPING CART
   ========================================== */

function renderCart() {
    cart = cart.filter((item) => {
        const product = findProduct(item.productId);

        if (!product || product.stock <= 0) return false;

        item.quantity = Math.min(
            Math.max(1, Math.floor(item.quantity)),
            product.stock
        );

        return true;
    });

    persistCart();

    const count = getCartQuantity();

    $("#cart-item-count").textContent =
        `${count} ${count === 1 ? "item" : "items"}`;

    if (!cart.length) {
        $("#cart-items").innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">▣</span>
                <strong>Your cart is empty</strong>
                <p>Select products to begin a sale.</p>
            </div>
        `;
    } else {
        $("#cart-items").innerHTML = cart.map((item) => {
            const product = findProduct(item.productId);

            if (!product) return "";

            return `
                <div class="cart-line">
                    <div class="cart-line-info">
                        <strong>${escapeHTML(product.name)}</strong>
                        <small>${money(product.price)} each</small>
                    </div>

                    <div class="cart-line-side">
                        <strong>${money(product.price * item.quantity)}</strong>

                        <div class="quantity-controls">
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                data-cart-action="decrease"
                                data-product-id="${escapeHTML(product.id)}"
                            >−</button>

                            <span>${item.quantity}</span>

                            <button
                                type="button"
                                aria-label="Increase quantity"
                                data-cart-action="increase"
                                data-product-id="${escapeHTML(product.id)}"
                            >+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    updateCartTotals();
}

$("#cart-items").addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");

    if (!button) return;

    const productId = button.dataset.productId;
    const action = button.dataset.cartAction;

    const item = cart.find((entry) => entry.productId === productId);
    const product = findProduct(productId);

    if (!item || !product) return;

    if (action === "increase") {
        if (item.quantity >= product.stock) {
            showToast("Maximum available stock reached.");
            return;
        }

        item.quantity += 1;
    }

    if (action === "decrease") {
        item.quantity -= 1;

        if (item.quantity <= 0) {
            cart = cart.filter((entry) => entry.productId !== productId);
        }
    }

    persistCart();
    renderCart();
});

$("#clear-cart").addEventListener("click", () => {
    if (!cart.length) return;

    cart = [];
    persistCart();
    renderCart();

    showToast("Cart cleared.");
});

/* ==========================================
   TAX AND CART TOTALS
   ========================================== */

function updateCartTotals() {
    const totals = getTotals();

    $("#cart-subtotal").textContent = money(totals.subtotal);
    $("#cart-tax").textContent = money(totals.tax);
    $("#cart-total").textContent = money(totals.total);

    $("#complete-sale").textContent =
        `Complete sale · ${money(totals.total)}`;

    updateCashChange();
}

$("#tax-rate").value = settings.taxRate;

$("#tax-rate").addEventListener("input", () => {
    const value = Number($("#tax-rate").value);

    if (!Number.isFinite(value)) return;

    settings.taxRate = Math.min(100, Math.max(0, value));
    persistSettings();

    updateCartTotals();
});

function updateCashChange() {
    const total = getTotals().total;
    const received = Number($("#cash-received").value) || 0;

    $("#cash-change").textContent = money(
        Math.max(0, received - total)
    );
}

$("#cash-received").addEventListener("input", updateCashChange);

/* ==========================================
   PAYMENT METHOD
   ========================================== */

function setPaymentMethod(method) {
    settings.paymentMethod = method;
    persistSettings();

    document.querySelectorAll(".payment-option").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.method === method
        );
    });

    $("#cash-fields").classList.toggle("hidden", method !== "cash");
    $("#mobile-fields").classList.toggle("hidden", method !== "mobile_money");
}

document.querySelectorAll(".payment-option").forEach((button) => {
    button.addEventListener("click", () => {
        setPaymentMethod(button.dataset.method);
    });
});

setPaymentMethod(settings.paymentMethod);

/* ==========================================
   MOCK MOBILE MONEY
   ========================================== */

function generateMockTransactionCode() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "RF";

    for (let i = 0; i < 8; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }

    return code;
}

/* ==========================================
   CHECKOUT
   ========================================== */

function validateCheckout() {
    if (!cart.length) {
        showToast("Your cart is empty.");
        return false;
    }

    for (const item of cart) {
        const product = findProduct(item.productId);

        if (!product || product.stock < item.quantity) {
            showToast("Stock changed. Please review your cart.");
            renderAll();
            return false;
        }

        const expiry = getExpiryStatus(product);

        if (expiry?.type === "expired") {
            showToast(`${product.name} has expired and cannot be sold.`);
            return false;
        }
    }

    const totals = getTotals();

    if (totals.total <= 0) {
        showToast("The transaction total must be greater than zero.");
        return false;
    }

    if (settings.paymentMethod === "cash") {
        const received = Number($("#cash-received").value);

        if (!Number.isFinite(received) || received < totals.total) {
            showToast("Cash received must cover the total payable.");
            return false;
        }
    }

    if (settings.paymentMethod === "mobile_money") {
        const phone = $("#mobile-phone").value.trim();

        if (!/^(?:\+?254|0)?[17]\d{8}$/.test(phone)) {
            showToast("Enter a valid Kenyan mobile number.");
            return false;
        }
    }

    return true;
}

function completeSale() {
    if (!validateCheckout()) return;

    const totals = getTotals();

    const items = cart.map((item) => {
        const product = findProduct(item.productId);

        return {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice: product.price,
            unitCost: product.cost,
            lineSubtotal: product.price * item.quantity,
            lineCost: product.cost * item.quantity
        };
    });

    const cogs = items.reduce(
        (total, item) => total + item.lineCost,
        0
    );

    const paymentMethod = settings.paymentMethod;

    let paymentReference;
    let paymentStatus;
    let cashReceived = null;
    let change = null;
    let customerPhone = null;

    if (paymentMethod === "cash") {
        cashReceived = Number($("#cash-received").value);
        change = cashReceived - totals.total;
        paymentReference = makeId("CASH");
        paymentStatus = "Paid";
    } else {
        customerPhone = $("#mobile-phone").value.trim();
        paymentReference = generateMockTransactionCode();
        paymentStatus = "Simulated success";
    }

    const sale = {
        id: makeId("SALE"),
        date: new Date().toISOString(),
        items,
        subtotal: totals.subtotal,
        taxRate: totals.rate,
        tax: totals.tax,
        total: totals.total,
        cogs,
        grossProfit: totals.subtotal - cogs,
        paymentMethod,
        paymentReference,
        paymentStatus,
        cashReceived,
        change,
        customerPhone
    };

    // Deduct stock only after all validation succeeds.
    items.forEach((item) => {
        const product = findProduct(item.productId);
        product.stock -= item.quantity;
    });

    sales.unshift(sale);

    cart = [];

    persistProducts();
    persistSales();
    persistCart();

    $("#cash-received").value = "";
    $("#mobile-phone").value = "";

    selectedReceipt = sale;

    renderAll();
    openReceipt(sale);

    showToast(
        paymentMethod === "mobile_money"
            ? "Mock mobile money payment successful."
            : "Sale completed successfully."
    );
}

$("#complete-sale").addEventListener("click", completeSale);

/* ==========================================
   SALES HISTORY
   ========================================== */

function renderSales() {
    const search = $("#sales-search").value.toLowerCase().trim();
    const filter = $("#sales-filter").value;

    const filtered = sales.filter((sale) => {
        const matchesSearch = [
            sale.id,
            sale.paymentReference,
            sale.paymentMethod,
            sale.paymentStatus
        ].some((value) => String(value || "").toLowerCase().includes(search));

        const matchesMethod =
            filter === "all" || sale.paymentMethod === filter;

        return matchesSearch && matchesMethod;
    });

    $("#sales-count").textContent = `${sales.length} transactions`;

    if (!filtered.length) {
        $("#sales-table-body").innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">No sales found.</div>
                </td>
            </tr>
        `;
        return;
    }

    $("#sales-table-body").innerHTML = filtered.map((sale) => {
        const quantity = sale.items.reduce(
            (total, item) => total + item.quantity,
            0
        );

        return `
            <tr>
                <td>
                    <strong>${escapeHTML(sale.id)}</strong>
                </td>

                <td>${escapeHTML(dateTime(sale.date))}</td>

                <td>${quantity}</td>

                <td>
                    <span class="status success">
                        ${sale.paymentMethod === "cash" ? "Cash" : "Mobile Money"}
                    </span>
                </td>

                <td>${escapeHTML(sale.paymentReference)}</td>

                <td><strong>${money(sale.subtotal)}</strong></td>

                <td>${money(sale.grossProfit)}</td>

                <td>
                    <button
                        class="table-action"
                        data-view-receipt="${escapeHTML(sale.id)}"
                    >View receipt</button>
                </td>
            </tr>
        `;
    }).join("");
}

$("#sales-search").addEventListener("input", renderSales);
$("#sales-filter").addEventListener("change", renderSales);

$("#sales-table-body").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view-receipt]");

    if (!button) return;

    const sale = sales.find((item) => item.id === button.dataset.viewReceipt);

    if (sale) openReceipt(sale);
});

/* ==========================================
   RECEIPT
   ========================================== */

function openReceipt(sale) {
    selectedReceipt = sale;

    const itemRows = sale.items.map((item) => `
        <tr>
            <td>
                ${escapeHTML(item.name)}
                <br>
                <small>${item.quantity} × ${money(item.unitPrice)}</small>
            </td>

            <td>${money(item.lineSubtotal)}</td>
        </tr>
    `).join("");

    $("#receipt-content").innerHTML = `
        <div class="receipt-header">
            <h2>RETAILFLOW</h2>
            <p>RETAIL POINT OF SALE</p>
            <p>Customer sales receipt</p>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-meta">
            <span>Transaction</span>
            <strong>${escapeHTML(sale.id)}</strong>
        </div>

        <div class="receipt-meta">
            <span>Date</span>
            <strong>${escapeHTML(dateTime(sale.date))}</strong>
        </div>

        <div class="receipt-meta">
            <span>Payment method</span>
            <strong>${sale.paymentMethod === "cash" ? "Cash" : "Mobile Money"}</strong>
        </div>

        <div class="receipt-meta">
            <span>Reference</span>
            <strong>${escapeHTML(sale.paymentReference)}</strong>
        </div>

        ${sale.customerPhone ? `
            <div class="receipt-meta">
                <span>Customer phone</span>
                <strong>${escapeHTML(sale.customerPhone)}</strong>
            </div>
        ` : ""}

        <div class="receipt-divider"></div>

        <table class="receipt-items">
            <thead>
                <tr>
                    <th>ITEM</th>
                    <th>AMOUNT</th>
                </tr>
            </thead>

            <tbody>
                ${itemRows}
            </tbody>
        </table>

        <div class="receipt-divider"></div>

        <div class="receipt-total-row">
            <span>Subtotal</span>
            <strong>${money(sale.subtotal)}</strong>
        </div>

        <div class="receipt-total-row">
            <span>Tax (${sale.taxRate}%)</span>
            <strong>${money(sale.tax)}</strong>
        </div>

        <div class="receipt-total-row receipt-grand-total">
            <span>TOTAL PAID</span>
            <strong>${money(sale.total)}</strong>
        </div>

        ${sale.paymentMethod === "cash" ? `
            <div class="receipt-total-row">
                <span>Cash received</span>
                <strong>${money(sale.cashReceived)}</strong>
            </div>

            <div class="receipt-total-row">
                <span>Change</span>
                <strong>${money(sale.change)}</strong>
            </div>
        ` : `
            <div class="receipt-total-row">
                <span>Payment status</span>
                <strong>SIMULATED SUCCESS</strong>
            </div>
        `}

        <div class="receipt-divider"></div>

        <div class="receipt-thanks">
            <strong>Thank you for shopping with us!</strong>
            <p>Keep this receipt for your records.</p>
            <p>RetailFlow POS · Local transaction</p>
        </div>
    `;

    $("#receipt-dialog").showModal();
}

$("#close-receipt").addEventListener("click", () => {
    $("#receipt-dialog").close();
});

$("#print-receipt").addEventListener("click", () => {
    if (!selectedReceipt) return;
    window.print();
});

/* ==========================================
   CSV EXPORT
   ========================================== */

function downloadCSV(filename, rows) {
    const csv = rows.map((row) =>
        row.map((value) => {
            const safeValue = String(value ?? "").replace(/"/g, '""');
            return `"${safeValue}"`;
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
}

$("#export-sales").addEventListener("click", () => {
    if (!sales.length) {
        showToast("There are no sales to export.");
        return;
    }

    const rows = [
        [
            "Transaction ID",
            "Date",
            "Items",
            "Subtotal",
            "Tax",
            "Total",
            "COGS",
            "Gross Profit",
            "Payment Method",
            "Reference",
            "Status"
        ]
    ];

    sales.forEach((sale) => {
        rows.push([
            sale.id,
            sale.date,
            sale.items.map((item) => `${item.name} x${item.quantity}`).join("; "),
            sale.subtotal,
            sale.tax,
            sale.total,
            sale.cogs,
            sale.grossProfit,
            sale.paymentMethod,
            sale.paymentReference,
            sale.paymentStatus
        ]);
    });

    downloadCSV(`retailflow-sales-${todayKey()}.csv`, rows);

    showToast("Sales CSV exported.");
});

/* ==========================================
   INITIALIZATION
   ========================================== */

function renderAll() {
    renderCategoryFilter();
    renderInventory();
    renderPOSProducts();
    renderCart();
    renderDashboard();
    renderSales();
}

function initializeApp() {
    $("#current-date").textContent = new Date().toLocaleDateString("en-KE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    renderAll();

    console.log("RetailFlow POS initialized successfully.");
}

initializeApp();

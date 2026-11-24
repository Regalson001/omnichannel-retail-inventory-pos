A lightweight, responsive omnichannel retail point-of-sale and inventory management application built using HTML5, CSS3, and vanilla JavaScript.

RetailFlow provides a simple browser-based retail management experience with product inventory, live checkout, simulated mobile money payments, printable receipts, sales history, and daily business performance analytics.

## Features

### 1. Product & Inventory Management
- Add, edit, and delete products.
- Track product SKU and category.
- Manage available stock quantities.
- Record cost and selling prices.
- Configure individual low-stock thresholds.
- Track product batch numbers and expiry dates.
- Receive low-stock and expiry alerts.
- Search and filter inventory.

### 2. Point of Sale
- Browse available products.
- Search products by name or SKU.
- Add products to the shopping cart.
- Increase and decrease cart quantities.
- Automatically calculate subtotal.
- Configure the tax rate.
- Calculate tax and total payable.
- Accept simulated cash payments.
- Calculate cash change.
- Simulate mobile money payments.
- Generate mock payment transaction references.

### 3. Receipts
- Generate transaction receipts.
- View previous receipts.
- Print customer receipts.
- Display payment references and transaction details.

### 4. Sales & Analytics
- Automatically deduct inventory after checkout.
- Maintain sales transaction history.
- Track daily revenue.
- Calculate cost of goods sold (COGS).
- Calculate gross profit.
- Track completed transactions.
- Export sales history to CSV.

### 5. Offline Persistence
- Save inventory in LocalStorage.
- Save sales records in LocalStorage.
- Save the shopping cart.
- Persist tax and payment preferences.
- Restore saved information after page reloads.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive layouts |
| JavaScript ES6+ | Application logic |
| LocalStorage | Browser-based persistence |
| Blob API | CSV export |
| Window Print API | Printable receipts |

## Project Structure

```text
omnichannel-retail-inventory-pos/
│
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Regalson001/omnichannel-retail-inventory-pos.git
```

### 2. Open the project

```bash
cd omnichannel-retail-inventory-pos
```

### 3. Run the application

Open `index.html` directly in your browser.

Alternatively, use the VS Code Live Server extension.

No installation, backend, build process, or package manager is required.

## Default Configuration

- Currency: KES
- Default tax rate: 16%
- Storage: Browser LocalStorage
- Sample products: Included
- Payment methods: Cash and simulated Mobile Money

The tax rate can be changed directly in the checkout panel.

## Important Payment Notice

Mobile Money is simulated for demonstration and portfolio purposes.

The application does not:
- Connect to Safaricom M-Pesa.
- Send STK Push requests.
- Process real payments.
- Verify payment confirmations.
- Communicate with a payment gateway.

The generated mobile money transaction references are mock references.

## Storage & Data Limitations

This is a frontend-only demonstration application.

Inventory, cart, settings, and sales are saved in the browser's LocalStorage.

Consequently:
- Data is specific to the browser and device.
- Clearing browser data may erase records.
- Data is not synchronized across devices.
- There is no multi-user authentication.
- LocalStorage is not suitable for sensitive production financial records.

A production deployment would require a secure backend, database, user authentication, payment integration, and server-side transaction validation.

## Financial Calculations

- Subtotal = Sum of product selling prices × quantities.
- Tax = Subtotal × configured tax rate.
- Total = Subtotal + Tax.
- COGS = Sum of product cost prices × quantities.
- Gross Profit = Subtotal − COGS.

Gross profit excludes operating expenses and other business costs.

## License

This project is available under the MIT License.

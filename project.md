What's inside
LayerFilesEntry pointapp.js — Express + session store + auto-seed adminModels9 Sequelize models (User, Product, Vendor, ProductVendor, Order, OrderDetail, Shipment, ShipmentItem, Notification) with all associationsControllersauth, dashboard, products, vendors, orders, settingsRoutes6 route files, all protected by JWT middlewareViews20 EJS views — login, dashboard, products (CRUD), vendors (CRUD), orders (6 tabs), settings, errorMiddlewareJWT auth, role guards, Multer upload, error handlerUtilsSVG box label generator, Excel export (role-filtered), notification helperDeploymentPM2 ecosystem.config.js, Nginx instructions, Hostinger .htaccess

First-time setup (3 commands)
bash# 1. Install & configure
npm install
cp .env.example .env    # then fill in DB_PASS, JWT_SECRET, SESSION_SECRET

# 2. Create DB in MySQL, then:
npm run migrate         # creates all 9 tables + session table

# 3. Start
npm start               # or: pm2 start ecosystem.config.js
Admin login: ad9min / Sameerl42$
# Wholesaledock — Procurement Order Management System

A production-ready Node.js web application for managing procurement orders, vendors, products, and shipments.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL + Sequelize ORM |
| Frontend | EJS + Bootstrap 5 + Vanilla JS |
| Auth | JWT (httpOnly cookie) + express-session + MySQL session store |
| File Uploads | Multer |
| Excel Export | ExcelJS |
| Deployment | PM2 (VPS) or Passenger (Shared Hosting) |

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 16
- MySQL 5.7+ or 8.x

### 2. Clone & Install
```bash
git clone <your-repo-url> wholesaledock
cd wholesaledock
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=wholesaledock
DB_USER=root
DB_PASS=your_mysql_password

JWT_SECRET=change_this_to_a_long_random_string_min_32_chars
SESSION_SECRET=another_long_random_string_for_sessions
```

### 4. Create Database
```sql
CREATE DATABASE wholesaledock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Migrations & Seed
```bash
npm run migrate   # creates all tables
npm run seed      # creates admin user
```

### 6. Start Development Server
```bash
npm run dev       # uses nodemon for auto-reload
```

Visit: `http://localhost:3000`

**Default Admin Login:**
- Username: `ad9min`
- Password: `Sameerl42$`

---

## Deployment on Hostinger VPS

### 1. Server Setup
```bash
# Install Node.js (via NVM recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Install PM2 globally
npm install -g pm2

# Install MySQL
sudo apt update && sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### 2. Upload Application
```bash
# On your local machine:
scp -r wholesaledock/ user@your-vps-ip:/var/www/

# Or use Git:
ssh user@your-vps-ip
git clone <your-repo-url> /var/www/wholesaledock
```

### 3. Configure on Server
```bash
cd /var/www/wholesaledock
npm install --production
cp .env.example .env
nano .env   # fill in production values
```

### 4. Create MySQL Database
```bash
mysql -u root -p
```
```sql
CREATE DATABASE wholesaledock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wsd_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON wholesaledock.* TO 'wsd_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Create Logs Directory & Run Migrations
```bash
mkdir -p /var/www/wholesaledock/logs
npm run migrate
npm run seed
```

### 6. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the output command to enable auto-start on reboot
```

### 7. Nginx Reverse Proxy (Recommended)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
    }

    location /uploads/ {
        alias /var/www/wholesaledock/uploads/;
        expires 30d;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wholesaledock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Deployment on Hostinger Shared Hosting

> Requires Hostinger Business or Cloud plan with Node.js support.

1. Upload all files to `public_html/` via File Manager or FTP
2. Create MySQL database in Hostinger hPanel
3. Set environment variables in hPanel → Node.js → Environment Variables
4. The `.htaccess` file enables Passenger routing
5. Click "Restart" in hPanel Node.js section

---

## User Roles

| Feature | Admin | Agent | Sales |
|---------|-------|-------|-------|
| RFQ Tab | ✅ View + Confirm/Cancel | ❌ Hidden | ✅ View only |
| To Order Tab | ✅ Full | ✅ Own orders | ✅ Limited columns |
| Vendor info | ✅ | ✅ | ❌ Hidden |
| Transfer/CBM Rate | ✅ Edit | ❌ Hidden | ❌ Hidden |
| Close Shipment | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Vendors Module | ✅ | ✅ | ❌ Hidden |

---

## Folder Structure

```
wholesaledock/
├── app.js                  # Entry point
├── ecosystem.config.js     # PM2 config
├── .env.example            # Environment template
├── config/
│   └── database.js         # Sequelize config
├── controllers/            # Route handlers
│   ├── authController.js
│   ├── dashboardController.js
│   ├── productController.js
│   ├── vendorController.js
│   ├── orderController.js
│   └── settingsController.js
├── middleware/
│   ├── auth.js             # JWT + role guards
│   ├── upload.js           # Multer config
│   └── error.js            # Error handler
├── migrations/
│   ├── run.js              # Run migrations
│   └── seed.js             # Seed admin user
├── models/                 # Sequelize models
│   ├── index.js            # Associations
│   ├── User.js
│   ├── Product.js
│   ├── Vendor.js
│   ├── ProductVendor.js
│   ├── Order.js
│   ├── OrderDetail.js
│   ├── Shipment.js
│   ├── ShipmentItem.js
│   └── Notification.js
├── public/
│   ├── css/app.css
│   └── js/app.js
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   ├── products.js
│   ├── vendors.js
│   ├── orders.js
│   └── settings.js
├── uploads/                # User-uploaded files (gitignored)
└── views/
    ├── auth/               # login, profile
    ├── dashboard.ejs
    ├── error.ejs
    ├── orders/
    │   ├── index.ejs
    │   └── partials/       # tab fragments
    ├── partials/           # header, footer, modals
    ├── products/           # index, show, create, edit
    ├── settings/           # index
    └── vendors/            # index, show, create, edit
```

---

## NPM Scripts

```bash
npm start           # Production start
npm run dev         # Development (nodemon)
npm run migrate     # Sync DB schema
npm run seed        # Create admin user
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `wholesaledock` |
| `DB_USER` | DB username | `root` |
| `DB_PASS` | DB password | `secret` |
| `JWT_SECRET` | JWT signing secret | `32+ char string` |
| `SESSION_SECRET` | Session secret | `32+ char string` |

---

## Security Notes

- All passwords are bcrypt hashed (cost factor 12)
- JWT stored in httpOnly, SameSite=Lax cookie — not localStorage
- Session persists in MySQL — survives server restarts
- All routes protected by `authenticate` middleware
- Role middleware enforced at route level
- File uploads validated by extension whitelist
- Input sanitized before DB operations
- Production: set `NODE_ENV=production` to enable secure cookies

---

## Updating

```bash
cd /var/www/wholesaledock
git pull
npm install
npm run migrate   # safe to run again — uses alter:true
pm2 restart wholesaledock
```

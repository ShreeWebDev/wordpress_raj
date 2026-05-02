
WHOLESALEDOCK
Procurement Order Management System

DEPLOYMENT GUIDE
MySQL Database Schema  ·  Hostinger Shared Hosting  ·  cPanel Setup

Detail	Value
Document Version	v1.0
Application	Wholesaledock v1.0
Server	Hostinger Shared Hosting
Control Panel	cPanel / hPanel
Database	MySQL 8.x
Runtime	Node.js 18+ (via Passenger)
Prepared For	Internal Deployment Team
 
1. System Overview
Wholesaledock is a full-stack Procurement Order Management System built on Node.js + Express with a MySQL backend and EJS-templated frontend. It manages the complete procurement cycle from RFQ through to shipment close, with role-based access for Admin, Agent, and Sales users.
Component	Technology	Version
Web Framework	Express.js	4.18+
ORM	Sequelize	6.35+
Database	MySQL	8.x
Template Engine	EJS	3.1+
Authentication	JWT + express-session + MySQL store	—
File Uploads	Multer	1.4+
Excel Export	ExcelJS	4.3+
CSS Framework	Bootstrap 5	5.3+
Hosting	Hostinger Shared (Passenger)	—

1.1 User Roles
Role	RFQ	To Order / Receive	Loaded / Closed	Vendors	Rates	Settings
Admin	View + Confirm + Cancel	Full access	Full + Close	Full CRUD	Edit	Full CRUD
Agent	Hidden	Own orders only	Own shipments	View + Create	Hidden	No access
Sales	View only (no action)	View (limited cols)	View (limited cols)	Hidden	Hidden	No access
 
2. MySQL Database Schema
All tables are created automatically by Sequelize ORM on first run. The schema below is the authoritative reference for the database structure.
Database Charset: utf8mb4   Collation: utf8mb4_unicode_ci
Engine: InnoDB   Timestamps: createdAt, updatedAt (auto-managed by Sequelize)

2.1 Create Database (Run Once)
-- Run in Hostinger cPanel > phpMyAdmin > SQL tab
CREATE DATABASE wholesaledock
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'wsd_user'@'localhost'
  IDENTIFIED BY 'YourStrongPassword123!';

GRANT ALL PRIVILEGES ON wholesaledock.*
  TO 'wsd_user'@'localhost';

FLUSH PRIVILEGES;

2.2 Table: users
users
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
name	VARCHAR(100)	NOT NULL	Full name
contact_no	VARCHAR(50)	NOT NULL, UNIQUE	Login username
password	VARCHAR(255)	NOT NULL	bcrypt hash (cost=12)
role	ENUM	NOT NULL, DEFAULT sales	'admin','agent','sales'
is_active	TINYINT(1)	DEFAULT 1	Soft delete flag
createdAt	DATETIME	NOT NULL	Auto by Sequelize
updatedAt	DATETIME	NOT NULL	Auto by Sequelize

2.3 Table: products
products
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
name	VARCHAR(255)	NOT NULL	Product display name
sku	VARCHAR(100)	NOT NULL, UNIQUE	Stock Keeping Unit code
image_path	VARCHAR(500)	NULL	/uploads/filename.jpg
box_label_image_path	VARCHAR(500)	NULL	Auto-generated SVG label
is_active	TINYINT(1)	DEFAULT 1	Toggle product visibility
createdAt	DATETIME	NOT NULL	Auto by Sequelize
updatedAt	DATETIME	NOT NULL	Auto by Sequelize

2.4 Table: vendors
vendors
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
name	VARCHAR(255)	NOT NULL	Supplier name
contact_no	VARCHAR(50)	NULL	Phone / WeChat ID
address	TEXT	NULL	Supplier address
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	
 
2.5 Table: product_vendors
Junction table linking products to vendors with pricing and carton dimensions.
product_vendors
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
product_id	INT UNSIGNED	NOT NULL, FK→products	Foreign key
vendor_id	INT UNSIGNED	NOT NULL, FK→vendors	Foreign key
product_link	VARCHAR(1000)	NULL	1688 / Alibaba URL
rate_rmb	DECIMAL(10,2)	NULL	Unit price in RMB ¥
ctn_l	DECIMAL(10,2)	NULL	Carton length (cm)
ctn_b	DECIMAL(10,2)	NULL	Carton breadth (cm)
ctn_h	DECIMAL(10,2)	NULL	Carton height (cm)
ctn_cbm	DECIMAL(10,4)	NULL	Auto: L/100 * B/100 * H/100
ctn_qty	INT	NULL	Units per carton
ctn_weight	DECIMAL(10,2)	NULL	Gross weight per carton (kg)
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	

2.6 Table: orders
orders
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
product_id	INT UNSIGNED	NOT NULL, FK→products	Foreign key
qty	INT	NOT NULL, DEFAULT 0	Order quantity
status	ENUM	NOT NULL, DEFAULT rfq	rfq | to_order | ordered | recd_china | loaded | closed
agent_id	INT UNSIGNED	NULL, FK→users	Assigned agent
created_by	INT UNSIGNED	NOT NULL, FK→users	User who raised RFQ
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	

2.7 Table: order_details
order_details
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
order_id	INT UNSIGNED	NOT NULL, FK→orders	One-to-one with orders
vendor_id	INT UNSIGNED	NULL, FK→vendors	Selected vendor
product_link	VARCHAR(1000)	NULL	May differ from product_vendors
rate_rmb	DECIMAL(10,2)	NULL	Agreed rate for this order
ctn_qty	INT	NULL	
ctn_l	DECIMAL(10,2)	NULL	
ctn_b	DECIMAL(10,2)	NULL	
ctn_h	DECIMAL(10,2)	NULL	
ctn_cbm	DECIMAL(10,4)	NULL	Auto-calculated on save
ctn_weight	DECIMAL(10,2)	NULL	
comments	JSON	DEFAULT []	Thread: [{user_id,user_name,role,message,timestamp}]
attachments	JSON	DEFAULT []	Array: [{filename,path,uploaded_by,uploaded_at}]
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	
 
2.8 Table: shipments
shipments
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
container_no	VARCHAR(100)	NOT NULL	e.g. MSCU1234567
etd	DATE	NULL	Estimated Time of Departure
eta	DATE	NULL	Estimated Time of Arrival
agent_id	INT UNSIGNED	NULL, FK→users	Responsible agent
transfer_rate	DECIMAL(10,4)	NULL	RMB→INR rate (admin only)
cbm_rate	DECIMAL(10,4)	NULL	INR per CBM (admin only)
status	ENUM	DEFAULT loaded	'loaded' | 'closed'
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	

2.9 Table: shipment_items
shipment_items
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
shipment_id	INT UNSIGNED	NOT NULL, FK→shipments	Foreign key
order_id	INT UNSIGNED	NOT NULL, FK→orders	Foreign key
no_of_ctns	INT	NULL	Number of cartons loaded
total_qty	INT	NULL	Total units shipped
total_cbm	DECIMAL(10,4)	NULL	no_of_ctns × ctn_cbm
total_weight	DECIMAL(10,2)	NULL	no_of_ctns × ctn_weight (kg)
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	

2.10 Table: notifications
notifications
Column	Type	Constraints	Notes
id	INT UNSIGNED	PK, AUTO_INCREMENT	Primary key
user_id	INT UNSIGNED	NOT NULL, FK→users	Recipient user
message	VARCHAR(500)	NOT NULL	Notification text
is_read	TINYINT(1)	DEFAULT 0	0 = unread, 1 = read
link	VARCHAR(500)	NULL	e.g. /orders?tab=2
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	

2.11 Table: Sessions (Auto-Created)
The Sessions table is created automatically by connect-session-sequelize on first run. Do not create this manually.
Sessions
Column	Type	Constraints	Notes
sid	VARCHAR(36)	PK	Session ID
expires	DATETIME	NULL	Session expiry
data	TEXT	NULL	Serialised session data
createdAt	DATETIME	NOT NULL	
updatedAt	DATETIME	NOT NULL	
 
3. Entity Relationship Summary
The diagram below shows the foreign-key relationships between all tables.
users
  ├── orders.agent_id ─────────────────────── (agent)
  ├── orders.created_by ──────────────────── (creator)
  ├── shipments.agent_id
  └── notifications.user_id
products
  ├── product_vendors.product_id  ──┐
  └── orders.product_id            └── (many-to-many via product_vendors)
vendors
  ├── product_vendors.vendor_id
  └── order_details.vendor_id
orders
  ├── order_details.order_id  (one-to-one)
  └── shipment_items.order_id
shipments
  └── shipment_items.shipment_id  (one-to-many)
 
4. Hostinger cPanel Deployment — Step by Step
⚠  Prerequisites
•	Hostinger Business or Cloud plan (Node.js support required)
•	Node.js 18+ enabled in hPanel
•	MySQL database created (see Section 4.2)
•	Domain pointed to hosting, SSL active

4.1 Upload Application Files
1.	Log in to Hostinger hPanel → Files → File Manager
2.	Navigate to public_html/ (or your domain's root folder)
3.	Click Upload → upload wholesaledock.zip
4.	Right-click the zip → Extract Here
5.	After extraction, all files should be directly inside public_html/ (not in a subfolder)

Folder structure after upload:
public_html/
  ├── app.js
  ├── package.json
  ├── .htaccess
  ├── views/   controllers/   models/   routes/   ...

4.2 Create MySQL Database in cPanel
6.	In hPanel → go to Databases → MySQL Databases
7.	Under "Create New Database" — enter name: wholesaledock → click Create Database
8.	Under "MySQL Users" → create user: wsd_user with a strong password → click Create User
9.	Under "Add User to Database" → select wsd_user + wholesaledock → click Add → grant ALL PRIVILEGES
10.	Note down: Database name, Username, Password (you will need these for .env)

4.3 Configure Environment Variables (.env)
11.	In File Manager, open public_html/.env.example → rename to .env
12.	Edit .env and fill in all values:

PORT=3000
NODE_ENV=production

# ── Database ──────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=yourhosting_wholesaledock
DB_USER=yourhosting_wsd_user
DB_PASS=YourStrongDatabasePassword123!

# ── Security ──────────────────────────────────
# Generate: node -e "console.log(require('crypto')
#   .randomBytes(48).toString('hex'))"
JWT_SECRET=paste_64_char_random_hex_here
SESSION_SECRET=paste_different_64_char_hex_here

# ── App ───────────────────────────────────────
APP_URL=https://yourdomain.com

NEVER commit .env to Git. It contains database credentials and JWT secrets.

4.4 Configure Node.js Application in hPanel
13.	hPanel → Website → Node.js
14.	Click "Create Application"

Field	Value
Node.js version	18.x (or highest available)
Application mode	Production
Application root	public_html
Application URL	yourdomain.com
Application startup file	app.js

15.	Click "Create"
16.	After creation, click "Open Terminal" (or use SSH)
17.	In the terminal, run:

cd ~/public_html

# Install dependencies
npm install --production

# Run database migrations (creates all tables)
npm run migrate

# Seed the admin user
npm run seed

18.	Go back to hPanel → Node.js → click "Restart"
19.	Visit your domain — you should see the Wholesaledock login page

4.5 Configure .htaccess for Passenger
The .htaccess file in public_html must contain Passenger directives. Update the paths to match your actual hosting username:
PassengerNodejs /usr/bin/node
PassengerAppRoot /home/u123456789/public_html
PassengerAppType node
PassengerStartupFile app.js

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ - [L]
</IfModule>

Finding your username: hPanel → File Manager → the path shown is /home/USERNAME/public_html
 
5. File & Directory Permissions
Path	Permission	Reason
public_html/	755	Web server must read
public_html/uploads/	755	Node.js writes uploaded files here
public_html/.env	600	Sensitive — owner read only
public_html/app.js	644	Standard file
public_html/public/	755	Static assets served by web server
public_html/logs/	755	Node.js writes log files

5.1 Set Permissions via Terminal
cd ~/public_html

# Uploads directory — Node.js needs write access
chmod 755 uploads/
mkdir -p uploads/labels

# Protect .env
chmod 600 .env

# Logs directory
mkdir -p logs
chmod 755 logs/
 
6. First Login & Post-Deploy Verification
6.1 Default Admin Credentials
Username: ad9min
Password: Sameerl42$
⚠  Change the admin password immediately after first login via the profile menu.

6.2 Verification Checklist
#	Check	Expected Result
1	Visit https://yourdomain.com	Login page loads (no error)
2	Login with ad9min / Sameerl42$	Dashboard loads, shows user name
3	Refresh browser (F5)	Session persists — still logged in
4	Navigate to Products → Add Product	Form loads correctly
5	Upload a product image	Image saves and displays on product card
6	Create an RFQ from product page	Order appears in Orders → RFQ tab
7	Open Settings, create an Agent user	User created, appears in list
8	Login as agent in another browser	Agent only sees own orders
9	Logout and login again	Redirected to login, then dashboard
10	Navigate to Orders → Tab 5, click Export	Excel file downloads
 
7. Troubleshooting
7.1 Common Issues
Symptom	Likely Cause	Fix
500 Internal Server Error on load	DB credentials wrong in .env	Check DB_HOST, DB_NAME, DB_USER, DB_PASS in .env
Login page loops / no redirect	JWT_SECRET or SESSION_SECRET missing	Ensure both are set in .env with 32+ char values
Refreshing logs user out	Session store not connecting	Run npm run migrate — creates Sessions table
Image uploads not showing	uploads/ directory missing or wrong permissions	mkdir -p uploads && chmod 755 uploads
Node.js app not starting	.htaccess path wrong	Update PassengerAppRoot to your actual /home/USERNAME/public_html
Cannot find module error	node_modules not installed	Run: npm install --production in public_html terminal
DB connection refused	DB_HOST should be localhost on shared hosting	Set DB_HOST=localhost (not 127.0.0.1)
Excel export downloads empty file	No shipment items in DB	Normal if shipments have no items — add orders first

7.2 View Application Logs
# Via hPanel → Node.js → View Logs
# Or via terminal:
tail -f ~/public_html/logs/combined.log
tail -f ~/public_html/logs/err.log

7.3 Restart Application
# Option 1: hPanel → Node.js → Restart button

# Option 2: via SSH terminal
touch ~/public_html/tmp/restart.txt

# Option 3: If on VPS with PM2
pm2 restart wholesaledock
 
8. Maintenance & Updates
8.1 Updating the Application
20.	Upload the new wholesaledock.zip via File Manager
21.	Extract and overwrite all files (keep your .env — do not overwrite it)
22.	Open hPanel Terminal and run:
cd ~/public_html
npm install --production
npm run migrate    # safe to re-run — adds new columns only
23.	Go to hPanel → Node.js → Restart

8.2 Database Backup
# hPanel → Databases → phpMyAdmin → Select wholesaledock
# Click Export → Quick → Format: SQL → Go
# Save the .sql file safely

# To restore: phpMyAdmin → Import → select .sql file

8.3 Managing Uploaded Files
Uploaded product images and order attachments are stored in public_html/uploads/. Back this up regularly via hPanel File Manager → compress uploads/ → download zip.
 
9. Environment Variable Reference
Variable	Required	Example Value	Description
PORT	No	3000	Server port (Passenger ignores this)
NODE_ENV	Yes	production	Enables secure cookies & disables verbose logs
DB_HOST	Yes	localhost	Always localhost on shared hosting
DB_PORT	No	3306	Default MySQL port
DB_NAME	Yes	u123_wholesaledock	Full DB name from hPanel
DB_USER	Yes	u123_wsd_user	Full DB username from hPanel
DB_PASS	Yes	StrongPass123!	DB user password
JWT_SECRET	Yes	64-char random hex	Signs authentication tokens — keep secret
SESSION_SECRET	Yes	64-char random hex	Signs session cookies — keep secret
APP_URL	No	https://yourdomain.com	Used in email links (future)

9.1 Generate Secure Secrets
# Run in hPanel Terminal or any Node.js environment:
node -e "const c=require('crypto');
  console.log('JWT_SECRET='+c.randomBytes(48).toString('hex'));
  console.log('SESSION_SECRET='+c.randomBytes(48).toString('hex'));"
 
10. Security Checklist
#	Security Item	Status
1	Change default admin password after first login	☐ TODO
2	.env file has 600 permissions (owner read only)	☐ TODO
3	JWT_SECRET is 48+ random bytes (not a simple word)	☐ TODO
4	SESSION_SECRET is 48+ random bytes (different from JWT)	☐ TODO
5	NODE_ENV=production (enables secure cookies)	☐ TODO
6	SSL certificate active on domain (HTTPS)	☐ TODO
7	Database user has only GRANT on wholesaledock.* (not ALL)	☐ TODO
8	uploads/ is not directly web-browsable (not in public/)	✓ Built-in
9	Passwords stored as bcrypt hash (cost=12)	✓ Built-in
10	JWT stored in httpOnly cookie (not localStorage)	✓ Built-in
11	All routes protected by authenticate middleware	✓ Built-in
12	Role checks on every sensitive controller action	✓ Built-in

Wholesaledock Deployment Guide — v1.0
This document is confidential and intended for the deployment team only. Keep credentials stored in a password manager.


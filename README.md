# OTP Virtual Number Service

Fullstack web application untuk layanan virtual number dan OTP (One-Time Password) seperti rumahotp.io dan nokosmurah.com.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 5.7+
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Payment Gateway**: Tripay, QRISPY
- **OTP Providers**: 5Sim, Hero SMS, Nokosmurah

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API / Redux
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

## Features

### User Features
✅ Register & Login dengan JWT Auth
✅ Dashboard dengan statistik saldo, order, deposit
✅ Deposit saldo via QRIS (Tripay/QRISPY)
✅ Order OTP dari berbagai negara & layanan
✅ Real-time OTP notification via Socket.IO
✅ Riwayat order & transaksi lengkap
✅ API Reseller dengan API Key
✅ Affiliate/Referral system
✅ Dark mode & Multi-language (ID/EN)

### Admin Features
✅ Dashboard statistik (user, deposit, order, profit)
✅ CRUD Management User
✅ CRUD Management OTP Services & Pricing
✅ Manual adjustment user balance
✅ Website settings management
✅ API configuration (5Sim, Hero SMS, Nokosmurah, Tripay, QRISPY)
✅ Activity logs monitoring
✅ Manual refund system

## Project Structure

```
otp-virtual-number/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── constants.js
│   │   │   └── logger.js
│   │   ├── controllers/
│   │   │   ├── AuthController.js
│   │   │   ├── UserController.js
│   │   │   ├── OtpController.js
│   │   │   ├── DepositController.js
│   │   │   ├── AdminController.js
│   │   │   └── ResellerController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   ├── validation.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── user.js
│   │   │   ├── otp.js
│   │   │   ├── deposit.js
│   │   │   ├── admin.js
│   │   │   └── reseller.js
│   │   ├── services/
│   │   │   ├── UserService.js
│   │   │   ├── OtpService.js
│   │   │   ├── DepositService.js
│   │   │   ├── AffiliateService.js
│   │   │   └── SettingsService.js
│   │   ├── providers/
│   │   │   ├── BaseOtpProvider.js
│   │   │   ├── FivesimProvider.js
│   │   │   ├── HeroSmsProvider.js
│   │   │   └── NokosmurahProvider.js
│   │   ├── payments/
│   │   │   ├── BasePaymentGateway.js
│   │   │   ├── TripayGateway.js
│   │   │   └── QrisyGateway.js
│   │   ├── websocket/
│   │   │   ├── socketManager.js
│   │   │   └── otpNamespace.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── hash.js
│   │   │   ├── validation.js
│   │   │   ├── formatter.js
│   │   │   └── helpers.js
│   │   ├── jobs/
│   │   │   ├── OtpPolling.js
│   │   │   ├── OrderExpiry.js
│   │   │   ├── DepositExpiry.js
│   │   │   └── TelegramNotifier.js
│   │   └── server.js
│   ├── database/
│   │   └── schema.sql
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Layout/
│   │   │   ├── Dashboard/
│   │   │   ├── OTP/
│   │   │   ├── Deposit/
│   │   │   ├── Admin/
│   │   │   └── Common/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── OrderOtp.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminServices.jsx
│   │   │   └── NotFound.jsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── otp.js
│   │   │   ├── deposits.js
│   │   │   └── admin.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   └── useFetch.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── storage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
├── docs/
│   ├── INSTALLATION.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   └── NGINX_CONFIG.md
└── README.md
```

## Installation

### Prerequisites
- Node.js 16+ dan npm/yarn
- MySQL 5.7+
- Git

### Quick Start

#### 1. Clone Repository
```bash
git clone https://github.com/nyooo19/otp-virtual-number.git
cd otp-virtual-number
```

#### 2. Setup Database
```bash
# Login ke MySQL
mysql -u root -p

# Import schema
source database/schema.sql;
```

#### 3. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi Anda
npm install
npm start
```

#### 4. Setup Frontend
```bash
cd ../frontend
cp .env.example .env
# Edit .env dengan URL backend
npm install
npm run dev
```

## Environment Configuration

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=otp_service
DB_PORT=3306

# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Payment Gateway API Keys
TRIPAY_API_KEY=
QRISPY_API_KEY=

# OTP Providers API Keys
FIVESIM_API_KEY=
HERO_SMS_API_KEY=
NOKOSMURAH_API_KEY=

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=

# CORS
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Logger
LOG_LEVEL=debug
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=10000
VITE_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User Dashboard
- `GET /api/user/dashboard` - Get user dashboard data
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/orders` - Get order history

### OTP Services
- `GET /api/otp/countries` - List all countries
- `GET /api/otp/services` - List all OTP services
- `GET /api/otp/operators` - List operators by country
- `GET /api/otp/pricing` - Get pricing info
- `POST /api/otp/order` - Create OTP order
- `GET /api/otp/order/:id` - Get order status
- `POST /api/otp/order/:id/cancel` - Cancel order
- `POST /api/otp/order/:id/resend` - Resend OTP

### Deposits
- `POST /api/deposits/create` - Create new deposit
- `GET /api/deposits/:id` - Get deposit status
- `POST /api/webhooks/tripay` - Tripay webhook callback
- `POST /api/webhooks/qrispy` - QRISPY webhook callback

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/ban` - Ban/Unban user
- `PATCH /api/admin/users/:id/balance` - Adjust user balance
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/deposits` - List all deposits
- `POST /api/admin/refund` - Manual refund
- `CRUD /api/admin/services` - Manage OTP services
- `CRUD /api/admin/settings` - Website settings

### Reseller API
- `GET /api/reseller/balance` - Check balance
- `GET /api/reseller/services` - List available services
- `POST /api/reseller/order` - Create order
- `GET /api/reseller/order/:id` - Check order status
- `POST /api/reseller/order/:id/cancel` - Cancel order

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions on VPS with aaPanel.

## Nginx Configuration

See [NGINX_CONFIG.md](docs/NGINX_CONFIG.md) for reverse proxy configuration.

## Security Features

✅ Password hashing dengan bcrypt
✅ JWT authentication & authorization
✅ Rate limiting untuk login & API
✅ Input validation & sanitization
✅ CORS protection
✅ Helmet.js security headers
✅ HTTPS ready
✅ API key management for resellers
✅ Webhook signature validation
✅ SQL injection prevention
✅ XSS protection

## Monitoring & Logging

- Pino logger untuk server logging
- Activity logs untuk semua admin actions
- Webhook logs untuk payment callbacks
- API logs untuk reseller requests
- Real-time monitoring via Socket.IO

## Cronjobs

- **OTP Polling**: Setiap 15 detik cek status OTP dari provider
- **Order Expiry**: Setiap 1 menit check dan auto-cancel order yang sudah 15 menit
- **Deposit Expiry**: Setiap 5 menit check deposit yang belum dibayar
- **Telegram Notifier**: Setiap 30 detik kirim pending notifications

## Support & Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

MIT

## Author

Created by [nyooo19](https://github.com/nyooo19)

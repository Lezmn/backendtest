# Backend API Documentation

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- MySQL 5.7+ (or use docker-compose)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MySQL & PhpMyAdmin with Docker
docker-compose up -d

# Run database migrations
npm run migrate

# Create initial admin user
npm run seed
```

Account Admin
admin@example.com
Admin@123

User account
yolko@mail44.com
a123456785

## Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000` (or configured PORT in .env)

## 📝 Swagger APi Doc
http://localhost:3000/api-docs/


## 🧪 Testing
สร้าง .env.test เพื่อสร้าง env ในการ test
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🔐 Environment Variables

```env
# Server
PORT=3005
NODE_ENV=development

# Database (Docker: host=backend_db, port=3306)
DB_HOST=localhost
DB_PORT=8000
DB_USER=root
DB_PASSWORD=root
DB_NAME=mydb

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d

# Client
CLIENT_URL=http://localhost:3005
```


## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f db

# Stop services
docker-compose down

# start a system
docker compose up --build

#Framework และ Database ที่เลือกพร้อมเหตุผล
Node.js เพราะ Springboot ทำใน IntelliJ แล้วงง
Mysql เพราะ สามารถรันได้ผ่าน docker และเคยใช้เมื่อตอนปี 2



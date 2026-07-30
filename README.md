# 📅 Daily Tracker

Ứng dụng theo dõi hoạt động hàng ngày - bữa ăn, công việc, chi tiêu.

## 🚀 Deploy lên Vercel

### Bước 1: Tạo Database PostgreSQL

Bạn cần một PostgreSQL database. Có thể dùng:

**Option 1: Vercel Postgres (Khuyên dùng)**
1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project → Storage → Create Database → Postgres
3. Copy connection string

**Option 2: Neon (Free tier)**
1. Đăng ký tại [neon.tech](https://neon.tech)
2. Tạo project mới
3. Copy connection string (có dạng `postgresql://...?sslmode=require`)

**Option 3: Supabase (Free tier)**
1. Đăng ký tại [supabase.com](https://supabase.com)
2. Tạo project mới
3. Settings → Database → Connection string

### Bước 2: Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com/new](https://vercel.com/new)
3. Import repository
4. Thêm Environment Variable:
   - Name: `DATABASE_URL`
   - Value: Connection string từ bước 1
5. Click Deploy

### Bước 3: Tạo tables trong database

Sau khi deploy, chạy lệnh này để tạo tables:

```bash
npx drizzle-kit push
```

Hoặc kết nối vào database và chạy SQL:

```sql
CREATE TABLE meals (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER,
  notes TEXT,
  time VARCHAR(10),
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE daily_status (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  sleep_hours INTEGER,
  water_cups INTEGER,
  weight INTEGER,
  daily_note TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'VND',
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE live_tracking (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  latitude TEXT,
  longitude TEXT,
  location_name TEXT
);

CREATE TABLE pending_sync (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 💻 Chạy local

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Sửa DATABASE_URL trong .env

# Push schema to database
npx drizzle-kit push

# Run dev server
npm run dev
```

## 📱 Tính năng

- ✅ Theo dõi bữa ăn với hình ảnh
- ✅ Theo dõi hoạt động/công việc
- ✅ Theo dõi chi tiêu với hóa đơn
- ✅ Live tracking - đang làm gì
- ✅ Báo cáo ngày chi tiết
- ✅ Lịch sử tất cả các ngày
- ✅ Offline mode - lưu khi không có mạng
- ✅ Responsive - mobile & desktop

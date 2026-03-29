CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ตาราง Users (เก็บข้อมูลนักพัฒนาและค่าแรง)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- ค่าแรงต่อชั่วโมง (ส่วนของ ERP Finance)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตาราง Boards (โปรเจกต์)
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- งบประมาณรวมของโปรเจกต์ (ส่วนของ ERP Finance)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตาราง Columns (สถานะงาน เช่น Backlog, In Progress, Done)
CREATE TABLE columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL, -- คนรับผิดชอบงาน
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(5, 2) DEFAULT 0.00, -- เวลาที่ประเมินไว้
    due_date    DATE,
    position DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 5. ตาราง Time_Logs (บันทึกเวลาทำงาน - หัวใจของการคำนวณ Costing)
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    hours_spent DECIMAL(5, 2) NOT NULL CHECK (hours_spent > 0),
    cost_incurred DECIMAL(10, 2) NOT NULL, -- ต้นทุนที่เกิดขึ้น (hours_spent * hourly_rate ณ เวลานั้น)
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index สำหรับเพิ่มความเร็วในการดึงข้อมูล
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_time_logs_card_id ON time_logs(card_id);
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
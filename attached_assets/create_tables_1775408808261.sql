-- ALLAL IN OUT Database Schema
-- Use existing database: u807293731_insert
USE u807293731_insert;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    pin VARCHAR(4) UNIQUE NOT NULL,
    employee_id VARCHAR(20) UNIQUE,
    card_no VARCHAR(20),
    face_fingerprint VARCHAR(255),
    hand_fingerprint VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    department ENUM('IT', 'HR', 'Finance', 'Sales') DEFAULT 'IT',
    position VARCHAR(100) NOT NULL,
    role ENUM('employee', 'admin', 'super_admin') DEFAULT 'employee',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    hire_date DATE,
    salary DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    log_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present', 'late', 'absent', 'holiday', 'sick_leave') DEFAULT 'present',
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    UNIQUE KEY unique_employee_date (employee_id, log_date)
);

-- Work Settings Table
CREATE TABLE IF NOT EXISTS work_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(50) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type ENUM('check_in', 'check_out', 'employee_added', 'employee_updated', 'employee_deleted', 'system_update') NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert Default Admin User (if not exists)
INSERT IGNORE INTO users (name, pin, password, email, department, position, role, hire_date, salary) VALUES 
('مدير النظام', '1234', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@allal.com', 'IT', 'مدير عام', 'super_admin', CURDATE(), 0.00);

-- Insert Default Work Settings (if not exists)
INSERT IGNORE INTO work_settings (setting_name, setting_value, description) VALUES
('work_start_time', '09:00', 'وقت بدء العمل اليومي'),
('work_end_time', '17:00', 'وقت انتهاء العمل اليومي'),
('grace_period', '15', 'فترة السماح بالدقائق'),
('company_name', 'ALLAL IN OUT', 'اسم الشركة'),
('timezone', 'Africa/Cairo', 'المنطقة الزمنية'),
('weekend_days', '0,6', 'أيام العطلة الأسبوعية (0=الأحد, 6=السبت)');

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, log_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(log_date);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Add ALLAL admin user (if not exists)
INSERT IGNORE INTO users (name, pin, password, email, department, position, role, hire_date, salary) VALUES 
('allal', 'allal', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'allal@allal.com', 'IT', 'مدير النظام', 'super_admin', CURDATE(), 0.00);

# Attendance Management System - نظام إدارة الحضور والانصراف

## Overview
A comprehensive worker attendance management system built with React + Express + PostgreSQL. Supports worker management with company affiliation, workshop assignment, wages, shifts (morning/evening), contract tracking, daily attendance recording (check-in/check-out), monthly reports with totals, work rules with penalties, device settings management, and CSV import. Arabic RTL interface with dark mode support.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI, RTL layout (Arabic)
- **Backend**: Express.js + Drizzle ORM
- **Database**: Dual support — PostgreSQL (dev/Replit) + MySQL (Hostinger production)
- **Routing**: Wouter for client-side routing
- **DB Detection**: IS_MYSQL flag in `server/db.ts` based on DATABASE_URL prefix

## Production Deployment (Hostinger)
- **Domain**: https://allal.alllal.com
- **Server**: u807293731@109.106.251.14:65002 (shared hosting)
- **App Path**: ~/attendance/dist/index.cjs (Node.js CJS bundle)
- **Process Manager**: PM2 (app name: attendance, port 3000, cluster mode)
- **MySQL DB**: u807293731_insert @ 127.0.0.1:3306
- **Web Proxy**: PHP reverse proxy at ~/domains/allal.alllal.com/public_html/proxy.php
  - Routes all requests from domain to localhost:3000
- **Deploy Steps**: `npm run build` → SCP dist/index.cjs → `pm2 restart attendance`
- **SSH**: `sshpass -f /tmp/sp ssh -o StrictHostKeyChecking=no -p 65002 u807293731@109.106.251.14`
- **GitHub**: https://github.com/souhailted2/Attendance-System

## Project Structure
- `shared/schema.ts` - Database schema (companies, workshops, positions, workRules, employees, attendanceRecords, deviceSettings)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer (IStorage interface + DatabaseStorage)
- `server/db.ts` - Database connection
- `server/zk-service.ts` - ZKTeco device communication service (testConnection, syncAttendanceLogs, clearDeviceLogs)
- `server/seed.ts` - Seed data (5 employees, 3 companies, 3 workshops, 3 positions, 1 work rule, 5 days attendance)
- `client/src/pages/dashboard.tsx` - Dashboard with stats and contract alerts
- `client/src/pages/employees.tsx` - Employee CRUD management
- `client/src/pages/attendance.tsx` - Daily attendance recording
- `client/src/pages/reports.tsx` - Monthly attendance reports with totals
- `client/src/pages/crud-page.tsx` - Reusable CRUD page component (companies, workshops, positions)
- `client/src/pages/work-rules.tsx` - Work rules configuration
- `client/src/pages/devices.tsx` - Device settings management
- `client/src/pages/import-data.tsx` - CSV import for attendance
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/components/theme-provider.tsx` - Dark mode theme provider
- `client/src/components/theme-toggle.tsx` - Theme toggle button

## Key Features
- Worker management with company, workshop, wage, shift, contract dates
- Companies management
- Workshops management
- Daily attendance recording (check-in/check-out)
- Automatic late/early leave penalty calculation
- Monthly attendance summary reports with totals row
- Work rules configuration (start/end times, grace periods, penalties)
- Dashboard with contract expiry alerts
- ZKTeco biometric device integration (connect, test, sync attendance, clear logs) via `node-zklib`
- CSV import for attendance
- RTL Arabic interface with dark mode support

## API Endpoints
- GET/POST /api/companies, PATCH/DELETE /api/companies/:id
- GET/POST /api/workshops, PATCH/DELETE /api/workshops/:id
- GET/POST /api/positions, PATCH/DELETE /api/positions/:id
- GET/POST /api/work-rules, PATCH/DELETE /api/work-rules/:id
- GET/POST /api/employees, PATCH /api/employees/:id
- GET /api/attendance?date=YYYY-MM-DD, POST /api/attendance, PATCH /api/attendance/:id
- GET /api/reports/monthly?month=MM&year=YYYY
- GET/POST /api/device-settings, PATCH/DELETE /api/device-settings/:id
- POST /api/device-settings/:id/test (real ZK connection test)
- POST /api/device-settings/:id/sync (sync attendance from ZK device)
- POST /api/device-settings/:id/clear-logs (clear device attendance logs)
- POST /api/import/attendance (CSV file upload)

## Database Tables
- **companies** - id, name, description
- **workshops** - id, name, description
- **positions** - id, name, description
- **work_rules** - id, name, workStartTime, workEndTime, lateGraceMinutes, penalties, isDefault
- **employees** - id, name, employeeCode, positionId, workRuleId, companyId, workshopId, phone, wage, shift, contractEndDate, nonRenewalDate, isActive
- **attendance_records** - id, employeeId, date, checkIn, checkOut, status, lateMinutes, earlyLeaveMinutes, totalHours, penalty, notes
- **device_settings** - id, name, ipAddress, port, isActive, lastSyncAt

## Running
- `npm run dev` starts Express backend + Vite frontend on port 5000
- `npm run db:push` syncs schema to database

## إصلاحات قاعدة البيانات (MySQL - Hostinger)

### مصدر الحقيقة
- `users` table: employee_id (رقم HR) + card_no (رقم البطاقة) + name
- `employees` table: employee_code (= users.employee_id) + card_number (= users.card_no)
- الربط عبر: `e.card_number COLLATE utf8mb4_general_ci = u.card_no COLLATE utf8mb4_general_ci`

### سكريبتات الإصلاح (scripts/)
- `fix_from_users_table.sql` — ربط employees بـ users (v6، مع حل تعارض collation)
- `fix_names_from_excel.sql` — تحديث أسماء ???? من ملف Excel
- `fix_encoding.sql` — محاولة إصلاح ترميز latin1→utf8
- `run_fix.sh` — تشغيل الإصلاح والتحقق بأمر واحد

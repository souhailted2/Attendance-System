# Attendance Management System - نظام إدارة الحضور والانصراف

## Overview
A comprehensive worker attendance management system built with React + Express + PostgreSQL. Supports worker management with company affiliation, workshop assignment, wages, shifts (morning/evening), contract tracking, daily attendance recording (check-in/check-out), monthly reports with totals, work rules with penalties, device settings management, and CSV import. Arabic RTL interface with dark mode support.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI, RTL layout (Arabic)
- **Backend**: Express.js + Drizzle ORM
- **Database**: PostgreSQL
- **Routing**: Wouter for client-side routing

## Project Structure
- `shared/schema.ts` - Database schema (companies, workshops, positions, workRules, employees, attendanceRecords, deviceSettings)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer (IStorage interface + DatabaseStorage)
- `server/db.ts` - Database connection
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
- Device settings management (stub for ZK biometric device sync)
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
- POST /api/device-settings/:id/test, /sync (stub endpoints)
- POST /api/import/attendance (CSV file upload)

## Database Tables
- **companies** - id, name, description
- **workshops** - id, name, description
- **positions** - id, name, description
- **work_rules** - id, name, workStartTime, workEndTime, lateGraceMinutes, penalties, isDefault
- **employees** - id, name, employeeCode, positionId, workRuleId, companyId, workshopId, phone, wage, shift, contractEndDate, nonRenewalDate, isActive
- **attendance_records** - id, employeeId, date, checkIn, checkOut, status, lateMinutes, earlyLeaveMinutes, totalHours, penalty, notes
- **device_settings** - id, name, ipAddress, port, isActive

## Running
- `npm run dev` starts Express backend + Vite frontend on port 5000
- `npm run db:push` syncs schema to database

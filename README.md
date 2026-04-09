# Project Management Kanban

A Real-time Kanban Board application designed for efficient task and project management. This project demonstrates a complete Full-Stack architecture with a clear separation of concerns, utilizing RESTful APIs for initial data fetching and WebSockets for real-time state synchronization.

## Architecture & Tech Stack

**Frontend**
* Framework: Next.js (App Router) / React
* State Management: Zustand
* Drag & Drop: @dnd-kit/core
* Styling: Tailwind CSS
* HTTP Client: Native Fetch API

**Backend**
* Language: Go (Golang)
* Real-time Communication: Gorilla WebSocket
* Database Tooling: sqlc (for type-safe SQL generation)
* Database Driver: pgx (PostgreSQL Driver and Toolkit)

**Database**
* PostgreSQL (Running on Docker)
* Primary Keys: UUID v4

## Key Features
* **Real-time Synchronization:** Card movements are instantly broadcasted to all connected clients via WebSockets.
* **Optimistic UI Updates:** Drag and drop interactions update the local state immediately before server confirmation, ensuring a seamless user experience.
* **Type-Safe Database Queries:** Utilizes `sqlc` to generate type-safe Go code from SQL statements, preventing runtime errors.
* **Separation of Concerns:** Clear boundary between Data Transfer Objects (DTOs) constructed by the Go backend and UI rendering handled by Next.js.

## Project Structure

```text
mini-erp-kanban/
├── backend/                  # Go server and WebSocket hub
│   ├── cmd/api/              # Application entry point (main.go)
│   ├── database/             # SQL schemas and queries for sqlc
│   ├── internal/
│   │   ├── db/               # Generated type-safe DB code
│   │   └── websocket/        # Hub and Client implementation for WS
├── frontend/                 # Next.js web application
│   ├── src/
│   │   ├── app/              # Next.js routing and main pages
│   │   ├── components/       # Reusable UI components (KanbanCard, Column)
│   │   ├── hooks/            # Custom React hooks (useWebSocket)
│   │   └── store/            # Zustand global state (useBoardStore)
```
##Getting Started
Prerequisites
Node.js (v18 or higher)

Go (v1.20 or higher)

PostgreSQL (or Docker to run the database container)

### 1. Database Setup
Ensure PostgreSQL is running and execute the schema files located in backend/database/schema.sql to create the boards, columns, and cards tables.

### 2. Backend Setup
Navigate to the backend directory:

```bash
cd backend
```
Generate type-safe database models (if schema or queries have changed):
```bash
sqlc generate
```
Start the Go server:
```bash
go run cmd/api/main.go
```
The backend API and WebSocket hub will be available at http://localhost:8080.
### 3. Frontend Setup
Navigate to the frontend directory:

```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Start the Next.js development server:
```bash
npm run dev
```
Open http://localhost:3000 in your browser to view the application.

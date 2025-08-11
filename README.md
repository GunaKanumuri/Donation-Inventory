# Donation Management System

A full-stack web application to track and manage donations. Built with React, TypeScript, Express, and SQLite.

## Features
- Add, edit, and delete donation records
- Track donor name, donation type, quantity/amount, and date
- Responsive, user-friendly UI
- Data stored in SQLite database (backend)
- RESTful API for frontend-backend communication

## Technologies Used
- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript, SQLite, Zod
- **Styling:** CSS Grid, Flexbox, Media Queries

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/GunaKanumuri/Donation-Inventory.git
   cd Donation-Inventory/donation-system
   ```

2. **Install dependencies:**
   - Backend:
     ```sh
     cd backend
     npm install
     ```
   - Frontend:
     ```sh
     cd ../frontend
     npm install
     ```

### Running the Application
1. **Start the backend server:**
   ```sh
   cd backend
   npm run dev
   ```
   The backend runs on `http://localhost:5000`.

2. **Start the frontend app:**
   ```sh
   cd ../frontend
   npm run dev
   ```
   The frontend runs on `http://localhost:5173` (default Vite port).

### Usage
- Open the frontend URL in your browser.
- Add new donations using the form.
- View, edit, or delete donation records in the list.

## Project Structure
```
donation-system/
  backend/
    package.json
    src/
      ...
  frontend/
    package.json
    src/
      App.tsx
      ...
```

## API Endpoints
- `GET /donations` - List all donations
- `POST /donations` - Add a new donation
- `PUT /donations/:id` - Update a donation
- `DELETE /donations/:id` - Delete a donation

## Customization
- Edit styles in `frontend/src/App.tsx` and `frontend/src/style.css`
- Update backend logic in `backend/src/`

## Author
**Guna Kanumuri**

## License
This project is licensed under the MIT License.

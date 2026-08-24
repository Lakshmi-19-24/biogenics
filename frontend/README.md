# Sales Automation System - Frontend

This is the frontend application for the Sales Automation & Field Tracking System. It is built using React 19, Vite, Redux Toolkit, Tailwind CSS, and Socket.io for real-time communication.

## Features

- **Role-Based Dashboards**: Customized views for Owners, Admins, Managers, and Sales Representatives.
- **Authentication & Security**: JWT-based auth with seamless background token refreshing.
- **Real-Time GPS Tracking**: Background 30-minute location updates and manual location sending.
- **Live Notifications**: Powered by Socket.io for immediate alerts on assignments, targets, and payments.
- **CRM & Lead Management**: Track customer interactions, follow-ups, and lead progression.
- **Sales & Orders**: Create orders, generate invoices and quotations, and record payments.
- **Inventory & Field Operations**: Track stock levels, manage visits, submit daily reports, and upload secure documents.
- **Data Analytics**: Visual reporting via Recharts for quick insights into business health.

## Technologies Used

- **React 19**
- **Vite** (Build Tool)
- **Redux Toolkit** (State Management)
- **Tailwind CSS** (Styling)
- **Axios** (HTTP Client)
- **Socket.io-client** (WebSockets)
- **React-Leaflet** (Maps integration)
- **Recharts** (Data Visualization)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Ensure backend is running, then start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

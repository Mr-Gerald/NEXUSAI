# System Architecture Review: NexusAI Trading Dashboard

## 1. Overview

The NexusAI Trading Dashboard is a full-stack web application designed to serve as a command center for a sophisticated, AI-driven cryptocurrency trading system. It provides a real-time user interface for monitoring market data, system performance, and AI-generated insights, while leveraging a dedicated backend for data processing and secure communication with external APIs.

The architecture is split into two primary components: a **Frontend Client** and a **Backend Server**.

---

## 2. Architecture Breakdown

### 2.1. Frontend Client

The frontend is a modern Single Page Application (SPA) built for a responsive, high-performance user experience.

- **Framework**: **React 18** with TypeScript for robust type-safety.
- **Build Tool**: **Vite** provides a fast development server with Hot Module Replacement (HMR) and optimized production builds.
- **Routing**: **React Router (`HashRouter`)** manages client-side navigation between different dashboard pages (Dashboard, Trade Signals, Risk, etc.).
- **Styling**: **TailwindCSS** is used for utility-first styling, enabling rapid development of a custom, professional UI. Global styles and a design system are defined in `index.html`.
- **State Management**: A combination of local component state (`useState`, `useEffect`) and a global `UIContext` for shared UI state (like the sidebar's visibility).
- **Real-time Communication**:
    - **WebSockets**: A custom `useWebSocket` hook establishes persistent connections to the backend for receiving live data streams (e.g., trades, analytics). This hook includes auto-reconnection logic.
    - **Server-Sent Events (SSE)**: The `streamGemini` service uses the native `EventSource` API to efficiently handle one-way streaming of text from the AI Market Analyst.

### 2.2. Backend Server

The backend is a lightweight but powerful Node.js application that serves as the system's core logic and data hub.

- **Framework**: **Express.js** provides a minimal and flexible foundation for the REST API endpoints.
- **Real-time Communication**: The **`ws` library** implements a WebSocket server that runs alongside the Express server, managing connections from multiple frontend clients for different data streams.
- **Core Responsibilities**:
    1.  **API Gateway / Secure Proxy**: It exposes internal API endpoints (e.g., `/api/trade-signal`). When the frontend calls these endpoints, the backend securely adds the `API_KEY` (from a `.env` file) and calls the actual Google Gemini API. **This is a critical security feature that prevents the secret API key from ever being exposed to the browser.**
    2.  **Real-time Data Hub**: It connects to external, real-time data sources (like the live Binance trade feed). It then processes and forwards this data to all connected frontend clients via WebSockets.
    3.  **Environment Management**: Uses the `dotenv` package to manage environment variables, keeping sensitive information like API keys out of the source code.

---

## 3. Key Data Flows

### 3.1. Live Trade Data
1.  **Backend** establishes a persistent WebSocket connection to `stream.binance.com`.
2.  A **Frontend Client** connects to the backend's `/api/trade-stream` WebSocket endpoint.
3.  As Binance pushes new trade data, the **Backend** receives it, formats it into the required JSON structure, and forwards it to the connected **Frontend Client**.
4.  The **Frontend UI** (Dashboard page) receives the new trade via the `useWebSocket` hook and dynamically updates the "Recent Trades" list.

### 3.2. AI Trade Signal Generation
1.  **User** clicks "Scan Market" on the "AI Trade Signals" page.
2.  **Frontend** calls the `getTradeSignal()` service, which makes a `fetch` request to its local `/api/trade-signal` endpoint.
3.  The **Vite Dev Server** proxies this request to the **Backend Server** on `localhost:8080`.
4.  The **Backend** receives the request, calls the Google Gemini API with the specialized prompt and the secret API key, and awaits the structured JSON response.
5.  The **Backend** sends the JSON signal back to the **Frontend**.
6.  The **Frontend UI** receives the signal and displays it in the `TradeSignalCard`, starting the 5-minute countdown.

---

## 4. Strengths & Areas for Improvement

### Strengths
- **Excellent Separation of Concerns**: The frontend is strictly responsible for presentation, while the backend handles all business logic, data fetching, and security.
- **Secure by Design**: The proxy pattern for API key handling is a professional industry standard.
- **Truly Real-time**: The architecture is built from the ground up on WebSockets and SSE for live data, not simulations.
- **Scalable Foundation**: The use of a dedicated backend allows for future expansion, such as adding a database, user authentication, or more complex data processing jobs.

### Areas for Future Improvement
- **Data Persistence**: A database (e.g., PostgreSQL with TimescaleDB, or InfluxDB) should be added to the backend to store historical trade data, P&L, and user information.
- **Configuration**: The Binance stream URL is currently hardcoded. This should be moved to a configuration file or environment variable to allow connections to other assets or exchanges.
- **Authentication**: There is currently no user authentication system. A proper login system (e.g., using JWTs) would be required for a multi-user or production environment.
- **Placeholder Streams**: The other data streams (Dashboard KPIs, Anomalies, Predictions) are currently placeholders in the backend. These need to be implemented with real data sources, similar to the live trade feed.

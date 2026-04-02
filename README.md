# 🛠️ Vitta — Smart Financial Automation for Modern Businesses

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployment Status](https://img.shields.io/badge/Deployment-Live-success)](https://vitta-theta.vercel.app/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Dev-Darji/Vitta/pulls)

Vitta is a powerful accounting and financial automation platform designed specifically for the Indian market (and expanding globally). It streamlines bookkeeping by reading bank statements, auto-categorizing transactions, and generating audit-ready financial reports with a premium, high-performance interface.

**[Live Demo](https://vitta-theta.vercel.app/)** | **[Documentation](#api-documentation)** | **[Contributing](#contributing)**

---

## ✨ Features

- 🏦 **Smart Bank Import**: Support for 500+ Indian bank statement formats (PDF/CSV/Excel).
- 🤖 **Auto-Categorization**: Intelligent transaction mapping based on historical data.
- 📊 **Tally-style Ledgers**: Professional transaction views with debit, credit, and real-time running balances.
- 📉 **P&L & Reports**: Branded PDF exports for Profit & Loss, Category Breakdowns, and Monthly Trends.
- 💼 **Multi-Account Management**: Manage Bank, Cash, and Credit Card accounts in one place.
- 👥 **Client Management**: Track transactions and ledgers per client/business entity.
- 🔍 **Global Search**: Command palette (⌘K) to find transactions, clients, or accounts instantly.
- 🎨 **Premium UI/UX**: Built with React, Framer Motion, and shadcn/ui for a buttery-smooth experience.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS + Vanilla CSS
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

### Backend
- **Framework**: Python FastAPI
- **Database**: MongoDB (Atlas)
- **Async Driver**: Motor
- **Data Processing**: Pandas, PyPDF2
- **Authentication**: JWT (Stateless)

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dev-Darji/Vitta.git
   cd Vitta
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   Create a `.env` file in `backend/`:
   ```env
   MONGO_URL=mongodb+srv://...
   DB_NAME=vitta_database
   SECRET_KEY=your_super_secret_key
   ```
   Start the server:
   ```bash
   uvicorn server:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   Start the dev server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
Vitta/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Dashboard, Transactions, Accounts, Clients, Reports...
│   │   ├── components/     # UI components, Layouts, Modals...
│   │   ├── lib/            # API client, Utilities...
│   │   └── App.js
└── backend/
    ├── server.py          # Unified FastAPI backend
    ├── requirements.txt
    └── .env
```

---

## 📡 API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user & get JWT |
| `/api/accounts/summary` | GET | Get accounts with inflow/outflow |
| `/api/transactions` | GET | Paginated transaction ledger |
| `/api/import/csv` | POST | Upload and parse bank statement |
| `/api/search` | GET | Unified global search |
| `/api/reports/summary` | GET | Dashboard KPI data |

---

## 🗺️ Roadmap

- [ ] **Invoicing System**: Generate and track professional invoices.
- [ ] **Data Export**: Full JSON/Excel backup of all user data.
- [ ] **GST Reports**: Automated GSTR-1 and GSTR-3B preparation.
- [ ] **Multi-Currency**: Support for global business transactions.
- [ ] **Dark Mode**: High-contrast theme for night owls.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## ✉️ Contact

Dev Darji - [dev.darji@example.com](mailto:dev.darji@example.com)

Project Link: [https://github.com/Dev-Darji/Vitta](https://github.com/Dev-Darji/Vitta)

---
*Made with ❤️ for businesses worldwide.*

# Valoro Tech IVR System

A robust IVR (Interactive Voice Response) system built with Node.js, Asterisk (ARI), and Express. This application provides automated call handling, menu navigation, voice recording, and integration with Freshdesk and SQL databases.

## 🚀 Features

- **Interactive Menus**: Multi-level IVR menus (Main, Support).
- **Call Recording**: Record customer messages for support tickets.
- **Freshdesk Integration**: Automatically create tickets with voice recordings attached.
- **Dashboard API**: RESTful API for retrieving call stats, logs, and recordings.
- **Database Logging**: Comprehensive call tracking using PostgreSQL/Sequelize.
- **Operator Handover**: Seamless transfer to human operators.

## 📂 Project Structure

The project has been refactored into a modular architecture:

```
src/
├── config/         # Configuration files (ARI info, Menu definitions)
├── controllers/    # Express API controllers
├── routes/         # Express API route definitions
├── services/       # Core IVR logic (ARI events, menus, recordings)
├── utils/          # Utility functions (e.g., ARI playback)
├── models/         # Sequelize database models
├── migrations/     # Database migrations
├── index.js        # Application entry point
├── db.js           # Database connection setup
└── freshdesk.js    # Freshdesk integration logic
```

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Asterisk PBX](https://www.asterisk.org/) (configured for ARI)
- [PostgreSQL](https://www.postgresql.org/)

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd IVR-demo
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory (or ensure it exists) with the following variables:
   ```env
   PORT=3001
   
   # Asterisk ARI Configuration
   ARI_URL=http://localhost:8088
   ARI_USER=freshdesk
   ARI_PASS=your_ari_password
   
   # Database Configuration
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASS=your_db_pass
   DB_HOST=localhost
   
   # Freshdesk Configuration
   FRESHDESK_API_KEY=your_api_key
   FRESHDESK_DOMAIN=your_domain
   ```

4. **Database Migration**
   Run migrations to set up your database schema:
   ```bash
   npm run migrate
   ```

5. **Start the Application**
   ```bash
   npm start
   ```

## 📡 API Endpoints

The system provides a comprehensive API for your dashboard frontend.

### Statistics & Dashboard
- `GET /api/stats` - Get daily call statistics (Total, Missed).
- `GET /api/stats/range?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get stats for a date range.

### Logs & Recordings
- `GET /api/logs` - List call logs (supports filtering: `status`, `date`, `caller`).
- `GET /api/logs/:id` - Get details of a specific call log.
- `GET /api/recordings/:filename` - Stream/Download a call recording file.

### Tickets
- `GET /api/tickets` - List created tickets.
- `GET /api/tickets/:id` - Get specific ticket details.

## 📞 IVR Flow

1. **Welcome**: Caller hears a greeting.
2. **Main Menu**:
   - Press `1`: Support (Go to Support Menu)
   - Press `0`: Operator (Bridge call)
3. **Support Menu**:
   - Press `1`: System Issue (Record message -> Create Ticket)
   - Press `2`: Account Issue (Record message -> Create Ticket)
   - Press `3`: Bug Report (Record message -> Create Ticket)
   - Press `4`: Integration Issue (Record message -> Create Ticket)
   - Press `0`: Operator

## 🔧 Development

- **Linting**: (If applicable)
- **Formatting**: (If applicable)

## 📄 License

ISC

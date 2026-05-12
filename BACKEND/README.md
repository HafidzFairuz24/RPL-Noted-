# Noted! — Backend API

Node.js + Express + MySQL REST API for the **Noted!** project management app.

---

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Auth**: JWT (Bearer Token)

---

## Getting Started

### 1. Clone & install
```bash
git clone <your-repo-url> -b backend
cd noted-backend
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and a strong JWT_SECRET
```

### 3. Setup database
```bash
# Login to MySQL and run the schema
mysql -u root -p < sql/schema.sql
```

### 4. Run the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```
Server runs at `http://localhost:5000`

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |

### Workspaces
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/workspaces` | Get my workspaces | ✅ |
| POST | `/api/workspaces` | Create workspace | ✅ |
| GET | `/api/workspaces/:id` | Get workspace detail | ✅ Member |
| PUT | `/api/workspaces/:id` | Update workspace | ✅ Owner |
| DELETE | `/api/workspaces/:id` | Delete workspace | ✅ Owner |
| POST | `/api/workspaces/:id/members` | Add member by email | ✅ Owner |
| DELETE | `/api/workspaces/:id/members/:userId` | Remove member | ✅ Owner |

### Lists
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/workspaces/:workspaceId/lists` | Get lists | ✅ Member |
| POST | `/api/workspaces/:workspaceId/lists` | Create list | ✅ Member |
| GET | `/api/workspaces/:workspaceId/lists/:id` | Get list detail | ✅ Member |
| PUT | `/api/workspaces/:workspaceId/lists/:id` | Update list | ✅ Member |
| DELETE | `/api/workspaces/:workspaceId/lists/:id` | Delete list | ✅ Member |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/lists/:listId/tasks` | Get tasks | ✅ |
| POST | `/api/lists/:listId/tasks` | Create task | ✅ |
| GET | `/api/lists/:listId/tasks/:id` | Get task + comments | ✅ |
| PUT | `/api/lists/:listId/tasks/:id` | Update task | ✅ |
| DELETE | `/api/lists/:listId/tasks/:id` | Delete task | ✅ |

### Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/lists/:listId/tasks/:taskId/comments` | Add comment | ✅ |
| PUT | `/api/lists/:listId/tasks/:taskId/comments/:id` | Edit own comment | ✅ |
| DELETE | `/api/lists/:listId/tasks/:taskId/comments/:id` | Delete own comment | ✅ |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get my notifications | ✅ |
| PUT | `/api/notifications/read-all` | Mark all as read | ✅ |
| PUT | `/api/notifications/:id/read` | Mark one as read | ✅ |
| DELETE | `/api/notifications/:id` | Delete notification | ✅ |

---

## Connecting to Frontend

1. Copy `js/api.js` from this repo into your frontend as `js/api.js`
2. Add to every HTML page (before other scripts):
   ```html
   <script src="../js/api.js"></script>
   ```
3. Use the API helpers in your page scripts:
   ```js
   // Login example
   const data = await AuthAPI.login({ email, password });
   Auth.setToken(data.token);
   Auth.setUser(data.user);

   // Get workspaces
   const { workspaces } = await WorkspaceAPI.getAll();

   // Create task
   await TaskAPI.create(listId, { title, priority: 'high', due_date: '2025-12-31' });
   ```
4. Protect pages by calling `requireAuth()` at the top of each script on authenticated pages.

---

## Project Structure
```
noted-backend/
├── sql/
│   └── schema.sql          # Database schema
├── src/
│   ├── app.js              # Entry point
│   ├── config/
│   │   └── db.js           # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js         # JWT verification
│   │   └── workspace.js    # Role checks (isMember, isOwner)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── workspaceController.js
│   │   ├── listController.js
│   │   ├── taskController.js
│   │   ├── commentController.js
│   │   └── notificationController.js
│   └── routes/
│       ├── auth.js
│       ├── workspaces.js
│       ├── lists.js
│       ├── tasks.js
│       └── notifications.js
├── js/
│   └── api.js              # Copy this to your frontend
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

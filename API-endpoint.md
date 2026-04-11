# Task Tracker API Endpoints

This document provides a comprehensive list of all backend API routes, their methods, and data requirements.

## Authentication & Identity

| Endpoint | Method | Auth | Payload / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | 🔓 | `{ email, password }` | Authenticate and obtain JWT access & refresh tokens. |
| `/api/v1/auth/me` | `GET` | 🔑 | - | Retrieve current authenticated user profile. |
| `/api/v1/auth/refresh` | `POST` | 🍪 | - | Exchange refresh token (cookie) for new access token. |
| `/api/v1/auth/forgot` | `POST` | 🔓 | `{ email }` | Initiate password reset flow. |
| `/api/v1/auth/change-password`| `POST` | 🔑 | `{ newPassword }` | Update account password. |

## Organizational Management

| Endpoint | Method | Auth | Payload / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/companies` | `POST` | 👑 | `{ name, email, domain }` | Provision a new company tenant (Super Admin only). |
| `/api/v1/departments` | `POST` | 🔑 | `{ departmentName, name, email }` | Create department and assign head (Admin). |
| `/api/v1/departments` | `GET` | 🔑 | `?page, limit` | List all departments in current company. |
| `/api/v1/departments/:id` | `GET` | 🔑 | `:id` | Get specific department details. |
| `/api/v1/departments/:id` | `PATCH`| 🔑 | `:id`, `{ departmentName }` | Rename a department. |
| `/api/v1/departments/:id` | `DELETE`| 🔑 | `:id` | Remove a department. |
| `/api/v1/users` | `POST` | 🔑 | `{ name, email, role }` | Create new user (Admin/Dept Head). Roles: `employee`, `department_head`. |
| `/api/v1/users` | `GET` | 🔑 | `?page, limit, filterRole` | Search and list company users. |
| `/api/v1/users/:id` | `PATCH`| 🔑 | `:id`, `{ name, email, globalRole }` | Update user account details. |
| `/api/v1/users/:id` | `DELETE`| 🔑 | `:id` | Deactivate/Remove user. |

## Project & Task Lifecycle

| Endpoint | Method | Auth | Payload / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/projects` | `POST` | 🔑 | `{ name, description, departmentId }` | Create project within a department. |
| `/api/v1/projects` | `GET` | 🔑 | `?page, limit` | List company projects. |
| `/api/v1/projects/:id` | `PATCH`| 🔑 | `:id`, `{ name, description, status }` | Update project metadata. |
| `/api/v1/project-members` | `POST` | 🔑 | `{ projectId, userId, role }` | Add member to project. |
| `/api/v1/project-review` | `POST` | 🔑 | `{ projectId, discussion, feedback }` | Log project-level stakeholder review. |
| `/api/v1/modules` | `POST` | 🔑 | `{ projectId, title, description, order }` | Subdivide project into modules. |
| `/api/v1/module-assignments` | `POST` | 🔑 | `{ moduleId, projectId, assigneeId, role }` | Assign user to specific module tasks. |
| `/api/v1/module-reviews` | `POST` | 🔑 | `{ moduleId, decision, feedback }` | Approve or reject module work (`pending`, `in_progress`, `completed`). |

## Tracking & Documentation

| Endpoint | Method | Auth | Payload / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/bugs` | `POST` | 🔑 | `{ projectId, title, description, severity }` | Log defect. Severity: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `/api/v1/bugs` | `GET` | 🔑 | `?projectId, status` | Query bugs by project or status (`OPEN`, `RESOLVED`, etc.). |
| `/api/v1/daily-logs` | `POST` | 🔑 | `{ projectId, logDate, hoursSpent, description }` | Record daily billable/work hours. |
| `/api/v1/kt-documents` | `POST` | 🔑 | `{ projectId, title, content }` | Store Knowledge Transfer documentation. |
| `/api/v1/activity-logs` | `GET` | 🔑 | `?projectId, userId` | Retrieve audit trail for entities. |
| `/api/v1/feature-flags` | `POST` | 🔑 | `{ flagKey, enabled }` | Toggle system features globally/per tenant. |
| `/api/v1/sessions` | `GET` | 🔑 | - | List active login sessions for user. |
| `/api/v1/sessions` | `DELETE`| 🔑 | - | Revoke all sessions (Logout everywhere). |

---

### **Authentication Legend**
- 🔓 **Public**: No token required.
- 🔑 **Bearer Auth**: Header `Authorization: Bearer <accessToken>` is mandatory.
- 👑 **Super Admin**: Restricted to internal maintenance roles.
- 🍪 **Session**: Requires `refreshToken` set via HttpOnly cookie.

> [!NOTE]
> All endpoints return standard HTTP status codes (20x for success, 401 for unauthorized, 403 for forbidden, and 400/500 for errors).

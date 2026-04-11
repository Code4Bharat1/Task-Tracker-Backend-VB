Here’s a **clean, production-style API table** (normalized, consistent naming, grouped, and scalable).

---

#  API Endpoints (v1)

## 🏢 Company

| Method | Endpoint            | Description              | Request Body                             | Response                      |
| ------ | ------------------- | ------------------------ | ---------------------------------------- | ----------------------------- |
| POST   | `/api/v1/companies` | Register company + admin | `{ companyName, name, email, password }` | `{ message, company, admin }` |

---

## 🏬 Departments

| Method | Endpoint                  | Description          | Request                                       | Response                |
| ------ | ------------------------- | -------------------- | --------------------------------------------- | ----------------------- |
| POST   | `/api/v1/departments`     | Create department    | `{ departmentName }` *(companyId from token)* | `{ department }`        |
| GET    | `/api/v1/departments`     | Get all departments  | — *(company inferred from token)*             | `{ departments[] }`     |
| GET    | `/api/v1/departments/:id` | Get department by ID | —                                             | `{ department }`        |
| PUT    | `/api/v1/departments/:id` | Update department    | `{ departmentName }`                          | `{ updatedDepartment }` |
| DELETE | `/api/v1/departments/:id` | Delete department    | —                                             | `{ message }`           |

---

## 👤 Users

| Method | Endpoint            | Description          | Request                                               | Response          |
| ------ | ------------------- | -------------------- | ----------------------------------------------------- | ----------------- |
| POST   | `/api/v1/users`     | Create user          | `{ name, email, password, globalRole, departmentId }` | `{ user }`        |
| GET    | `/api/v1/users`     | Get users (filtered) | `?role=&departmentId=`                                | `{ users[] }`     |
| GET    | `/api/v1/users/:id` | Get user by ID       | —                                                     | `{ user }`        |
| PUT    | `/api/v1/users/:id` | Update user          | `{ name, email, role, departmentId }`                 | `{ updatedUser }` |
| DELETE | `/api/v1/users/:id` | Delete user          | —                                                     | `{ message }`     |
| GET    | `/api/v1/users/role/:role` | Get users by role (admin / department_head / employee) |

---

## 🔐 Authentication

| Method | Endpoint                       | Description        | Request Body                                | Response                |
| ------ | ------------------------------ | ------------------ | ------------------------------------------- | ----------------------- |
| POST   | `/api/v1/auth/login`           | Login user         | `{ email, password }`                       | `{ accessToken, user }` |
| POST   | `/api/v1/auth/change-password` | Change password    | `{ newPassword }` *(Bearer token required)* | `{ message }`           |
| POST   | `/api/v1/auth/google`          | Google OAuth login | `{ idToken }`                               | `{ accessToken, user }` |

## Projects
POST   api/v1/projects
GET    api/v1/projects
GET    api/v1/projects/:id
UPDATE api/v1/projects/:id
DELETE api/v1/projects/:id
GET    api/v1/projects?status=active
GET    api/v1/projects?status=not-active
GET    api/v1/projects?departmentId=xyz
GET    api/v1/projects?status=active&departmentId=xyz
---

## Project Member
| Method | Endpoint | Description                  | Request Body                  | Response                |
| ------ | -------- | ---------------------------- | ----------------------------- | ----------------------- |
| POST   | `http://localhost:5000/api/v1/`      | Add project member           | `{ projectId, userId, role }` | `{ message, data }`     |
| GET    | `http://localhost:5000/api/v1/`      | Get all members (filterable) | —                             | `{ message, data: [] }` |
| GET    | `http://localhost:5000/api/v1/:id`   | Get single member            | —                             | `{ message, data }`     |
| PUT    | `http://localhost:5000/api/v1/:id`   | Update member role           | `{ role }`                    | `{ message, data }`     |
| DELETE | `http://localhost:5000/api/v1/:id`   | Delete member                | —                             | `{ message }`           |


## Project Review
| Method | Endpoint | Description                        | Request Body                                               | Response                |
| ------ | -------- | ---------------------------------- | ---------------------------------------------------------- | ----------------------- |
| POST   | `http://localhost:5000/api/v1/project-review/`      | Create a new review                | `{ projectId, companyId, testerId, discussion, feedback }` | `{ message, data }`     |
| GET    | `http://localhost:5000/api/v1/project-review?projectId=&testerId=`      | Get all reviews (optional filters) | —                                                          | `{ message, data: [] }` |
| GET    | `http://localhost:5000/api/v1/project-review/:id`   | Get single review                  | —                                                          | `{ message, data }`     |
| PUT    | `http://localhost:5000/api/v1/project-review/:id`   | Update review                      | `{ discussion?, feedback? }`                               | `{ message, data }`     |
| DELETE | `http://localhost:5000/api/v1/project-review/:id`   | Delete review                      | —                                                          | `{ message }`           |


### 4. 🔐 Access Control Summary

| Role            | Permissions                             |
| --------------- | --------------------------------------- |
| admin           | full company access                     |
| department_head | only same department                    |
| employee        | limited (no create/update/delete users) |

---
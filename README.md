# ClubHub — User Module Branch

This branch (`user-module`) is a **standalone, runnable subset** of the ClubHub
project containing **only the user / authentication / profile / role
management surface**. It was extracted from the full mono-repo so a teammate
can plug into the auth flow, run it end-to-end, and share session/JWT
plumbing with the other feature branches (events, RSVP, treasury…) without
having to clone the entire codebase.

---

## What's in this branch

```
.
├── backend/
│   ├── user-service/     # Spring Boot service — owns Users, Roles, Permissions, JWT
│   └── gateway/          # Spring Cloud Gateway — single entry point on :8084
└── frontend/             # Angular 21 app — auth pages, profile, clubs, members, roles
```

### Backend — `backend/user-service` (port `8081`)

Authoritative source for users, roles, custom roles and authentication.

* `POST /api/auth/signup` — create account, returns a JWT cookie
* `POST /api/auth/login`  — authenticate, returns a JWT cookie
* `POST /api/auth/logout` — clears the cookie
* `GET  /api/users/me`    — resolve the connected user from the cookie
* `CRUD /api/users/*`     — list / update / delete members
* `CRUD /api/roles/*`     — custom roles
* `CRUD /api/permissions/*`

The JWT secret (`jwt.secret` in `application.properties`) **must be shared** by
every other microservice that wants to recover the connected user from the
`jwt` cookie (see "Sharing the session" below).

### Backend — `backend/gateway` (port `8084`)

Routes every public call from the Angular app to the right downstream
service and centralises CORS + cookie credentials. The frontend talks to
`http://localhost:8084` only.

### Frontend — `frontend` (Angular 21, dev port `4200`)

```
src/app/
├── pages/
│   ├── auth-pages/       # sign-in, sign-up
│   ├── setup-club/       # one-shot club creation right after signup
│   ├── profile/          # /profile — edit personal info & photo
│   ├── clubs/            # /clubs — list / detail / create / edit
│   ├── users/            # /users — members directory (PRESIDENT / CEO scope)
│   ├── roles/            # /roles — role management (PRESIDENT only)
│   └── dashboard/        # minimal post-login landing page
├── shared/
│   ├── components/auth/  # signin/signup form widgets
│   ├── components/header,user-profile,...
│   ├── layout/           # app-layout, app-header, app-sidebar
│   ├── services/         # auth, club, custom-role, permission, theme, …
│   └── pipe/
├── guards/auth.guard.ts  # authGuard, guestGuard, homeGuard, ceoGuard, presidentGuard
├── interceptors/jwt.interceptor.ts
└── app.routes.ts         # only exposes the routes above
```

Removed compared to `main`: `pages/{calender,rsvp,tasks,all-events,
borrowed-items,elections,qr-scanner,...}` and the matching shared services /
widgets. They live on the `eventManagement`, `tresory`, `club_election` and
`MessagingService` branches.

---

## Sharing the session across services

User-service is the only service that **issues** the JWT, but every other
microservice (events, RSVP, treasury…) needs to **decode** it to know who is
calling. The contract is:

1. **Login / signup** — `user-service` puts the JWT in an `HttpOnly`,
   `SameSite=Lax` cookie named `jwt` on the response.
2. **Subsequent calls** — the Angular `JwtInterceptor` always sends
   `withCredentials: true`, so the browser re-attaches the cookie on every
   call to `localhost:8084`.
3. **Decoding the cookie elsewhere** — any teammate writing a service that
   needs the connected user reads the cookie and decodes the JWT with the
   same secret. A reference implementation is provided in the main
   `Backend/` module (`tn.esprit.clubhub.Security.SessionService`):

   ```java
   SessionUser me = sessionService.currentUser(request);
   if (me == null || !me.isComplete())
       return ResponseEntity.status(401).build();

   String userId = me.id();      // JWT claim "userId"
   String email  = me.email();   // JWT subject
   String role   = me.role();    // JWT claim "role"
   String name   = me.fullName();// looked up once from /api/users/{id}
   ```

   Two configuration keys must be set in your service's
   `application.properties` and **must match** `user-service`:

   ```properties
   jwt.secret=clubhub_super_secret_key_must_be_at_least_32_chars!
   user-service.base-url=http://localhost:8081
   ```

   With this in place your controllers should **never** read `userId` /
   `email` / `name` from the request body — always from the session.

---

## Running locally

### Prerequisites

* JDK 17+
* Maven 3.9+
* Node.js 20+ and npm
* MongoDB running on `mongodb://localhost:27017`
  (databases `User` and `ClubHub` are created on first write)
* SMTP credentials if you want the welcome / password-reset emails to leave
  the JVM (the user-service can run without them).

### 1. Start the backend

```powershell
# Terminal 1 — user-service
cd backend\user-service
mvn spring-boot:run        # starts on http://localhost:8081

# Terminal 2 — gateway
cd backend\gateway
mvn spring-boot:run        # starts on http://localhost:8084
```

### 2. Start the frontend

```powershell
cd frontend
npm install
npm start                  # ng serve --open on http://localhost:4200
```

### 3. Smoke test

1. Open `http://localhost:4200` → redirected to `/signin`.
2. Click "Sign up", create an account.
3. You're redirected to `/setup-club` → create a club (or skip if you joined an existing one).
4. Land on `/dashboard` with your name shown in the top right.
5. From the sidebar: visit `/profile`, `/clubs`, `/users`, `/roles`.

If `/api/auth/login` returns 401 with no cookie set, double-check the
`SameSite`/`Secure` attributes match your dev origin (HTTP on localhost
needs `SameSite=Lax`, **not** `None`).

---

## Why an orphan branch?

This branch was created with `git checkout --orphan user-module` so it
**does not** carry the history of the other feature branches. That keeps
the diff teammates see focused on what they actually need to review for the
user / auth surface. To merge user-module into `main` later, prefer a
`git merge --allow-unrelated-histories` or rebase the relevant commits
onto a real merge base.

---

## Contact

For any issue with the auth flow, open an issue tagged `area:user-module`
on the GitHub repo.

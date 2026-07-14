# Autocut Tickets API

An AI-powered automated ticket management system built with Node.js, Express, and MongoDB. Users submit support tickets in plain English, and the system automatically classifies the issue, routes it to the correct team, handles file attachments, and sends transactional emails — all without any manual intervention.

**Live API:** [https://autocut-tickets-api.onrender.com](https://autocut-tickets-api.onrender.com)

---

## Features

- **JWT Authentication** — secure register and login with hashed passwords
- **Role-Based Access Control** — `user`, `staff`, and `admin` roles; only staff/admin can update ticket status, only admins can promote/demote roles; privilege escalation blocked at registration
- **AI-Powered Ticket Classification** — Groq (Llama 3.3 70b) reads ticket descriptions and auto-classifies them into categories
- **Intelligent Ticket Splitting** — detects multiple unrelated issues in one description and automatically creates parent + child tickets, each independently trackable
- **Automatic Parent Resolution** — a parent ticket is marked resolved (with a single resolution email) only once every one of its child tickets is resolved
- **AI-Driven Email Routing** — tickets are routed to the correct team's inbox based on AI classification
- **Transactional Emails via Resend** — confirmation email sent to user on ticket creation, resolution email sent when ticket is closed, sent from a verified custom domain
- **AWS S3 Integration** — file attachments (images/PDFs) uploaded to S3 with pre-signed, time-limited access URLs (not public links); ticket metadata stored as JSON
- **Automatic Data Cleanup** — tickets auto-delete after 30 days via MongoDB TTL index; S3 attachments auto-delete after 30 days via an S3 lifecycle rule
- **Ownership-Verified Access** — users can only view/update/delete their own tickets; staff/admin can manage any ticket
- **Duplicate Submission Protection** — rejects near-identical resubmissions within a short window
- **File Content Verification** — uploaded files are checked by actual byte signature (not just client-supplied MIME type)
- **Rate Limiting** — general API limiter plus a stricter limiter on auth routes to slow brute-force attempts
- **HTML-Escaped Emails** — user input is sanitized before being inserted into email templates
- **UUID-Based Ticket Tracking** — every ticket gets a unique public-facing ID

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| AI Classification | Groq API (Llama 3.3 70b) |
| Email Service | Resend (verified custom domain) |
| File Storage | AWS S3 (pre-signed URLs, lifecycle rules) |
| File Upload | Multer + file-type (content verification) |
| Rate Limiting | express-rate-limit |
| Hosting | Render |

---

## Project Structure

```
AUTOCUT-TICKETS-API/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controller/
│   │   ├── authController.js     # Register, login, role management
│   │   └── ticketController.js   # Ticket CRUD + AI + S3 + role logic
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── errorHandler.js       # Global error handler (hides internals in production)
│   │   └── upload.js             # Multer config + file content verification
│   ├── model/
│   │   ├── Ticket.js             # Ticket schema (with TTL + indexes)
│   │   └── User.js               # User schema (with role field)
│   ├── routes/
│   │   ├── authRouter.js         # Auth + role routes
│   │   └── ticketRoutes.js       # Ticket routes
│   └── utils/
│       ├── aiClassifier.js       # Groq AI classification logic
│       ├── mailer.js             # Resend email functions
│       └── s3Uploader.js         # AWS S3 upload + pre-signed URL functions
├── emailRoutes.js                # Category to team-email mapping
├── server.js                     # App entry point
├── .env                          # Environment variables (not committed)
├── .gitignore
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB database (local or MongoDB Atlas)
- Groq API key ([console.groq.com](https://console.groq.com))
- Resend account + verified sending domain ([resend.com](https://resend.com))
- AWS account with S3 bucket and IAM credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rushi-0/autocut-tickets-api.git
cd autocut-tickets-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```dotenv
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret_key
RESEND_API_KEY=your_resend_api_key
GROQ_API_KEY=your_groq_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your_s3_bucket_name
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

Server runs on `http://localhost:6000`

---

## API Endpoints

### Auth Routes

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user (always created with role `user`) | No |
| POST | `/api/auth/login` | Login and get JWT token (includes role) | No |
| PUT | `/api/auth/role` | Promote/demote a user's role | Yes — admin only |

### Ticket Routes

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/tickets` | Get tickets — own tickets for regular users, all tickets for staff/admin (paginated) | Yes |
| GET | `/api/tickets/:id` | Get ticket by UUID (attachment URL resolved as pre-signed link) | No |
| POST | `/api/tickets` | Create a new ticket (with duplicate-submission check) | Yes |
| PUT | `/api/tickets/:id` | Update ticket status/priority/assignedTo | Yes — staff/admin only |
| DELETE | `/api/tickets/:id` | Delete a ticket | Yes — owner or staff/admin |

---

## How It Works

### Ticket Creation Flow

```
User submits title + description + optional attachment
        ↓
Duplicate-submission check (rejects near-identical recent resubmits)
        ↓
Groq AI reads description → classifies into category/categories
        ↓
Single issue?                    Multiple unrelated issues?
        ↓                                    ↓
One ticket created            Parent ticket + child tickets created
Category set by AI            Each child gets its own category
        ↓                                    ↓
Email sent to correct team    Email sent to each team separately
        ↓                                    ↓
Confirmation email sent to user (via Resend)
        ↓
File attachment uploaded to AWS S3 (private, pre-signed access only)
Ticket metadata saved to AWS S3
```

### Ticket Resolution Flow (Parent/Child)

```
Staff/admin marks a child ticket "done"
        ↓
System checks: are ALL sibling child tickets also "done"?
        ↓                              ↓
   No → wait, no email sent      Yes → parent marked "done"
                                        ↓
                              ONE resolution email sent to the user
```

### Ticket Splitting Example

**User submits:**
```json
{
  "title": "Multiple Problems",
  "description": "My payment failed and my account has been locked"
}
```

**System creates:**
- Parent ticket — category: `Multiple Issues`
- Child ticket 1 — category: `Payment & Refunds` → routed to `finance@company.com`
- Child ticket 2 — category: `Account Issues` → routed to `accounts@company.com`

---

## Roles

| Role | Permissions |
|---|---|
| `user` (default) | Create tickets, view own tickets, cannot update ticket status |
| `staff` | View all tickets, update any ticket's status/priority/assignedTo |
| `admin` | Everything staff can do, plus promote/demote other users' roles |

Roles can never be set via registration — every new account defaults to `user` regardless of what's sent in the request body. The first admin is bootstrapped manually in the database; subsequent role changes go through the protected `PUT /api/auth/role` route.

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `RESEND_API_KEY` | Resend API key for sending transactional emails |
| `GROQ_API_KEY` | Groq API key for AI classification |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region (e.g. ap-south-1) |
| `AWS_BUCKET_NAME` | S3 bucket name |
| `NODE_ENV` | `production` hides internal error details from API responses |

---

## Security & Production Hardening

This project went through a full security audit after the initial build. Fixes applied:

- **Ownership checks** — update/delete routes verify the requester owns the ticket (or is staff/admin) before allowing changes
- **Scoped ticket listing** — regular users only see their own tickets; previously any unauthenticated request could list every ticket
- **Sanitized error responses** — production mode hides internal error details from API responses while still logging them server-side
- **HTML-escaped email content** — prevents injection via ticket title/description into email templates
- **Stricter auth rate limiting** — separate, tighter limiter on `/register` and `/login` to slow brute-force attempts
- **Real file content verification** — uploaded files are checked by actual byte signature via `file-type`, not just the client-supplied MIME type
- **Pre-signed S3 URLs** — attachments are private by default; a time-limited signed URL is generated only when a ticket is viewed
- **Database indexes** — added on `raisedBy`, `status`, `category` for query performance at scale
- **Privilege escalation prevention** — `role` can never be set via the registration endpoint
- **Automatic data retention** — tickets and their S3 attachments auto-expire after 30 days

### A production deployment debugging note

During deployment to Render, Gmail SMTP (via Nodemailer) consistently failed with an `ENETUNREACH` error — Render's network was attempting to reach Gmail over IPv6, and that route was unreachable, causing every email to time out. Forcing IPv4 resolution didn't resolve it reliably. The fix was migrating email delivery from raw SMTP to **Resend**, an HTTP-based transactional email API, which sidesteps the SMTP/IPv6 compatibility issue entirely. A custom domain (`autocutsupport.online`) was then verified with Resend (SPF, DKIM, DMARC, MX records) to enable sending to any recipient rather than being restricted to a single test address.

---

## Author

**Hema Rushikesh Kalepu**
GitHub: [@rushi-0](https://github.com/rushi-0)

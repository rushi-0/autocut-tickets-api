# Autocut Tickets API

An AI-powered automated ticket management system built with Node.js, Express, and MongoDB. Users submit support tickets in plain English, and the system automatically classifies the issue, routes it to the correct team, handles file attachments, and sends transactional emails — all without any manual intervention.

---

## Features

- **JWT Authentication** — secure register and login with hashed passwords
- **AI-Powered Ticket Classification** — Groq (Llama 3.3 70b) reads ticket descriptions and auto-classifies them into categories
- **Intelligent Ticket Splitting** — detects multiple unrelated issues in one description and automatically creates parent + child tickets
- **AI-Driven Email Routing** — tickets are routed to the correct team's inbox based on AI classification
- **Transactional Emails** — confirmation email sent to user on ticket creation, resolution email sent when ticket is closed
- **AWS S3 Integration** — file attachments (images/PDFs) uploaded to S3, ticket metadata stored as JSON
- **UUID-Based Ticket Tracking** — every ticket gets a unique public-facing ID
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **File Upload Validation** — only JPEG, PNG, PDF allowed, 5MB max file size

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| AI Classification | Groq API (Llama 3.3 70b) |
| Email Service | Nodemailer (Gmail SMTP) |
| File Storage | AWS S3 |
| File Upload | Multer |
| Rate Limiting | express-rate-limit |

---

## Project Structure

```
AUTOCUT-TICKETS-API/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controller/
│   │   ├── authController.js     # Register and login logic
│   │   └── ticketController.js   # Ticket CRUD + AI + S3 logic
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── errorHandler.js       # Global error handler
│   │   └── upload.js             # Multer file upload config
│   ├── model/
│   │   ├── Ticket.js             # Ticket schema
│   │   └── User.js               # User schema
│   ├── routes/
│   │   ├── authRouter.js         # Auth routes
│   │   └── ticketRoutes.js       # Ticket routes
│   └── utils/
│       ├── aiClassifier.js       # Groq AI classification logic
│       ├── mailer.js             # Email functions
│       └── s3Uploader.js         # AWS S3 upload functions
├── emailRoutes.js                # Category to email mapping
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
- Gmail account with App Password enabled
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
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
GROQ_API_KEY=your_groq_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your_s3_bucket_name
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
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |

### Ticket Routes

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/tickets` | Get all tickets | No |
| GET | `/api/tickets/:id` | Get ticket by UUID | No |
| POST | `/api/tickets` | Create a new ticket | Yes |
| PUT | `/api/tickets/:id` | Update ticket (status, priority, assignedTo) | No |
| DELETE | `/api/tickets/:id` | Delete a ticket | No |

---

## How It Works

### Ticket Creation Flow

```
User submits title + description + optional attachment
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
Confirmation email sent to user
        ↓
File attachment uploaded to AWS S3
Ticket metadata saved to AWS S3
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

## Email Routing Map

| Category | Team Email |
|---|---|
| Technical Support | tech@company.com |
| Billing | billing@company.com |
| Account Issues | accounts@company.com |
| Bug Report | engineering@company.com |
| Feature Request | product@company.com |
| Security Issues | security@company.com |
| Performance Issues | infra@company.com |
| Product Issues | support@company.com |
| Order/Delivery Issues | logistics@company.com |
| Payment & Refunds | finance@company.com |
| Data Privacy | legal@company.com |
| General Inquiry | helpdesk@company.com |

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `EMAIL_USER` | Gmail address used to send emails |
| `EMAIL_PASS` | Gmail App Password (not your Gmail login password) |
| `GROQ_API_KEY` | Groq API key for AI classification |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region (e.g. ap-south-1) |
| `AWS_BUCKET_NAME` | S3 bucket name |

---

## Production Notes

- Replace Gmail SMTP with **AWS SES** or **SendGrid** for production email delivery
- Replace `EMAIL_USER/EMAIL_PASS` with provider API keys
- Add role-based access control (RBAC) to restrict update/delete routes to admins only
- Use **HTTPS** in production (SSL/TLS)
- Store JWT secret as a minimum 32-character random string

---

## Author

**Hema Rushikesh Kalepu**
GitHub: [@rushi-0](https://github.com/rushi-0)

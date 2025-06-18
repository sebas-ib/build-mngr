# BuildManager

**BuildManager** is a web-based project management tool designed for contractors and construction professionals. It helps users manage active projects, keep track of updates, organize documentation, and collaborate with team members.

---

## Features

### Public Landing Page
- Responsive design with a clear introduction to the product
- Sections include: Header, Hero, Features, and Footer

### Authentication
- User sign-up and login via **AWS Cognito**

### Authenticated Dashboard
- Sidebar and navbar layout for intuitive navigation
- Available sections:
  - My Vault
  - Add New Job
  - Recently Applied
  - Analytics & Insights
  - Manage Resumes
  - Search Your Vault

### Project Pages
- Overview of all user projects
- Individual project views include:
  - Client Updates
  - Timeline
  - Invoices & Documents
  - Team & Access

### Planned Enhancements
- Project scheduling
- Data visualization and analytics
- Real-time collaboration tools
- AWS-native backend (API Gateway + Lambda)

---

## Tech Stack

| Category       | Technology           |
|----------------|----------------------|
| Frontend       | Next.js, Tailwind CSS |
| Backend (WIP)  | Flask (prototype), AWS Lambda (planned) |
| Authentication | AWS Cognito          |
| Database       | DynamoDB             |
| File Storage   | AWS S3               |
| Deployment     | Vercel / AWS Amplify (TBD) |

---

## Development Status

- Landing page: Complete
- Authentication: Integrated with Cognito
- Dashboard layout: Implemented
- Project CRUD: In progress (currently using Flask for prototyping)
- AWS backend integration: Planned
- Additional features: In design and early development

---

## Notes

This project is currently under active development. It is being built with scalability in mind and will continue evolving as new features are added.



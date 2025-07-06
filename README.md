# Staff Augmentation Platform

A comprehensive Angular-based staff augmentation platform with Node.js backend for connecting IT vendors with clients.

## Features

### For Vendors
- **Resource Management**: Add and manage IT resources with skills, experience, and availability
- **Opportunity Discovery**: Browse and apply to client requirements
- **Application Tracking**: Monitor application status and progress
- **User Management**: Manage organization users and permissions
- **Skill Management**: Submit skills for admin approval

### For Clients
- **Requirement Posting**: Post detailed job requirements with skills and budget
- **Resource Discovery**: Browse and filter available resources
- **Application Management**: Review and manage candidate applications
- **Status Tracking**: Track hiring progress from application to onboarding

## Architecture

The application follows a service-based architecture:

```
Frontend (Angular) → API Service → Node.js Backend → Mock Data/Database
```

- **Frontend**: Angular 12 with Tailwind CSS and Angular Feather icons
- **Backend**: Node.js with Express.js REST API
- **Data**: Mock JSON files (easily replaceable with database)
- **Authentication**: JWT-based authentication
- **State Management**: RxJS Observables with BehaviorSubjects

## Getting Started

### Prerequisites
- Node.js 14+ and npm
- Angular CLI 12+

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   # Server runs on http://localhost:3000
   ```

2. **Start the Frontend Application**
   ```bash
   npm start
   # Application runs on http://localhost:4200
   ```

### Demo Accounts

The application includes demo accounts for testing:

**Vendors:**
- Email: `vendor@techcorp.com` | Password: `demo123`
- Email: `vendor2@devstudio.com` | Password: `demo123`

**Clients:**
- Email: `client@innovate.com` | Password: `demo123`
- Email: `client2@startup.com` | Password: `demo123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create new resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Requirements
- `GET /api/requirements` - Get all requirements
- `POST /api/requirements` - Create new requirement
- `PATCH /api/requirements/:id/status` - Update requirement status

### Applications
- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create new application
- `PATCH /api/applications/:id/status` - Update application status

### Vendor Management
- `GET /api/vendor-users` - Get vendor users
- `POST /api/vendor-users` - Create vendor user
- `PATCH /api/vendor-users/:id/status` - Update user status

- `GET /api/vendor-skills` - Get vendor skills
- `POST /api/vendor-skills` - Create vendor skill
- `PATCH /api/vendor-skills/:id/status` - Update skill status

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/          # Angular components
│   │   ├── services/           # Angular services
│   │   ├── models/             # TypeScript interfaces
│   │   └── guards/             # Route guards
│   ├── assets/
│   │   └── mock-data/          # Mock JSON data files
│   └── environments/           # Environment configurations
├── backend/
│   ├── routes/                 # Express route handlers
│   ├── data/                   # Mock data files
│   └── server.js              # Express server setup
└── README.md
```

## Development Mode

The application is configured to use mock data by default. To switch between mock data and real API:

1. **Frontend**: Update `environment.ts`
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api',
     useMockData: true // Set to false for real API calls
   };
   ```

2. **Backend**: The backend serves mock data from JSON files in the `data/` directory

## Production Deployment

1. **Build Frontend**
   ```bash
   npm run build
   ```

2. **Configure Environment**
   - Update `environment.prod.ts` with production API URL
   - Set `useMockData: false` for production
   - Configure backend environment variables

3. **Deploy Backend**
   - Deploy Node.js application to your preferred platform
   - Replace mock data with actual database integration
   - Configure proper authentication and security

## Security Features

- JWT-based authentication
- Request rate limiting
- CORS configuration
- Input validation with express-validator
- Security headers with Helmet.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
# QuickCourt - Sports Facility Booking Application

A modern, full-stack sports facility booking application built with Next.js, Express, and MongoDB. This project was developed for the Odoo Hackathon 2025 - Problem Statement 1.

## 🏆 Features

- **User Authentication & Authorization**: Secure user registration, login, and role-based access control
- **Facility Management**: Comprehensive facility listing with search, filtering, and detailed information
- **Sport Categories**: Support for multiple sports (Badminton, Tennis, Basketball, etc.)
- **Court Booking System**: Advanced booking with conflict detection and availability checking
- **User Profiles**: Personalized user experience with preferences and booking history
- **Admin Panel**: Facility and user management for administrators
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** with App Router
- **React 19** with Hooks
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### Backend

- **Node.js** with **Express 5**
- **MongoDB** with **Mongoose ODM**
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd odoo-11
   ```

2. **Install Frontend Dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**

   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Setup**

   ```bash
   # In backend directory
   cp config.env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB**

   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Run the Application**

   **Terminal 1 - Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
odoo-11/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable components
│   ├── lib/                 # Utility functions
│   └── public/              # Static assets
├── backend/                 # Express.js backend API
│   ├── models/              # MongoDB models
│   ├── routes/              # API route handlers
│   ├── middleware/          # Custom middleware
│   └── server.js            # Main server file
└── README.md                # This file
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Password reset

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update preferences
- `GET /api/users/bookings` - Get user bookings

### Facilities

- `GET /api/facilities` - List facilities with filtering
- `GET /api/facilities/:id` - Get facility details
- `POST /api/facilities` - Create facility (admin/owner)
- `PUT /api/facilities/:id` - Update facility
- `DELETE /api/facilities/:id` - Delete facility

### Sports

- `GET /api/sports` - List sports
- `GET /api/sports/:id` - Get sport details
- `POST /api/sports` - Create sport (admin)
- `PUT /api/sports/:id` - Update sport
- `DELETE /api/sports/:id` - Delete sport

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

## 🗄️ Database Models

### User

- Personal information (name, email, phone)
- Authentication (password, JWT tokens)
- Role-based access (user, admin, facility_owner)
- Preferences and favorites

### Sport

- Sport details (name, description, category)
- Equipment and rules
- Player limits and popularity

### Facility

- Facility information (name, description, address)
- Sports and courts available
- Operating hours and policies
- Ratings and reviews

### Booking

- Booking details (date, time, duration)
- User and facility references
- Payment and status tracking
- Conflict detection

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/quickcourt

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### MongoDB Setup

1. Install MongoDB on your system
2. Create a database named `quickcourt`
3. The application will automatically create collections and indexes

## 🎨 Customization

### Adding New Sports

1. Add sport data to the database
2. Update frontend sport icons and categories
3. Modify facility sports configuration

### Styling

- Modify `frontend/app/globals.css` for global styles
- Use Tailwind CSS classes for component styling
- Customize color scheme in Tailwind config

### Features

- Implement payment gateway integration
- Add email notifications
- Implement real-time availability updates
- Add mobile app support

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm run test
```

## 📱 Mobile Responsiveness

The application is fully responsive and works on:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure build settings
3. Deploy automatically on push

### Backend (Railway/Heroku)

1. Set environment variables
2. Configure MongoDB connection
3. Deploy using Git integration

### Database (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Configure network access
3. Update connection string

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is developed for the Odoo Hackathon 2025. All rights reserved.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered facility recommendations
- [ ] Social features and reviews
- [ ] Multi-language support
- [ ] Advanced booking algorithms

---

**Developed with ❤️ for the Odoo Hackathon 2025**

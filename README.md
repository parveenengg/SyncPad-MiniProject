# 📝 SyncPad - Collaborative Note-Taking Application

A modern, secure, and scalable collaborative note-taking application built with Node.js, Express, and MongoDB. Perfect for personal use, team collaboration, and as a foundation for SaaS development.

## 🚀 Features

### Core Functionality
- **📝 Note Management**: Create, edit, and organize personal notes
- **🤝 Real-time Collaboration**: Share notes with others and collaborate in real-time
- **🔗 Public Sharing**: Generate shareable links for public note access
- **🔐 Security**: Optional note encryption with passcodes for sensitive content
- **👥 User Management**: Secure user registration and authentication
- **⚙️ Admin Dashboard**: Comprehensive admin interface for system management

### Technical Features
- **🛡️ Security**: Helmet.js security headers, rate limiting, input sanitization
- **📊 Monitoring**: Health checks, logging, and performance monitoring
- **🐳 Containerization**: Docker support for easy deployment
- **☁️ Cloud Ready**: Deploy to Heroku, Vercel, or any cloud platform
- **📱 Responsive**: Mobile-first design that works on all devices

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templating, responsive CSS
- **Authentication**: Session-based with bcrypt password hashing
- **Security**: Helmet.js, rate limiting, input sanitization
- **Deployment**: Docker, Heroku, Vercel ready

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/syncpad.git
   cd syncpad
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Access the application**
   - Open http://localhost:3330
   - Create your first account
   - Start taking notes!

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/sync-pad

# Session Security
SESSION_SECRET=your-super-secret-session-key

# Server
PORT=3330
NODE_ENV=development
```

### Production Configuration

For production deployment:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sync-pad
SESSION_SECRET=your-production-session-secret
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start the application with MongoDB
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Using Docker

```bash
# Build the image
docker build -t syncpad .

# Run the container
docker run -p 3330:3330 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/sync-pad \
  -e SESSION_SECRET=your-session-secret \
  syncpad
```

## ☁️ Cloud Deployment

### Heroku Deployment

1. **Install Heroku CLI**
2. **Create Heroku app**
   ```bash
   heroku create your-syncpad-app
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-production-secret
   heroku config:set MONGODB_URI=your-mongodb-uri
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Set environment variables in Vercel dashboard**
3. **Deploy**
   ```bash
   vercel --prod
   ```

## 📊 API Endpoints

### Health & Status
- `GET /health` - Health check endpoint
- `GET /api/status` - API status information

### Authentication
- `GET /login` - Login page
- `POST /login` - User login
- `GET /signup` - Registration page
- `POST /signup` - User registration
- `GET /logout` - User logout

### Notes
- `GET /home` - User dashboard
- `GET /create` - Create note page
- `POST /create` - Create new note
- `GET /note/:id` - View note
- `GET /edit/:id` - Edit note page
- `POST /edit/:id` - Update note
- `DELETE /note/:id` - Delete note

### Admin
- `GET /admin` - Admin login
- `GET /admin/home` - Admin dashboard
- `GET /admin/users` - User management

## 🔒 Security Features

- **Helmet.js**: Security headers and CSP
- **Rate Limiting**: API request limiting
- **Input Sanitization**: XSS protection
- **Session Security**: Secure cookies and session management
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Cross-origin request security

## 📱 Mobile Support

- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Progressive Web App**: Can be installed on mobile devices

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Performance

- **Compression**: Gzip compression for faster loading
- **Caching**: Static file caching
- **Database Indexing**: Optimized MongoDB queries
- **Rate Limiting**: Prevents abuse

## 🛠️ Development

### Project Structure
```
syncpad/
├── app.js                 # Main application file
├── config/               # Database configuration
├── controllers/          # Route controllers
├── middleware/           # Custom middleware
├── models/              # Database models
├── routes/              # Route definitions
├── views/               # EJS templates
├── public/              # Static assets
├── utils/               # Utility functions
└── logs/                # Application logs
```

### Adding New Features

1. **Create controller** in `controllers/`
2. **Define routes** in `routes/`
3. **Add views** in `views/`
4. **Update models** if needed
5. **Test thoroughly**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication
- [x] Note management
- [x] Note sharing
- [x] Admin dashboard

### Phase 2: Enhanced Features
- [ ] Real-time collaboration
- [ ] File uploads
- [ ] Note templates
- [ ] Advanced search

### Phase 3: SaaS Features
- [ ] Team workspaces
- [ ] Subscription billing
- [ ] API access
- [ ] Mobile app

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create a GitHub issue
- **Email**: Contact the maintainer

## 🙏 Acknowledgments

- Express.js community
- MongoDB team
- Open source contributors

---

**Built with ❤️ for learning and collaboration**
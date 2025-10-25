# SyncPad - Mini Project

A collaborative note-taking application built with Node.js, Express, MongoDB, and EJS. This mini project demonstrates full-stack web development with authentication, CRUD operations, and note encryption.

## 🚀 Features

- **User Authentication**: Secure login/signup with session management
- **Note Management**: Create, read, update, and delete notes
- **Note Encryption**: Encrypt sensitive notes with passcodes
- **Note Sharing**: Share notes with unique public links
- **Responsive Design**: Mobile-first responsive UI
- **Real-time Collaboration**: Multiple users can work on shared notes

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: EJS templating, Tailwind CSS
- **Authentication**: Express Sessions
- **Security**: Rate limiting, input sanitization, XSS protection

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/SyncPad-MiniProject.git
   cd SyncPad-MiniProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sync-pad
   SESSION_SECRET=your-super-secret-session-key
   PORT=3330
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community@8.0
   
   # Or start manually
   mongod --dbpath /opt/homebrew/var/mongodb
   ```

5. **Run the application**
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser and go to: `http://localhost:3330`

## 🎯 Usage

### Getting Started
1. **Create an Account**: Click "Login" → "Create New Account"
2. **Login**: Use your credentials to access the dashboard
3. **Create Notes**: Click "Create" to add new notes
4. **Encrypt Notes**: Check "Encrypt this file" and enter a passcode
5. **Share Notes**: Check "Shareable file?" to make notes public

### Features Guide

#### Creating Notes
- **Simple Notes**: Just add title and content
- **Encrypted Notes**: Check "Encrypt this file" and set a passcode
- **Shared Notes**: Check "Shareable file?" to make them public

#### Managing Notes
- **View**: Click on any note to view it
- **Edit**: Click edit button to modify notes
- **Delete**: Click delete button to remove notes
- **Share**: Use the share link for public notes

## 📁 Project Structure

```
SyncPad-MiniProject/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── noteController.js     # Note CRUD operations
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── Note.js              # Note data model
│   └── User.js               # User data model
├── public/
│   └── css/                 # Stylesheets
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── noteRoutes.js        # Note routes
├── views/                   # EJS templates
├── app.js                   # Main application file
└── package.json
```

## 🔒 Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: Protects against XSS attacks
- **Session Security**: Secure session management
- **Password Hashing**: bcrypt for password security
- **CSRF Protection**: SameSite cookie settings

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect to GitHub repository
4. Deploy automatically

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Parveen Kumar**
- GitHub: [@your-username](https://github.com/your-username)
- Email: parveenmakvana56@gmail.com

## 🙏 Acknowledgments

- Express.js community for excellent documentation
- MongoDB for the robust database solution
- Tailwind CSS for beautiful styling
- All contributors and testers

---

**Note**: This is a mini project for learning purposes. For production use, please implement additional security measures and testing.
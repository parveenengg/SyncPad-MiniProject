# SyncPad Mini Project - Deployment Guide

## Project Overview
This is a mini-scale collaborative note-taking application designed for 200-500 users, optimized for GitHub Pages (frontend) and Heroku/Vercel (backend) deployment.

## Architecture
- **Frontend**: Static files served via GitHub Pages
- **Backend**: Node.js/Express API hosted on Heroku or Vercel
- **Database**: MongoDB Atlas (cloud) or local MongoDB
- **Scale**: Optimized for 200-500 users

## Deployment Steps

### 1. Backend Deployment (Heroku)

1. **Prepare for Heroku:**
   ```bash
   # Create Procfile
   echo "web: node app.js" > Procfile
   
   # Update package.json scripts
   npm install --save-dev
   ```

2. **Environment Variables:**
   ```bash
   # Set in Heroku dashboard or CLI
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set NODE_ENV=production
   ```

3. **Deploy to Heroku:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### 2. Backend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "app.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### 3. Frontend Deployment (GitHub Pages)

1. **Update API endpoints in frontend:**
   - Replace localhost URLs with your deployed backend URL
   - Update fetch requests to point to production API

2. **Deploy to GitHub Pages:**
   ```bash
   # Push to GitHub repository
   git add .
   git commit -m "Deploy frontend"
   git push origin main
   
   # Enable GitHub Pages in repository settings
   # Point to /docs folder or main branch
   ```

### 4. Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas cluster:**
   - Sign up at https://cloud.mongodb.com
   - Create a free cluster
   - Get connection string

2. **Update environment variables:**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sync-pad
   ```

## Performance Optimizations for Mini Scale

### Database Optimizations
- Added indexes for common queries
- Optimized for 200-500 users
- Connection pooling configured
- Query optimization for note retrieval

### Application Optimizations
- Rate limiting implemented
- Session management optimized
- Input validation and sanitization
- Error handling and logging

### Scaling Considerations
- **Current Limit**: 200-500 users
- **Database**: MongoDB Atlas free tier (512MB)
- **Backend**: Heroku free tier or Vercel hobby
- **Frontend**: GitHub Pages (unlimited)

## Environment Variables

### Required for Production
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sync-pad
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=production
PORT=3330
```

### Optional
```bash
# For HTTPS in production
SECURE_COOKIES=true
```

## Monitoring and Maintenance

### Performance Monitoring
- Monitor database query performance
- Track user registration and note creation rates
- Monitor memory usage and response times

### Maintenance Tasks
- Regular database backups
- Monitor error logs
- Update dependencies regularly
- Clean up old sessions

## Security Considerations

### Implemented Security Features
- Rate limiting (100 requests/15min, 5 auth requests/15min)
- Input sanitization and validation
- Session security with httpOnly cookies
- CSRF protection
- Password hashing with bcrypt
- SQL injection prevention

### Additional Recommendations
- Use HTTPS in production
- Regular security updates
- Monitor for suspicious activity
- Implement user activity logging

## Troubleshooting

### Common Issues
1. **Database Connection**: Check MongoDB Atlas connection string
2. **Session Issues**: Verify SESSION_SECRET is set
3. **CORS Issues**: Configure CORS for frontend-backend communication
4. **Rate Limiting**: Adjust limits based on usage patterns

### Performance Issues
- Monitor database indexes usage
- Check for slow queries
- Optimize note retrieval queries
- Consider caching for frequently accessed data

## Cost Estimation (Monthly)

### Free Tier Limits
- **MongoDB Atlas**: 512MB storage, 100 connections
- **Heroku**: 550-1000 dyno hours
- **Vercel**: 100GB bandwidth, 100 serverless functions
- **GitHub Pages**: Unlimited bandwidth

### Expected Usage for 200-500 Users
- **Database**: ~50-100MB storage
- **Bandwidth**: ~1-5GB/month
- **Compute**: Well within free tier limits

## Support and Documentation

For issues or questions:
1. Check application logs
2. Monitor database performance
3. Review error handling
4. Contact development team

This deployment guide ensures the application runs efficiently within the specified mini-scale requirements.

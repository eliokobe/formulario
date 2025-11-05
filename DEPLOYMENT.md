# Contacto - Deployment Guide

## 🚀 Deploying to DigitalOcean App Platform

### Prerequisites

1. **DigitalOcean Account**: Create an account at [digitalocean.com](https://digitalocean.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Prepare your Airtable and UploadThing credentials

### Method 1: Using DigitalOcean Dashboard (Recommended)

1. **Create New App**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository (`eliokobe/contacto`)

2. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Environment**: Node.js
   - **Port**: 3000

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   AIRTABLE_TOKEN=your_token_here
   AIRTABLE_BASE_ID=your_base_id_here
   AIRTABLE_TABLE_NAME=your_table_name_here
   AIRTABLE_TABLE_CLIENTES=your_clients_table_here
   UPLOADTHING_SECRET=your_secret_here
   UPLOADTHING_APP_ID=your_app_id_here
   ```

4. **Deploy**
   - Review settings and click "Create Resources"
   - Wait for deployment to complete (~5-10 minutes)

### Method 2: Using App Spec (Advanced)

1. Use the provided `.do/app.yaml` file
2. Update environment variables in the file
3. Deploy using doctl CLI:
   ```bash
   doctl apps create .do/app.yaml
   ```

### Method 3: Using Deployment Script

1. Install doctl CLI
2. Authenticate: `doctl auth init`
3. Run deployment script: `./deploy.sh`

## 📋 Environment Variables Setup

### Airtable Setup
1. Go to [Airtable Developer Hub](https://airtable.com/developers/web/api/introduction)
2. Create a Personal Access Token
3. Get your Base ID from your Airtable URL
4. Note your table names for bookings and clients

### UploadThing Setup (for file uploads)
1. Go to [UploadThing](https://uploadthing.com)
2. Create an account and new app
3. Get your App ID and Secret from dashboard

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Monitoring

- **Health Check**: `https://your-app.ondigitalocean.app/api/health`
- **App Logs**: Available in DigitalOcean dashboard
- **Performance**: Monitor via DigitalOcean metrics

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**: Check package.json dependencies
2. **Environment Variables**: Ensure all required vars are set
3. **API Routes**: Verify Airtable connection
4. **File Uploads**: Check UploadThing configuration

### Debug Commands

```bash
# Check app status
doctl apps list

# View logs
doctl apps logs <APP_ID>

# Update app
doctl apps update <APP_ID> --spec .do/app.yaml
```

## 📱 Features

- ✅ **Booking System**: Schedule discovery calls
- ✅ **Client Onboarding**: Multi-step form with file uploads
- ✅ **Airtable Integration**: Automatic data storage
- ✅ **Responsive Design**: Works on all devices
- ✅ **Spanish Localization**: Full Spanish interface

## 🔒 Security

- HTTPS enforced
- Security headers configured
- Environment variables encrypted
- File upload validation

## 📈 Performance

- Optimized Next.js build
- Image optimization
- Compression enabled
- CDN ready

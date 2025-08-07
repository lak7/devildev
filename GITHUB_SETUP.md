# GitHub OAuth Integration Setup

This document explains how to set up GitHub OAuth integration for your DevilDev application.

## Required Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# GitHub OAuth Integration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL
```

## GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: DevilDev (or your app name)
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/github/callback`
4. Click "Register application"
5. Copy the Client ID and Client Secret to your environment variables

## Database Migration

You'll need to run a database migration to add the GitHub fields to your User model:

```bash
npx prisma migrate dev --name add_github_fields
```

## Features Implemented

- **Connect GitHub Button**: Added to the sidebar above Community link
- **OAuth Flow**: Users can connect their GitHub account
- **Connection Status**: Shows if GitHub is connected and username
- **Disconnect Option**: Users can disconnect their GitHub account
- **Security**: Access tokens are stored (should be encrypted in production)
- **User Data**: Stores GitHub ID, username, email, and avatar URL

## API Endpoints

- `GET /api/github/auth` - Initiates GitHub OAuth flow
- `GET /api/github/callback` - Handles OAuth callback
- `GET /api/github/status` - Gets GitHub connection status
- `DELETE /api/github/status` - Disconnects GitHub account

## Server Actions

- `getGitHubStatus()` - Get current GitHub connection status
- `disconnectGitHub()` - Disconnect GitHub account
- `initiateGitHubConnection()` - Start GitHub connection flow

## Usage

1. User clicks "Connect Github" button in sidebar
2. Redirected to GitHub OAuth flow
3. After authorization, user is redirected back with connection confirmed
4. Button shows connection status and allows disconnection
5. GitHub user data is stored in database for future use

## Security Notes

- State parameter used to prevent CSRF attacks
- Access tokens should be encrypted before storing in production
- Consider token refresh mechanism for long-term usage
- Validate all GitHub API responses

## Next Steps

You can now use the GitHub user data and access tokens to:
- Access user's GitHub repositories
- Create/manage repositories
- Access GitHub API on behalf of the user
- Import existing projects from GitHub

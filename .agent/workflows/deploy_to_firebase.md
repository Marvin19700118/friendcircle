---
description: How to deploy the application to Firebase Hosting
---

# Deploy to Firebase Hosting

This workflow guides you through deploying your React application to Google Firebase Hosting.

## Prerequisites

1.  **Google Account**: You need a Google account.
2.  **Firebase Project**: You need to create a project in the [Firebase Console](https://console.firebase.google.com/).

## Steps

### 1. Login to Firebase
Run the following command to log in to your Google account. This will open a browser window.
```bash
npx firebase-tools login
```

### 2. Initialize Firebase
Initialize the project. This will create `firebase.json` and `.firebaserc`.
```bash
npx firebase-tools init hosting
```
**Configuration Choices:**
- **Project**: Select "Use an existing project" (create one in console first) or "Create a new project".
- **Public directory**: Type `dist`
- **Configure as a single-page app (rewrite all urls to /index.html)?**: Type `Yes`
- **Set up automatic builds and deploys with GitHub?**: Type `No` (we can do this later)
- **File dist/index.html already exists. Overwrite?**: Type `No`

### 3. Build the Project
Ensure you have the latest version of your app built.
```bash
npm run build
```

### 4. Deploy
Upload your files to Firebase.
```bash
npx firebase-tools deploy
```

### 5. Access your Site
The command output will provide a "Hosting URL" (e.g., `https://your-project.web.app`). Use this link to view your site.

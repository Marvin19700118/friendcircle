---
description: How to deploy the application to GitHub Pages
---

# Deploy to GitHub Pages

This project is configured to automatically deploy to GitHub Pages whenever you push changes to the `main` or `master` branch.

## Prerequisites

1.  **GitHub Repository**: The project must be hosted on GitHub.
    *   Current Remote: `https://github.com/Marvin19700118/friendcircle.git`
2.  **Configuration**:
    *   `vite.config.ts`: Must have `base: '/friendcircle/'` set (Already Done).
    *   `.github/workflows/deploy.yml`: Must exist to handle the build and deploy process (Already Done).

## Steps to Deploy

1.  **Commit your changes**:
    Save all your current work and commit it.
    ```bash
    git add .
    git commit -m "Configure deployment settings"
    ```

2.  **Push to GitHub**:
    Push your code to the remote repository.
    ```bash
    // turbo
    git push origin main
    ```

3.  **Monitor Deployment**:
    *   Go to your GitHub repository: [https://github.com/Marvin19700118/friendcircle/actions](https://github.com/Marvin19700118/friendcircle/actions)
    *   You should see a workflow run named "Deploy to GitHub Pages".
    *   Wait for it to complete (usually 1-2 minutes).

4.  **Access your Website**:
    *   Once the workflow finishes, your site will be live at:
    *   [https://Marvin19700118.github.io/friendcircle/](https://Marvin19700118.github.io/friendcircle/)

## Troubleshooting

*   **404 Not Found**: Ensure the `base` in `vite.config.ts` matches your repository name exactly.
*   **Permissions**: Ensure your repository Settings > Actions > General > Workflow permissions are set to "Read and write permissions".

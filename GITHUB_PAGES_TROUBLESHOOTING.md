# GitHub Pages Deployment Troubleshooting

If you're encountering errors when deploying to GitHub Pages, follow these steps to resolve common issues:

## Error: "Failed to create deployment" or "Cannot find any run"

This typically happens when GitHub Pages isn't properly configured or when there are permission issues. Follow these steps:

### 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "Pages" section in the sidebar
4. Under "Build and deployment":
   - Source: Select "GitHub Actions" 
   - This is critical - GitHub needs to know you're using Actions for deployment

### 2. Check Repository Visibility

- GitHub Pages works differently based on whether your repository is public or private:
  - **Public repositories**: Pages are publicly available
  - **Private repositories**: Pages are only available with GitHub Pro or higher plans

### 3. Verify Repository Name Matches Homepage URL

In your `package.json`, ensure the homepage URL matches your GitHub username and repository name exactly:

```json
"homepage": "https://ggulati.github.io/Warlord-Mendicant/"
```

- Repository names are case-sensitive in URLs
- If your repository name contains spaces, they should be replaced with hyphens

### 4. Check Branch Name Configuration

- Ensure your workflow file targets the correct branch
- In your case, the repository uses the `master` branch, not `main`

### 5. Update GitHub Actions Dependencies

We've updated your workflow file to use the latest versions of the actions:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/configure-pages@v4`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`

### 6. Verify Permissions

The workflow file should have these permissions:
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### 7. Manual Trigger After Configuration

After making these changes:
1. Push the changes to your repository
2. Go to the "Actions" tab
3. Select the "Deploy to GitHub Pages" workflow
4. Click "Run workflow" and select your branch
5. This manual trigger often resolves cached permission issues

## First Deployment May Take Longer

The first deployment to GitHub Pages may take longer than subsequent ones as GitHub sets up the pages environment.

If you continue to encounter issues, check the detailed error logs in the GitHub Actions tab and ensure your repository is properly configured for GitHub Pages. 
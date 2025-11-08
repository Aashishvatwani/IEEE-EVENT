# IEEE TechSymphony Frontend

## Environment Setup

### Environment Variables

Create a `.env` file in the `frontend/vite-project` directory with the following content:

```env
VITE_API_BASE_URL=https://nsoc-event.onrender.com/api
```

For local development, use:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Important Notes

- All API calls use the `VITE_API_BASE_URL` environment variable
- The `.env` file is gitignored for security
- Use `.env.example` as a template for new environments
- Restart the dev server after changing environment variables

## Deployment to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project directory:
   ```bash
   cd frontend/vite-project
   vercel
   ```

4. Set environment variables in Vercel:
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Environment Variables
   - Add `VITE_API_BASE_URL` with value `https://nsoc-event.onrender.com/api`

5. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend/vite-project`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://nsoc-event.onrender.com/api`
6. Click "Deploy"

### Environment Variables

Make sure to add the following environment variable in Vercel:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://nsoc-event.onrender.com/api` |

### Post-Deployment

After deployment, you may need to:
1. Update CORS settings in your backend to include the Vercel deployment URL
2. Test all API endpoints to ensure they're working correctly
3. Update any hardcoded URLs if present
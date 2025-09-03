# Job Tracker Chrome Extension - Quick Setup

## Current Issue: API Configuration

Your extension is currently showing the error **"Unexpected token '<', "<!doctype "... is not valid JSON"** because the GraphQL API endpoint is not configured correctly.

## Quick Fix

### Option 1: Configure Your Real API (Recommended)

1. Open `src/background/service-worker.ts`
2. Find this line (around line 139):
   ```typescript
   const API_ENDPOINT = "https://your-api-domain.com/graphql";
   ```
3. Replace it with your actual GraphQL API endpoint:
   ```typescript
   const API_ENDPOINT = "https://your-real-api.com/graphql";
   ```

### Option 2: Use Mock Data for Testing

If you don't have a GraphQL server ready yet, you can temporarily add mock functionality:

1. Open `src/background/service-worker.ts`
2. Find the `handleGraphQLRequest` function (around line 176)
3. Add this mock code at the beginning of the function:

```typescript
async function handleGraphQLRequest(message: GraphQLMessage, sendResponse: (response: unknown) => void) {
  const requestId = message.requestId || generateRequestId();

  // TEMPORARY: Mock successful responses for development
  if (message.query.includes('createJobApplication')) {
    console.log(`🔧 [${requestId}] MOCK: Creating job application`, message.variables);

    const mockJobApplication = {
      id: `mock_${Date.now()}`,
      name: message.variables?.input?.name || 'Test Name',
      surname: message.variables?.input?.surname || 'Test Surname',
      position: message.variables?.input?.position || 'Software Developer',
      company: message.variables?.input?.company || 'Test Company',
      status: 'APPLIED',
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      sendResponse({
        success: true,
        data: { createJobApplication: mockJobApplication },
        requestId,
        timestamp: message.timestamp
      });
    }, 500);
    return;
  }

  // Continue with normal code...
  try {
    // ... rest of the function
```

### Option 3: Use a Public Test GraphQL API

For testing purposes only, you can use a public GraphQL endpoint:

```typescript
const API_ENDPOINT = "https://api.spacex.land/graphql"; // SpaceX API
// or
const API_ENDPOINT = "https://countries.trevorblades.com/graphql"; // Countries API
```

**Note:** These endpoints won't have your job application mutations, so you'll need to use Option 2 for full functionality.

## Next Steps

1. Fix the API endpoint using one of the options above
2. Rebuild the extension: `npm run build`
3. Reload the extension in Chrome
4. Test the form submission

## Real API Requirements

Your GraphQL server needs to support:
- Job application mutations (createJobApplication)
- CORS configuration for Chrome extensions
- Cookie-based authentication (optional)

See `SERVER-SETUP.md` for detailed backend configuration instructions.

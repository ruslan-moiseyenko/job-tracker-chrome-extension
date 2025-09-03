# GraphQL Server CORS Configuration for Chrome Extensions

## 🔧 What I Fixed
1. **Added HTTP localhost permission** in manifest.json: `"http://localhost:*/*"`
2. **Enhanced error logging** to see exactly what's happening with requests
3. **Better error messages** to help debug CORS and network issues

## 🧪 Testing Steps

1. **Reload Extension**: Go to `chrome://extensions/` and reload your extension
2. **Open Browser Console**: Press F12 → Console tab
3. **Open Extension Console**:
   - Go to `chrome://extensions/`
   - Find your extension
   - Click "service worker" link (this opens the background script console)
4. **Test Form Submission** and check both consoles for logs

## 📋 Expected Console Output

In the **background service worker console**, you should see:
```
📤 [requestId] Making GraphQL request to: http://localhost:4000/graphql
📤 [requestId] Query: mutation CreateJobApplication($input: JobApplicationInput!)...
📤 [requestId] Variables: {input: {name: "...", surname: "..."}}
```

## 🚨 Possible Issues & Solutions

### Issue 1: CORS Error
If you see "CORS policy" errors, your GraphQL server needs to allow Chrome extension requests.

**For Express + Apollo Server**, add this CORS configuration:
```javascript
const cors = require('cors');

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Chrome extensions, etc.)
    if (!origin) return callback(null, true);

    // Allow Chrome extensions
    if (origin && origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }

    // Add your other allowed origins here
    callback(null, true); // For development, allow all
  },
  credentials: true // Important for cookies
}));
```

### Issue 2: Network/Connection Error
If you see "Failed to fetch" or connection errors:
1. Verify your GraphQL server is running on `http://localhost:4000/graphql`
2. Test the endpoint in a browser or Postman
3. Check if the server is binding to `0.0.0.0` not just `127.0.0.1`

### Issue 3: GraphQL Schema Issues
If you get "Bad Request (400)" errors, check that your server supports the mutations/queries your extension is sending.

## 📊 Network Tab Visibility

**Chrome Extension requests from background scripts** may not always show up in the webpage's Network tab. To see extension network activity:
1. Open `chrome://extensions/`
2. Click "service worker" under your extension
3. In the DevTools that opens, go to Network tab
4. This shows background script network activity

## 🔄 Next Steps

1. Reload your extension
2. Test form submission
3. Check both consoles for detailed error messages
4. If still having issues, share the console output for further debugging

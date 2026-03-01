# Authentication & File Sharing Implementation Guide

## 🔐 Part 1: Strict Authentication Enforcement

### Overview
Implemented production-ready authentication system with backend token verification, protected routes, and automatic logout on token expiration.

### Backend Changes

#### 1. Token Verification Endpoint
**File**: `entwined-server/controllers/authController.js`
- Added `verifyToken` function that:
  - Validates JWT token with backend
  - Returns user data if valid
  - Handles expired and invalid tokens gracefully
  - Returns structured response with `valid` flag

**Endpoint**: `GET /api/auth/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "valid": true,
    "user": {
      "_id": "...",
      "username": "...",
      "email": "...",
      "avatar": "..."
    }
  }
  ```

#### 2. Updated Auth Routes
**File**: `entwined-server/routes/authRoutes.js`
- Added `/verify` route for token validation

### Frontend Changes

#### 1. ProtectedRoute Component
**File**: `entwined-web/src/components/ProtectedRoute.jsx`
- **New component** that:
  - Verifies token with backend before rendering
  - Shows loading state during verification
  - Redirects to login if unauthorized
  - Prevents access to protected routes without valid token

#### 2. Enhanced AuthContext
**File**: `entwined-web/src/contexts/AuthContext.jsx`
- Updated `verifyAndFetchUser()` to call backend `/api/auth/verify`
- Properly handles token expiration
- Auto-logout on invalid tokens
- Fetches complete user data from backend

#### 3. API Response Interceptor
**File**: `entwined-web/src/api/api.js`
- Added response interceptor for 401 errors
- Automatically logs out user on token expiration
- Redirects to login page

#### 4. Updated Routing
**File**: `entwined-web/src/main.jsx`
- Wrapped `/dashboard` route with `ProtectedRoute`
- Ensures all protected routes require authentication

### Security Features

✅ **Backend Token Verification**: All protected routes verify tokens server-side
✅ **Automatic Logout**: Expired/invalid tokens trigger auto-logout
✅ **Route Protection**: Cannot access protected routes without valid token
✅ **Persistent Auth**: Valid tokens persist across page refreshes
✅ **401 Handling**: API interceptor handles unauthorized responses

### Usage

```jsx
// Protected routes automatically verify tokens
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 📚 Part 2: File Sharing in Chat

### Overview
Added support for sharing PDF, EPUB files, and images in chat conversations with secure upload, preview, and download functionality.

### Backend Changes

#### 1. Updated Message Model
**File**: `entwined-server/models/Message.js`
- Added fields:
  - `fileUrl`: String (URL to uploaded file)
  - `fileType`: Enum ["pdf", "epub", "image", null]
  - `fileName`: String (original filename)
  - `fileSize`: Number (file size in bytes)

#### 2. Enhanced File Upload Configuration
**File**: `entwined-server/routes/chatRoutes.js`
- **Separate storage** for images and files:
  - Images: `uploads/images/`
  - Files: `uploads/files/`
- **File validation**:
  - Images: JPEG, JPG, PNG, GIF, WebP (10MB limit)
  - Files: PDF, EPUB (50MB limit)
- **MIME type validation**:
  - Validates both extension and MIME type
  - Prevents arbitrary file uploads
  - Handles edge cases (application/octet-stream)

#### 3. Updated Message Endpoint
**File**: `entwined-server/server.js`
- Enhanced `/api/chat/message` endpoint:
  - Handles both images and files
  - Detects file type automatically
  - Stores file metadata
  - Returns proper file URLs

### Frontend Changes

#### 1. Enhanced Chat Component
**File**: `entwined-web/src/components/Chat.jsx`

**New Features**:
- **File Selection Handler**: Validates file type and size before upload
- **File Preview**: Shows preview before sending (images show thumbnail, PDF/EPUB show icon)
- **Upload Progress**: Loading indicator during upload
- **File Display**: Shows file cards with icon, name, and size
- **Download Functionality**: Click-to-download files

**State Management**:
- `previewFile`: Stores selected file for preview
- `uploading`: Tracks upload state

**Functions Added**:
- `handleFileSelect()`: Validates and previews selected file
- `handleFileUpload()`: Uploads file to server
- `cancelPreview()`: Cancels file preview
- `formatFileSize()`: Formats bytes to readable size
- `downloadFile()`: Downloads file from server

#### 2. Updated Chat UI
**File**: `entwined-web/src/styles/Chat.css`

**New Styles**:
- `.file-upload-btn`: File upload button styling
- `.file-preview`: Preview container styling
- `.message-file`: File message card styling
- `.file-icon`, `.file-info`, `.file-name`, `.file-size`: File display components
- `.file-preview-actions`: Preview action buttons

**Features**:
- Dark-themed file cards
- Hover effects
- Responsive design
- Loading states

### File Upload Flow

1. **User selects file** → `handleFileSelect()`
2. **Validation**:
   - File type check (images, PDF, EPUB)
   - File size check (50MB limit)
3. **Preview shown**:
   - Images: Thumbnail preview
   - PDF/EPUB: Icon with file info
4. **User confirms** → `handleFileUpload()`
5. **File uploaded** → Message created with file metadata
6. **Real-time update** → Socket.io emits to all participants

### File Display

**In Messages**:
- **Images**: Displayed inline with thumbnail
- **PDF/EPUB**: File card with:
  - Icon (📄 for PDF, 📚 for EPUB)
  - File name
  - File size
  - Download indicator
- **Click to download**: Opens file in new tab or downloads

### Security Features

✅ **File Type Validation**: Only allows images, PDF, and EPUB
✅ **MIME Type Checking**: Validates both extension and MIME type
✅ **File Size Limits**: 10MB for images, 50MB for files
✅ **JWT Protection**: All upload endpoints require authentication
✅ **Friend Verification**: Only friends can send files (enforced by existing conversation logic)
✅ **Secure Storage**: Files stored outside MongoDB (filesystem)

### Directory Structure

```
entwined-server/
├── uploads/
│   ├── images/     # Image files (JPEG, PNG, GIF, WebP)
│   └── files/      # Document files (PDF, EPUB)
```

### API Endpoints

**Upload Message with File**:
- `POST /api/chat/message`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**:
  - `conversationId`: String (required)
  - `file`: File (optional, image/PDF/EPUB)
  - `text`: String (optional)
  - `postId`: String (optional)

**File Access**:
- Images: `/api/chat/uploads/images/<filename>`
- Files: `/api/chat/uploads/files/<filename>`

### Setup Instructions

1. **Create upload directories**:
   ```bash
   cd entwined-server
   mkdir -p uploads/images uploads/files
   ```

2. **Set proper permissions** (Linux/Mac):
   ```bash
   chmod 755 uploads/images uploads/files
   ```

3. **Environment Variables**:
   - Ensure `MONGO_URI` is set
   - Ensure `JWT_SECRET` is set
   - Ensure `CLIENT_URL` is set for CORS

### Usage Examples

**Upload Image**:
```javascript
const formData = new FormData();
formData.append("conversationId", conversationId);
formData.append("file", imageFile);

await api.post("/api/chat/message", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
```

**Upload PDF/EPUB**:
```javascript
const formData = new FormData();
formData.append("conversationId", conversationId);
formData.append("file", pdfFile);

await api.post("/api/chat/message", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
```

### Error Handling

- **Invalid file type**: Shows alert, prevents upload
- **File too large**: Shows alert with size limit
- **Upload failure**: Shows error message, allows retry
- **Network errors**: Handled by axios interceptor

### Future Enhancements

Potential improvements:
- Cloud storage integration (AWS S3, Cloudinary)
- File compression for large files
- Progress bar for uploads
- File preview in modal (PDF viewer)
- File sharing permissions
- File expiration/deletion
- Virus scanning integration

---

## Testing Checklist

### Authentication
- [ ] Cannot access `/dashboard` without login
- [ ] Expired token redirects to login
- [ ] Invalid token redirects to login
- [ ] Valid token persists on page refresh
- [ ] Auto-logout on 401 responses

### File Sharing
- [ ] Can upload images (JPEG, PNG, GIF, WebP)
- [ ] Can upload PDF files
- [ ] Can upload EPUB files
- [ ] File preview shows before sending
- [ ] Files display correctly in messages
- [ ] Can download files
- [ ] File size validation works
- [ ] File type validation works
- [ ] Upload progress indicator shows
- [ ] Error handling works for invalid files

---

## Notes

- Files are stored on the filesystem, not in MongoDB
- Consider migrating to cloud storage (S3, Cloudinary) for production
- File URLs are relative paths served by Express static middleware
- Ensure proper backup strategy for uploaded files
- Consider implementing file cleanup for old/unused files


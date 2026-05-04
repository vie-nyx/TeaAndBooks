# Entwined

A social platform built for book lovers — discover books, track your reading journey, connect with readers, share thoughts, create reading goals, and build meaningful conversations around literature.

---
## Live Demo

🔗 https://entwined-web.vercel.app/
For reference while testing friend-related features, search for users like:
- becca

## Features

### Authentication

* JWT Authentication
* Google OAuth Login
* Secure Refresh Tokens
* Protected Routes

### Social Features

* Create and share posts
* Like and comment system
* Friend requests and connections
* Real-time messaging with Socket.IO
* Share posts in chats
* User profiles and activity tracking

### Reading Experience

* Personal library management
* Reading progress tracker
* Journal entries and reflections
* Book reviews and ratings
* Group reading goals
* Upload PDFs and EPUBs

### Media Uploads

* Image uploads
* Firebase Storage integration
* Cloudinary integration
* File sharing in chats

### UI/UX

* Responsive design
* Dark and light themes
* Mobile-friendly layout
* Modern aesthetic interface

---

## Tech Stack

### Frontend

* React.js
* Vite
* CSS3
* Axios
* Socket.IO Client
* React Router DOM

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* Firebase Admin SDK
* JWT Authentication
* Multer
* Cloudinary

---

## Folder Structure

```bash
entwined/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── uploads/
│   └── server.js
│
└── README.md
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/entwined.git
cd entwined
```

---

## Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Place your `firebaseKey.json` file inside the `server` root directory.

Start the backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory.

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

---

## Deployment

### Frontend

Deploy using:

* Vercel
* Netlify

### Backend

Deploy using:

* Render
* Railway

---

## API Routes

| Method | Route                | Description   |
| ------ | -------------------- | ------------- |
| POST   | `/api/auth/register` | Register user |
| POST   | `/api/auth/login`    | Login user    |
| GET    | `/api/profile/:id`   | Get profile   |
| POST   | `/api/posts/create`  | Create post   |
| GET    | `/api/posts`         | Fetch posts   |
| POST   | `/api/chat/message`  | Send message  |
| GET    | `/api/library`       | Get library   |

---

## Environment Variables

### Backend

| Variable                | Description                   |
| ----------------------- | ----------------------------- |
| `MONGO_URI`             | MongoDB connection string     |
| `JWT_SECRET`            | JWT access token secret       |
| `JWT_REFRESH_SECRET`    | JWT refresh token secret      |
| `CLIENT_URL`            | Frontend URL                  |
| `GOOGLE_CLIENT_ID`      | Google OAuth Client ID        |
| `EMAIL_USER`            | Email service username        |
| `EMAIL_PASS`            | Email service password        |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name         |
| `CLOUDINARY_API_KEY`    | Cloudinary API key            |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret         |
| `FIREBASE_KEY`          | Firebase service account JSON |

### Frontend

| Variable       | Description     |
| -------------- | --------------- |
| `VITE_API_URL` | Backend API URL |

---

## Security

* Helmet for HTTP security headers
* Express rate limiting
* Secure JWT authentication
* Protected API routes
* CORS protection
* File validation and upload limits

---

## Future Improvements

- Improve responsiveness and mobile UI consistency across all pages and components
- Eliminate horizontal overflow issues on smaller screen devices
- Enhance chat UI and dashboard layouts for better mobile experience
- Make shared posts clickable and navigable to the original post
- Make usernames and profile images clickable throughout the platform
- Add direct profile navigation from posts, comments, chats, and friend lists
- Enable local device upload for profile pictures instead of URL-only uploads
- Add image preview support before profile upload
- Implement real-time unread message notifications
- Add notification badges and live message indicators using Socket.IO
- Improve overall UI polish and interaction feedback
- Add browser push notifications for messages and friend activity
- Introduce advanced search and filtering for users and books
- Add AI-powered book recommendations and reading insights
- Improve accessibility and performance optimization

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## Open Source Guidelines

Before contributing:

* Follow clean coding practices
* Use meaningful commit messages
* Test features before creating PRs
* Keep UI responsive across devices

---

## License

You may choose to add an MIT License if you want to make the project fully open source.

---

## Author

Mannat Berry

* GitHub: [https://github.com/vie-nyx](https://github.com/vie-nyx)
* LinkedIn: [https://linkedin.com/in/mannat-berry-416878266](https://linkedin.com/in/mannat-berry-416878266)



---

## Support

If you like this project, consider giving it a star on GitHub.

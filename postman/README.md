# Postman Collection - Inderjet API

## Import

1. **Import Collection:** File → Import → Select `Inderjet-API.postman_collection.json`
2. **Import Environment (optional):** File → Import → Select `Inderjet-Local.postman_environment.json`
3. **Standalone collections (optional):** Import any of  
   `Category-CRUD.postman_collection.json` · `Product-CRUD.postman_collection.json` · **`CourseVideoBookmarks.postman_collection.json`** (course video bookmarks only)

## Setup

1. Set **baseUrl** in collection variables (default: `http://localhost:3000`)
2. For authenticated requests: Run **Login** or **Social Login** first – it auto-saves `access_token` to collection variables

## Flow

1. **Login** / **Social Login** → Token saved automatically
2. Use authenticated endpoints with the token

## Endpoints Summary

| Folder | Endpoints |
|--------|-----------|
| **User** | Register, Login, Social Login, Get Details, Update Profile, Change Password, Forget/Verify/Reset Password, Delete Account |
| **Category** | Add, Get All, Update, Delete |
| **Product** | Add, Get All, Get by ID, Update, Delete |
| **Raag** | Add, Get All, Get by ID, Update, Delete |
| **Raag Detail** | Add, Get All, Get by ID, Update, Delete |
| **Video Tutorial** | Add, Get All, Get by ID, Update, Delete |
| **Gurbani** | Add, Get All, Get by ID, Update, Delete, Add/Update/Delete Baani |
| **Collaborator** | Add, Get All, Get by ID, Update |
| **Suggestion** | Create, Get All, Get by ID, Update, Delete |
| **Plan** | Get All, Get by ID, Create, Update, Delete |
| **Subscription** | Purchase, Confirm Payment, Get Active, Get All, Get by ID |
| **Course** | Get All, Get by ID, Get Similar, Create, Update, Delete (Soft/Hard) |
| **Course Video** | Get by Course, Add, Update, Delete |
| **Course video bookmarks** | Get my bookmarks, Add bookmark, Get by ID, Update note, Delete (learner JWT; base path `/course-video-bookmarks`) |
| **Enrollment** | Enroll, Get My Enrollments, Get by ID, Update Progress, Cancel |
| **Previous Result** | Create, Get All, Get by ID, Update, Delete |
| **File Upload** | Upload Image |
| **Health** | Health Check |

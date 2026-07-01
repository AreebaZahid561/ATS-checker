# ATS Checker API

A production-quality REST API for AI Resume Parsing and ATS Compatibility Analysis. Built with Node.js, Express, MongoDB, and Mongoose.

## Features
- **User Authentication**: Register, login, logout, password reset, and JWT refresh tokens.
- **Resume Upload**: Secure file upload handling (PDF/DOCX) with Multer.
- **Resume Parsing**: Extract contact info, skills, education, experience, etc., from PDF and DOCX files.
- **ATS Scoring**: Calculate a detailed ATS compatibility score across 10 categories, providing actionable feedback.

## Tech Stack
- **Backend Framework**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT & bcrypt
- **Validation**: Zod
- **File Processing**: Multer, pdf-parse, mammoth
- **Testing**: Jest & Supertest
- **API Documentation**: Swagger/OpenAPI

## Prerequisites
- Node.js (v18+)
- MongoDB (running locally or a MongoDB URI)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AreebaZahid561/ATS-checker.git
   cd "ats analyzer"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and update the values.
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **View API Documentation:**
   Open your browser and navigate to `http://localhost:5000/api/docs`.

## Running Tests
Run the test suite using Jest:
```bash
npm test
```
To generate a coverage report:
```bash
npm run test:coverage
```

## Security Implementation
- `helmet` for HTTP header security
- `cors` configured for specific origins
- Rate limiting (global, auth, upload)
- `express-mongo-sanitize` for NoSQL injection prevention
- Strong password enforcement via Zod validators

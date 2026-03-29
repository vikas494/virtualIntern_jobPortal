import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jobRoutes from './routes/jobRoutes.js'
import authRoutes from './routes/authRoutes.js'; // <-- Note the .js extension!
import applicationRoutes from './routes/applicationRoutes.js'; // <-- 1. Add this import

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes); // <-- 2. Add this line
app.use('/api/applications', applicationRoutes); // <-- 2. Add this line

// Basic test route
app.get('/', (req, res) => {
    res.send('Job Portal API is running with ES Modules!');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
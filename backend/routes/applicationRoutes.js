import express from 'express';
import { applyForJob, getUserApplications, cancelApplication, getAdminApplications } from '../controllers/applicationController.js';

const router = express.Router();

// Route to apply for a job
router.post('/apply', applyForJob);

// Route to get all applications for a specific user
router.get('/user/:userId', getUserApplications);

// Route to delete a application
router.delete('/:id', cancelApplication);

// Add the admin route
router.get('/admin/:adminId', getAdminApplications);

export default router;
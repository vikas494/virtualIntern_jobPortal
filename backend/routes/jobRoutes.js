import express from 'express';
import { addJob, getJobs, deleteJob } from '../controllers/jobController.js';

const router = express.Router();

// Route to add a job
router.post('/add-job', addJob);

// Route to get all jobs
router.get('/', getJobs);

//Route to delete job
router.delete('/:id', deleteJob);

export default router;
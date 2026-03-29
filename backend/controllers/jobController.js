import Job from '../models/Job.js';

// POST /api/jobs/add-job (Admin functionality)
export const addJob = async (req, res) => {
    try {
        const { title, company, skills_required, description, postedBy } = req.body;
        
        const newJob = new Job({
            title,
            company,
            skills_required,
            description,
            postedBy // This will be the User ID of the admin posting the job
        });

        await newJob.save();
        res.status(201).json({ message: 'Job posted successfully', job: newJob });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/jobs (Public functionality)
export const getJobs = async (req, res) => {
    try {
        // Fetch all jobs and optionally populate the admin's name who posted it
        const jobs = await Job.find().populate('postedBy', 'name'); 
        res.status(200).json(jobs);
        
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE /api/jobs/:id (Admin functionality)
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Find and delete the job
        const deletedJob = await Job.findByIdAndDelete(id);
        
        if (!deletedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // 2. IMPORTANT: Delete all applications associated with this job!
        // We have to import the Application model at the top of this file for this to work.
        const Application = (await import('../models/Application.js')).default;
        await Application.deleteMany({ job_id: id });

        res.status(200).json({ message: 'Job and associated applications deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
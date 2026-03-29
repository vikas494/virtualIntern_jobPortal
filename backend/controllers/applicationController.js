import Application from '../models/Application.js';

// POST /api/applications/apply
export const applyForJob = async (req, res) => {
    try {
        const { user_id, job_id } = req.body;

        // Requirement: Prevent duplicate applications
        const existingApplication = await Application.findOne({ user_id, job_id });
        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        // Create the new application
        const newApplication = new Application({
            user_id,
            job_id,
            status: 'pending' // Default status from our model
        });

        await newApplication.save();
        res.status(201).json({ message: 'Successfully applied for the job!', application: newApplication });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/applications/user/:userId
export const getUserApplications = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Fetch applications and populate the job details so the user can see what they applied for
        const applications = await Application.find({ user_id: userId }).populate('job_id');
        
        res.status(200).json(applications);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE /api/applications/:id
export const cancelApplication = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the application by its ID and delete it
        const deletedApp = await Application.findByIdAndDelete(id);
        
        if (!deletedApp) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        res.status(200).json({ message: 'Application cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/applications/admin/:adminId
export const getAdminApplications = async (req, res) => {
    try {
        const { adminId } = req.params;
        
        // 1. Find all jobs posted by this specific admin
        const Job = (await import('../models/Job.js')).default;
        const adminJobs = await Job.find({ postedBy: adminId }).select('_id');
        
        // Extract just the IDs into an array
        const jobIds = adminJobs.map(job => job._id);

        // 2. Find all applications that match those job IDs
        const applications = await Application.find({ job_id: { $in: jobIds } })
            .populate('user_id', 'name email skills') // Get the applicant's details
            .populate('job_id', 'title company');     // Get the job details
            
        res.status(200).json(applications);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
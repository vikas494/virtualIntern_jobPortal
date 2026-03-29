import Application from '../models/Application.js';
import nodemailer from 'nodemailer'; // <-- Add this to the very top of your file!


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

// PUT /api/applications/:id/status (Admin functionality)
export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        // 1. Update the application status in MongoDB
        const application = await Application.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true }
        ).populate('user_id', 'name email').populate('job_id', 'title company');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // 2. Set up Nodemailer to send the email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 3. Customize the email message based on the status
        const candidateEmail = application.user_id.email;
        const candidateName = application.user_id.name;
        const jobTitle = application.job_id.title;
        const companyName = application.job_id.company;

        let subject, text;

        if (status === 'accepted') {
            subject = `Good news! Update on your application at ${companyName}`;
            text = `Hi ${candidateName},\n\nCongratulations! Your application for the ${jobTitle} position at ${companyName} has been ACCEPTED.\n\nOur team will reach out to you shortly with the next steps.\n\nBest regards,\nThe ${companyName} Team`;
        } else if (status === 'rejected') {
            subject = `Update on your application at ${companyName}`;
            text = `Hi ${candidateName},\n\nThank you for applying to the ${jobTitle} position at ${companyName}. After careful consideration, we have decided not to move forward with your application at this time.\n\nWe wish you the best in your job search.\n\nBest regards,\nThe ${companyName} Team`;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: candidateEmail,
            subject: subject,
            text: text
        };

        // 4. Send the email (we use a try/catch inside so the app doesn't crash if the email fails)
        try {
            await transporter.sendMail(mailOptions);
            console.log('Status email sent to', candidateEmail);
        } catch (emailError) {
            console.error('Email failed to send (check .env credentials):', emailError.message);
        }

        res.status(200).json({ message: `Application ${status} successfully!`, application });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
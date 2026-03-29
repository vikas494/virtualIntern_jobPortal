import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    skills_required: { type: [String], required: true },
    description: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Links the job to the admin who posted it
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
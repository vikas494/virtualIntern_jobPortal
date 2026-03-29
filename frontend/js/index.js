// --- 1. Authentication Check ---
const token = localStorage.getItem('token');
const userString = localStorage.getItem('user');

// If no token, kick them back to login
if (!token || !userString) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userString);

// --- 2. Setup UI ---
document.getElementById('welcomeMessage').textContent = `Hello, ${user.name}`;

// Show "Post a Job" button only for admins
if (user.role === 'admin') {
    const postJobBtn = document.getElementById('postJobBtn');
    postJobBtn.style.display = 'inline-block';
    postJobBtn.addEventListener('click', () => {
        window.location.href = 'post-job.html'; // We will build this next!
    });
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// --- 3. Fetch and Display Jobs ---
const jobContainer = document.getElementById('jobContainer');

async function fetchJobs() {
    try {
        // 1. Fetch all available jobs
        const response = await fetch('http://localhost:5000/api/jobs');
        const jobs = await response.json();

        // 2. Fetch the current user's applications (if they are a regular user)
        let appliedJobIds = [];
        if (user.role === 'user') {
            const appsResponse = await fetch(`http://localhost:5000/api/applications/user/${user.id}`);
            const applications = await appsResponse.json();
            
            // Extract just the Job IDs into a simple array for easy checking
            appliedJobIds = applications.map(app => {
                // Handle populated job_id object OR raw string ID
                return app.job_id._id ? app.job_id._id : app.job_id; 
            });
        }

        jobContainer.innerHTML = ''; 

        if (jobs.length === 0) {
            jobContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No jobs available right now.</p>';
            return;
        }

        // 3. Loop through jobs and create HTML
        jobs.forEach(job => {
            const skillsHtml = job.skills_required.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
            
            // CHECK: Did the user apply for this specific job?
            const hasApplied = appliedJobIds.includes(job._id);

            // Dynamically set the button HTML based on role and application status
            let actionButtonHtml = '';
            
            if (user.role === 'admin') {
                // Show a red Delete button for admins
                actionButtonHtml = `<button class="btn delete-job-btn" data-jobid="${job._id}" style="width: auto; background-color: var(--danger);">Delete Job</button>`;
            } else if (hasApplied) {
                // Show green Applied button for users who already applied
                actionButtonHtml = `<button class="btn" style="width: auto; background-color: var(--success); cursor: not-allowed;" disabled>Applied</button>`;
            } else {
                // Show standard Apply button
                actionButtonHtml = `<button class="btn apply-btn" data-jobid="${job._id}" style="width: auto;">Apply Now</button>`;
            }

            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <p>${job.company} • Posted by ${job.postedBy ? job.postedBy.name : 'Unknown'}</p>
                    <div style="margin-bottom: 1rem;">${skillsHtml}</div>
                    <p style="font-size: 0.8rem;">${job.description}</p>
                </div>
                <div class="job-action">
                    ${actionButtonHtml}
                </div>
            `;
            jobContainer.appendChild(jobCard);
        });

        attachApplyListeners();
        attachDeleteJobListeners();

    } catch (error) {
        console.error("Error fetching jobs:", error);
        jobContainer.innerHTML = '<p style="color: var(--danger);">Failed to load jobs.</p>';
    }
}

// --- 4. Handle Job Applications ---
function attachApplyListeners() {
    const applyButtons = document.querySelectorAll('.apply-btn');
    
    applyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const jobId = e.target.getAttribute('data-jobid');
            
            try {
                const response = await fetch('http://localhost:5000/api/applications/apply', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        job_id: jobId
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Successfully applied!');
                    e.target.textContent = 'Applied';
                    e.target.style.backgroundColor = 'var(--success)';
                    e.target.disabled = true;
                } else {
                    alert(data.message); // Will show "You have already applied..."
                }

            } catch (error) {
                alert('Error applying for job. Please try again.');
            }
        });
    });
}

// Run the fetch function when the page loads
fetchJobs();

// --- 5. Handle Job Deletion (Admins Only) ---
function attachDeleteJobListeners() {
    const deleteButtons = document.querySelectorAll('.delete-job-btn');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to delete this job? All applications for this job will also be permanently deleted.')) {
                return;
            }
            
            const jobId = e.target.getAttribute('data-jobid');
            
            try {
                const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Refresh the feed to remove the deleted job
                    fetchJobs(); 
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to delete job.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Server error while deleting job.');
            }
        });
    });
}
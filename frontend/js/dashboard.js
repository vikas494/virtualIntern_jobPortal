// --- 1. Security Check ---
const token = localStorage.getItem('token');
const userString = localStorage.getItem('user');

if (!token || !userString) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userString);

// --- 2. Populate Profile Info ---
document.getElementById('userName').textContent = user.name;
document.getElementById('userRole').textContent = `Account Type: ${user.role === 'admin' ? 'Company (Admin)' : 'Job Seeker'}`;

// --- 3. Fetch Applications ---
const applicationsContainer = document.getElementById('applicationsContainer');

async function fetchMyApplications() {
    try {
        // Call our backend, passing the logged-in user's ID in the URL
        const response = await fetch(`http://localhost:5000/api/applications/user/${user.id}`);
        const applications = await response.json();

        applicationsContainer.innerHTML = ''; // Clear loading text

        if (applications.length === 0) {
            applicationsContainer.innerHTML = `
                <div class="card" style="text-align: center;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">You haven't applied to any jobs yet.</p>
                    <button onclick="window.location.href='index.html'" class="btn" style="width: auto;">Browse Jobs</button>
                </div>
            `;
            return;
        }

        // Loop through the applications and render them
        applications.forEach(app => {
            // Because we used .populate('job_id') in our backend, we have access to the job details!
            const job = app.job_id; 
            
            // Just in case a job was deleted after applying
            if (!job) return; 

            const appCard = document.createElement('div');
            appCard.className = 'job-card';
            appCard.innerHTML = `
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <p>${job.company}</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                        Applied on: ${new Date(app.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div class="job-action" style="text-align: right;">
                    <span class="badge badge-${app.status}" style="display: block; margin-bottom: 0.5rem;">${app.status}</span>
                    
                    ${app.status === 'pending' ? `
                        <button class="btn cancel-btn" data-appid="${app._id}" style="background-color: var(--danger); width: auto; font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                            Cancel Application
                        </button>
                    ` : ''}
                </div>
            `;
            applicationsContainer.appendChild(appCard);

            // ADD THIS LINE: Attach listeners to the new buttons
            attachCancelListeners();
        });

    } catch (error) {
        console.error("Error fetching applications:", error);
        applicationsContainer.innerHTML = '<p style="color: var(--danger);">Failed to load your applications.</p>';
    }
}

fetchMyApplications();

// function to cancle application
function attachCancelListeners() {
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            // Confirm before deleting
            if (!confirm('Are you sure you want to cancel this application? This cannot be undone.')) {
                return;
            }
            
            const appId = e.target.getAttribute('data-appid');
            
            try {
                const response = await fetch(`http://localhost:5000/api/applications/${appId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Refresh the dashboard to remove the cancelled application
                    fetchMyApplications(); 
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to cancel application.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Server error while cancelling.');
            }
        });
    });
}
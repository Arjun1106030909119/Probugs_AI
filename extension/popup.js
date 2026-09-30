document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://probugs-backend.onrender.com';
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');

    const sourceUrlInput = document.getElementById('source-url');
    const bugTitleInput = document.getElementById('bug-title');
    const descriptionTextarea = document.getElementById('description');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const reportAnotherBtn = document.getElementById('report-another-btn');
    const visitBtn = document.getElementById('visit-btn');

    // 1. Capture current URL
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            sourceUrlInput.value = tab.url;
        }
    } catch (error) {
        console.error('Error fetching tab URL:', error);
    }

    // 2. Form Submission (Guest Mode)
    submitBtn.addEventListener('click', async () => {
        const payload = {
            title: bugTitleInput.value,
            description: descriptionTextarea.value,
            sourceUrl: sourceUrlInput.value,
            status: 'Open'
        };

        if (!payload.title || !payload.description) {
            alert('Please fill out all fields.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/tickets/guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}...`);
            }
            
            if (response.ok && result.success) {
                showSuccessView(result.data.ticketId);
            } else {
                throw new Error(result.error || `Server Error (${response.status}): ${response.statusText}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Submission Failed: ' + error.message + '\n\nPlease check your connection and try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit Report <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
        }
    });

    // 3. View Transitions
    function showSuccessView(ticketId) {
        document.querySelector('.ticket-id span').textContent = ticketId;
        formView.classList.add('hidden');
        successView.classList.remove('hidden');
    }

    reportAnotherBtn.addEventListener('click', () => {
        bugTitleInput.value = '';
        descriptionTextarea.value = '';
        successView.classList.add('hidden');
        formView.classList.remove('hidden');
    });

    // 4. Navigation
    visitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://probugs-ai.vercel.app' }); // Vercel Production URL
    });

    cancelBtn.addEventListener('click', () => {
        window.close();
    });
});

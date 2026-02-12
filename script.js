// IE 203 Problem Sessions - Dynamic Content Loader
// This script automatically detects and displays available problem sessions

(function () {
    'use strict';

    // Configuration
    const PS_FOLDER = 'PS/';
    const FILE_PATTERNS = {
        questions: 'ps{n}q.pdf',
        solutions: 'ps{n}s.pdf'
    };

    /**
     * Check if a file exists
     * @param {string} url - URL to check
     * @returns {Promise<boolean>}
     */
    async function fileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Detect available problem sessions
     * @returns {Promise<Array>} Array of PS objects
     */
    async function detectProblemSessions() {
        const problemSessions = [];
        const maxPS = 20; // Check up to PS 20

        for (let i = 1; i <= maxPS; i++) {
            const questionsFile = PS_FOLDER + FILE_PATTERNS.questions.replace('{n}', i);
            const solutionsFile = PS_FOLDER + FILE_PATTERNS.solutions.replace('{n}', i);

            const [hasQuestions, hasSolutions] = await Promise.all([
                fileExists(questionsFile),
                fileExists(solutionsFile)
            ]);

            // Only add if at least questions exist
            if (hasQuestions) {
                problemSessions.push({
                    number: i,
                    questionUrl: questionsFile,
                    solutionUrl: hasSolutions ? solutionsFile : null
                });
            } else if (problemSessions.length > 0) {
                // If we found PS before but current doesn't exist, likely no more PS
                break;
            }
        }

        return problemSessions;
    }

    /**
     * Get version for specific PS (for cache busting)
     * @param {number} psNumber - PS number
     * @returns {string} Version string
     */
    function getVersionForPS(psNumber) {
        const versions = {
            1: "v2" // Update this when you change PS 1 files
        };
        return versions[psNumber] || "v1";
    }

    /**
     * Get note for specific PS (if any)
     * @param {number} psNumber - PS number
     * @returns {string|null} Note text or null
     */
    function getNoteForPS(psNumber) {
        const notes = {
            1: {
                text: "Questions updated for clarity. Please check solutions.",
                date: "Feb 13, 2026"
            }
        };
        return notes[psNumber] || null;
    }

    /**
     * Create PS card HTML
     * @param {Object} ps - Problem session object
     * @param {number} index - Index for animation delay
     * @returns {string} HTML string
     */
    function createPSCard(ps, index) {
        const animationDelay = (index * 0.1) + 0.4;
        const note = getNoteForPS(ps.number);
        const version = getVersionForPS(ps.number);

        // Add version parameter to URLs for cache busting
        const questionUrlWithVersion = `${ps.questionUrl}?v=${version}`;
        const solutionUrlWithVersion = ps.solutionUrl ? `${ps.solutionUrl}?v=${version}` : null;

        return `
            <div class="ps-card" style="animation-delay: ${animationDelay}s">
                <span class="ps-number">PS ${ps.number}</span>
                <h3 class="ps-title">Problem Session ${ps.number}</h3>
                <div class="ps-links">
                    <a href="${questionUrlWithVersion}" class="ps-link questions" target="_blank" rel="noopener">
                        <span>📄</span>
                        <span>Questions</span>
                    </a>
                    ${solutionUrlWithVersion ? `
                        <a href="${solutionUrlWithVersion}" class="ps-link solutions" target="_blank" rel="noopener">
                            <span>✓</span>
                            <span>Solutions</span>
                        </a>
                    ` : `
                        <span class="ps-link solutions" style="opacity: 0.4; cursor: not-allowed;">
                            <span>⏳</span>
                            <span>Soon</span>
                        </span>
                    `}
                </div>
                ${note ? `
                    <div class="ps-note">
                        <div class="ps-note-date">${note.date}</div>
                        <div class="ps-note-text">${note.text}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render problem sessions to the page
     * @param {Array} problemSessions - Array of PS objects
     */
    function renderProblemSessions(problemSessions) {
        const psGrid = document.getElementById('psGrid');
        const emptyState = document.getElementById('emptyState');

        if (problemSessions.length === 0) {
            psGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        psGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        // Sort by number (descending - newest first)
        problemSessions.sort((a, b) => b.number - a.number);

        // Generate HTML for all PS cards
        const html = problemSessions.map((ps, index) => createPSCard(ps, index)).join('');
        psGrid.innerHTML = html;
    }

    /**
     * Update last updated timestamp
     */
    function updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        lastUpdatedElement.textContent = now.toLocaleDateString('en-US', options);
    }

    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Show loading state
            const psGrid = document.getElementById('psGrid');
            psGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading problem sessions...</p>';

            // Detect and render problem sessions
            const problemSessions = await detectProblemSessions();
            renderProblemSessions(problemSessions);

            // Update timestamp
            updateLastUpdated();
        } catch (error) {
            console.error('Error initializing page:', error);
            document.getElementById('psGrid').innerHTML =
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading problem sessions. Please refresh the page.</p>';
        }
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

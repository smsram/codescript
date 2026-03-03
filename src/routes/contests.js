const express = require('express');
const router = express.Router();
const { 
    createDraft, 
    updateContest, 
    getGroupedLibrary, 
    deleteContest,
    getContestById,
    duplicateContest,
    getAllContests // Make sure this is also in your controller
} = require('../controllers/contestController');
const requireAuth = require('../middleware/requireAuth');

// --- ALL ROUTES ARE PROTECTED BY ADMIN AUTH ---

// 1. Get all contests (For the main Directory Table)
router.get('/', requireAuth, getAllContests);

// 2. Initialize a blank draft (Triggered when clicking "New Contest")
router.post('/draft', requireAuth, createDraft);

// 3. Fetch problems from other contests (Categorized Library)
router.get('/grouped-problems', requireAuth, getGroupedLibrary);

// 4. Duplicate an existing contest
router.post('/:id/duplicate', requireAuth, duplicateContest);

// 5. Get a specific contest/draft by ID
router.get('/:id', requireAuth, getContestById);

// 6. Update a contest or Save a Draft (Auto-save & Launch)
router.put('/:id', requireAuth, updateContest);

// 7. Delete a contest (Triggers Orphan Problem Cleanup)
router.delete('/:id', requireAuth, deleteContest);

module.exports = router;
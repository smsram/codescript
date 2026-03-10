const express = require('express');
const router = express.Router();
const { 
    createDraft, 
    updateContest,
    deleteContest,
    getContestById,
    duplicateContest,
    getAllContests,
    getContestDetails,      
    resetStudentExam,       
    terminateStudentExam,
    submitExam,
    getStudentLogs,
    getMySubmissions
} = require('../controllers/contestController');
const requireAuth = require('../middleware/requireAuth');

// --- ALL ROUTES ARE PROTECTED BY ADMIN AUTH ---

// 1. Get all contests (For the main Directory Table)
router.get('/', requireAuth, getAllContests);

// 2. Initialize a blank draft
router.post('/draft', requireAuth, createDraft);

// ==========================================
// SPECIFIC CONTEST ACTIONS (Must be placed before generic /:id)
// ==========================================

// 4. Duplicate an existing contest
router.post('/:id/duplicate', requireAuth, duplicateContest);

// 5. Live/History Details API for the Admin Monitor Page
router.get('/:id/details', requireAuth, getContestDetails);

// 6. Reset Student Exam (Admin Action)
router.post('/:id/reset-student', requireAuth, resetStudentExam);

// 7. Terminate Student Exam (Admin Action)
router.post('/:id/terminate-student', requireAuth, terminateStudentExam);

// 8. 🚀 STUDENT EXAM SUBMIT API (Triggers bulk sweep if time is up)
router.post('/:id/submit', requireAuth, submitExam);

// ==========================================
// GENERIC ID ROUTES (Must go last)
// ==========================================

// 9. Get a specific contest/draft by ID or Join Code
router.get('/:id', requireAuth, getContestById);

// 10. Update a contest or Save a Draft
router.put('/:id', requireAuth, updateContest);

// 11. Delete a contest
router.delete('/:id', requireAuth, deleteContest);

router.get('/:id/student/:userId', requireAuth, getStudentLogs);

// 🚀 Add this with your other generic /:id routes (Protected by requireAuth)
router.get('/:id/my-submissions', requireAuth, getMySubmissions);

module.exports = router;
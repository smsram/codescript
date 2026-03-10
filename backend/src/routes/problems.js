const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { 
    getAllProblems, 
    getProblemById, 
    createProblem, 
    updateProblem, 
    deleteProblem,
    uploadProblemImage, // 🚀 Import
    deleteProblemImage,  // 🚀 Import
    generateAIProblem,
    testSolution
} = require('../controllers/problemController');

// All routes protected by Auth
router.use(requireAuth);

// 🚀 ADD THESE BEFORE THE /:id ROUTES
router.post('/upload-image', uploadProblemImage);
router.delete('/delete-image', deleteProblemImage);

router.get('/', getAllProblems);
router.get('/:id', getProblemById);
router.post('/', createProblem);
router.put('/:id', updateProblem);
router.delete('/:id', deleteProblem);

router.post('/generate-problem', generateAIProblem);
router.post('/test-solution', testSolution);

module.exports = router;
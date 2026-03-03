const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { 
    getAllProblems, 
    getProblemById, 
    createProblem, 
    updateProblem, 
    deleteProblem 
} = require('../controllers/problemController');

// All routes protected by Auth
router.use(requireAuth);

router.get('/', getAllProblems);
router.get('/:id', getProblemById);
router.post('/', createProblem);
router.put('/:id', updateProblem);
router.delete('/:id', deleteProblem);

module.exports = router;
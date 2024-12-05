const express = require('express');
const {
    createProject,
    getAllProjects,
    updateProject,
    deleteProject,
    assignTaskToProject,
    filterTasksByProject,
    sortProjectsByDate,
    getProjectsWithTasksDueToday,
    moveTaskToAnotherProject
  } = require('../controllers/projectController');

const router = express.Router();

// Define routes and map them to controller functions
router.post('/', createProject);
router.get('/', getAllProjects);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/assignTask', assignTaskToProject);
router.get('/filterTasks', filterTasksByProject);
router.get('/sort', sortProjectsByDate);
router.get('/projectWithTask', getProjectsWithTasksDueToday);
router.post('/moveTask', moveTaskToAnotherProject);

module.exports = router;
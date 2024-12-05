const express = require('express');
const {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  filterTasksByStatus,
  searchTasksByName,
  sortTasksByDate,
  getTasksWithProjectsDueToday,
  changeTaskStatus
} = require('../controllers/taskController');

const router = express.Router(); // Create a new router instance

// Define routes and map them to controller functions
router.post('/', createTask);
router.get('/', getAllTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.get('/filter', filterTasksByStatus);
router.get('/search', searchTasksByName);
router.get('/sort', sortTasksByDate);
router.get('/taskWithProject', getTasksWithProjectsDueToday);
router.patch('/changeStatus', changeTaskStatus);

module.exports = router;

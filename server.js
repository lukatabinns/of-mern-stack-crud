require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const tasksRoutes = require('./routes/tasks'); // Import task routes
const projectsRoutes = require('./routes/projects');

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies

// Mount task routes
app.use('/tasks', tasksRoutes);

// Mount Project routes
app.use('/projects', projectsRoutes);

const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// models/project.js
const { ObjectId } = require('mongodb');

const projectSchema = {
  _id: ObjectId,          // MongoDB ObjectId for project
  name: String,           // Name of the project
  description: String,    // Description of the project
  startDate: Date,        // Start date of the project
  dueDate: Date,          // Due date of the project
  createdAt: Date,      // Created date (date task created)
  updatedAt: Date,      // Created date (date task created)
  tasks: [{               // Array of task references
    type: ObjectId,
    ref: 'Task',          // Reference to Task collection
  }],
};

module.exports = projectSchema;
const connectToDatabase = require('../services/db');
const { ObjectId } = require('mongodb');
const taskModel = require('../models/task'); // Import the task model

/**
 * Create a new task.
 * Validates required fields and assigns default values.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.createTask = async (req, res) => {
    const { name, description, status, startDate, dueDate, doneDate, projectId } = req.body;

    // Validate if 'fields' is provided in the request body
    if (!status || !name || !description || !startDate || !dueDate) {
        return res.status(400).json({ error: 'The fields status, name, description, startDate, dueDate are required' });
    }

    // Ensure the status is one of the valid values: 'to-do', 'in-progress', 'done'
    const validStatuses = ['to-do', 'in-progress', 'done'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value. It must be "to-do", "in-progress", or "done"' });
    }

    try {
      const db = await connectToDatabase();
      const newTask = {
        name,
        description,
        status,
        createdDate: new Date(),
        startDate: status === 'done' ? new Date() : startDate,
        dueDate,
        doneDate: status === 'done' ? new Date() : doneDate,
        projectId,
      };

      // Check if a task with the same name already exists
      const existingTask = await db.collection('tasks').findOne({ name });
      if (existingTask) {
        return res.status(400).json({ error: 'A task with this name already exists.' });
      }
  
      const result = await db.collection('tasks').insertOne(newTask);
  
      res.status(201).json({
        message: 'Task created successfully',
        taskId: result.insertedId,
      });
    } catch (error) {
      console.error('Error in createTask:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
};

/**
 * Retrieve all tasks from the database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getAllTasks = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const tasks = await db.collection('tasks').find().toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

/**
 * Update task details by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Validate if 'fields' is provided in the request body
    if (!updates.status || !updates.name || !updates.description || !updates.startDate || !updates.dueDate) {
        return res.status(400).json({ error: 'The fields status, name, description, startDate, dueDate are required' });
    }
    
    // Validate that the status is one of the accepted values ('to-do', 'in-progress', or 'done')
    const validStatuses = ['to-do', 'in-progress', 'done'];
    if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid status value. Valid values are: to-do, in-progress, done' });
    }

    try {
    const db = await connectToDatabase();
    const result = await db.collection('tasks').updateOne(
        { _id: ObjectId.createFromHexString(id)},
        { $set: updates }
    );
    if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task updated' });
    } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
    }
};

/**
 * Delete a task by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'The id field is required' });
  }

  try {
    const db = await connectToDatabase();
    const result = await db.collection('tasks').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

/**
 * Filter tasks by their status.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.filterTasksByStatus = async (req, res) => {
  const { status } = req.query;

  if (!status) {
    return res.status(400).json({ error: 'The status is required' });
  }

  try {
    const db = await connectToDatabase();
    const tasks = await db.collection('tasks').find({ status }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter tasks' });
  }
};

/**
 * Search tasks by name (partial, case-insensitive match).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.searchTasksByName = async (req, res) => {
  const { name } = req.query;

  try {
    const db = await connectToDatabase();
    const tasks = await db.collection('tasks').find({ name: { $regex: name, $options: 'i' } }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search tasks' });
  }
};

/**
 * Sort tasks by a specified date field.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.sortTasksByDate = async (req, res) => {
  const { field } = req.query; // e.g., field=startDate, dueDate, doneDate
  const validFields = ['startDate', 'dueDate', 'doneDate'];

  // Validate the field for sorting
  if (!validFields.includes(field)) {
    return res.status(400).json({ error: 'Invalid field for sorting' });
  }

  try {
    const db = await connectToDatabase();
    const tasks = await db.collection('tasks').find().sort({ [field]: 1 }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sort tasks' });
  }
};

/**
 *  Aggregation to return all tasks that belong to a project with a due date set to "today".
 */
exports.getTasksWithProjectsDueToday = async (req, res) => {
    try {
      const db = await connectToDatabase();
  
      // Calculate today's start and end times.
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayEnd = new Date().setHours(23, 59, 59, 999);
  
      // Aggregation pipeline to find tasks whose associated project's due date is today.
      const tasks = await db.collection('tasks').aggregate([
        {
          $lookup: {
            from: 'projects',            // Join with the 'projects' collection
            localField: 'projectId',     // Match projectId from tasks
            foreignField: '_id',         // Match _id from projects
            as: 'project'                // Output matched project as an array
          }
        },
        { $unwind: '$project' },         // Flatten the project array
        {
          $match: {
            'project.dueDate': {         // Filter tasks based on project's due date
              $gte: new Date(todayStart),
              $lte: new Date(todayEnd)
            }
          }
        }
      ]).toArray();
  
      if (tasks.length === 0) {
        return res.status(404).json({ message: 'No tasks found for projects with due date today' });
      }
  
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching tasks with projects due today:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };


/**
 * Change a task from one status to another (e.g., "to-do" to "done" and vice versa).
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.changeTaskStatus = async (req, res) => {
    const { taskId, newStatus } = req.body;

    // Validate if 'fields' is provided in the request body
    if (!taskId || !newStatus) {
        return res.status(400).json({ error: 'The fields taskId, newStatus are required' });
    }

    try {
      const db = await connectToDatabase();
  
      // Validate task exists
      const task = await db.collection('tasks').findOne({ _id: ObjectId.createFromHexString(taskId) });
  
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      // Update status and reset dates as necessary
      let updateData = { status: newStatus };
  
      if (newStatus === 'to-do') {
        updateData.startDate = null;
        updateData.doneDate = null;
      } else if (newStatus === 'done') {
        updateData.doneDate = new Date(); // Set the done date to now
        if (!task.startDate) {
          updateData.startDate = new Date(); // Set start date if not set
        }
      } else if (newStatus === 'in-progress') {
        if (!task.startDate) {
          updateData.startDate = new Date(); // Set start date if transitioning to in-progress
        }
        updateData.doneDate = null; // Clear done date if reverting to in-progress
      }
  
      const result = await db.collection('tasks').updateOne(
        { _id: ObjectId.createFromHexString(taskId) },
        { $set: updateData }
      );
  
      if (result.modifiedCount === 1) {
        return res.status(200).json({ message: `Task status updated to ${newStatus}`, taskId });
      } else {
        return res.status(500).json({ error: 'Failed to update task status' });
      }
    } catch (error) {
      console.error('Error in resetTaskStatus:', error);
      res.status(500).json({ error: 'An error occurred while resetting the task status' });
    }
  };
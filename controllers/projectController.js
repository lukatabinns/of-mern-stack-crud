const { ObjectId } = require('mongodb');
const connectToDatabase = require('../services/db');
const projectModel = require('../models/project');

/**
 * Controller for creating a new project.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.createProject = async (req, res) => {
    const { name, description, startDate, dueDate } = req.body;

    try {
      const db = await connectToDatabase();
      const newProject = {
        name,
        description,
        startDate,
        dueDate,
      };
  
      const result = await db.collection('projects').insertOne(newProject);
  
      res.status(201).json({
        message: 'Project created successfully',
        projectId: result.insertedId,
      });
    } catch (error) {
      console.error('Error in createProject:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
};

/**
 * Controller for listing all projects.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getAllProjects = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const projects = await db.collection('projects').find().toArray();

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
};

/**
 * Controller for updating a project by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, startDate, dueDate } = req.body;

  try {
    const db = await connectToDatabase();
    const result = await db.collection('projects').updateOne(
      { _id: ObjectId.createFromHexString(id) },
      {
        $set: {
          name,
          description,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

/**
 * Controller for deleting a project by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const db = await connectToDatabase();
    
    // Check if the project exists
    const project = await db.collection('projects').findOne({ _id: ObjectId.createFromHexString(id) });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete the project
    const deleteResult = await db.collection('projects').deleteOne({ _id: ObjectId.createFromHexString(id) });
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    // Unassign tasks linked to the deleted project
    await db.collection('tasks').updateMany(
      { projectId: ObjectId.createFromHexString(id) },
      { $set: { projectId: null } }
    );

    res.status(200).json({ message: 'Project deleted and associated tasks unassigned' });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

/**
 * Controller for assigning a task to a project.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.assignTaskToProject = async (req, res) => {
    const { taskId, projectId } = req.body;

    try {
      const db = await connectToDatabase();
  
      // Check if the task exists
      const task = await db.collection('tasks').findOne({ _id: ObjectId.createFromHexString(taskId) });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      // Check if the project exists
      const project = await db.collection('projects').findOne({ _id: ObjectId.createFromHexString(projectId) });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
  
      // Prevent assigning a task to multiple projects
      if (task.projectId) {
        return res.status(400).json({ error: 'Task is already assigned to a project' });
      }
  
      // Assign task to the project
      const result = await db.collection('tasks').updateOne(
        { _id: ObjectId.createFromHexString(taskId) },
        { $set: { projectId: ObjectId.createFromHexString(projectId) } }
      );
  
      if (result.modifiedCount === 1) {
        return res.status(200).json({ message: 'Task assigned to project' });
      } else {
        return res.status(500).json({ error: 'Failed to assign task to project' });
      }
    } catch (error) {
      console.error('Error in assignTaskToProject:', error);
      res.status(500).json({ error: 'An error occurred while assigning the task to the project' });
    }
};

/**
 * Controller for filtering tasks by project name.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.filterTasksByProject = async (req, res) => {
  const { projectName } = req.query;

  try {
    const db = await connectToDatabase();

    const project = await db.collection('projects').findOne({ name: projectName });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = await db.collection('tasks').find({ projectId: project._id }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter tasks by project' });
  }
};

/**
 * Controller for sorting projects by a specified date field.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.sortProjectsByDate = async (req, res) => {
  const { field } = req.query; // e.g., 'startDate' or 'dueDate'

  try {
    const db = await connectToDatabase();
    const projects = await db.collection('projects').find().sort({ [field]: 1 }).toArray();

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sort projects' });
  }
};

/**
 * Aggregation to return all projects that have a task with a due date set to "today".
 */
exports.getProjectsWithTasksDueToday = async (req, res) => {
    try {
      const db = await connectToDatabase();
      
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayEnd = new Date().setHours(23, 59, 59, 999);
  
      const projects = await db.collection('projects').aggregate([
        {
          $lookup: {
            from: 'tasks',
            localField: '_id',
            foreignField: 'projectId',
            as: 'tasks'
          }
        },
        {
          $match: {
            'tasks.dueDate': { $gte: new Date(todayStart), $lte: new Date(todayEnd) }
          }
        }
      ]).toArray();
  
      if (projects.length === 0) {
        return res.status(404).json({ message: 'No projects with tasks due today' });
      }
  
      res.status(200).json(projects);
    } catch (error) {
      console.error('Error fetching projects with tasks due today:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  };


/**
 * Move a task from one project to another.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.moveTaskToAnotherProject = async (req, res) => {
    const { taskId, fromProjectId, toProjectId } = req.body;
  
    try {
      const db = await connectToDatabase();
  
      // Validate projects exist
      const fromProject = await db.collection('projects').findOne({ _id: ObjectId.createFromHexString(fromProjectId) });
      const toProject = await db.collection('projects').findOne({ _id: ObjectId.createFromHexString(toProjectId) });
  
      if (!fromProject) {
        return res.status(404).json({ error: 'Source project not found' });
      }
      if (!toProject) {
        return res.status(404).json({ error: 'Target project not found' });
      }
  
      // Validate task exists and belongs to the source project
      const task = await db.collection('tasks').findOne({ _id:ObjectId.createFromHexString(taskId), projectId: ObjectId.createFromHexString(fromProjectId) });
  
      if (!task) {
        return res.status(404).json({ error: 'Task not found in the source project' });
      }
  
      // Update task's projectId to the target project
      const result = await db.collection('tasks').updateOne(
        { _id: ObjectId.createFromHexString(taskId) },
        { $set: { projectId: ObjectId.createFromHexString(toProjectId) } }
      );
  
      if (result.modifiedCount === 1) {
        return res.status(200).json({ message: 'Task successfully moved to the target project' });
      } else {
        return res.status(500).json({ error: 'Failed to move task to the target project' });
      }
    } catch (error) {
      console.error('Error in moveTaskToAnotherProject:', error);
      res.status(500).json({ error: 'An error occurred while moving the task' });
    }
  };
# To-Do List and Project Management API
This project is a Node.js application for managing tasks and projects using Express and MongoDB. It provides endpoints for creating, editing, deleting, and listing tasks and projects, along with advanced features like task assignment and filtering.

## Features
CRUD operations for tasks and projects.
Assign tasks to projects.
Filter tasks by project name or status.
Search tasks by name (with regex).
Sort projects and tasks by date fields.
Prevent tasks from being assigned to multiple projects.
Reset task statuses and update associated fields.

## Installation and Setup
Prerequisites
Node.js (v14+)
MongoDB (local or cloud instance)
Git

### 1. Steps to Run the Project

Clone the Repository

git clone https://github.com/lukatabinns/of-mern-stack-crud.git
cd todo-project-management-api

### 2. Install Dependencies
   
npm install

### 3. Set Up Environment Variables
   
Create a .env file in the project root

Add the following variables to .env:

MONGO_URI=mongodb://localhost:27017/todoList
PORT=3000

### 4. Run the Server
   
node server.js

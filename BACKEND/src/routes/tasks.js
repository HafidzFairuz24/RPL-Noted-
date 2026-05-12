const express = require('express');
const router  = express.Router({ mergeParams: true }); // inherit :listId
const auth    = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { addComment, updateComment, deleteComment } = require('../controllers/commentController');

router.get('/',           auth, getTasks);
router.post('/',          auth, createTask);
router.get('/:taskId',    auth, getTask);
router.put('/:taskId',    auth, updateTask);
router.delete('/:taskId', auth, deleteTask);

// Comments nested under task
router.post('/:taskId/comments',                   auth, addComment);
router.put('/:taskId/comments/:commentId',         auth, updateComment);
router.delete('/:taskId/comments/:commentId',      auth, deleteComment);

module.exports = router;

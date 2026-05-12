const express = require('express');
const router  = express.Router({ mergeParams: true }); // inherit :listId
const auth    = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { requireManagerForList } = require('../middleware/workspace');

router.get('/',           auth, getTasks);
router.post('/',          auth, requireManagerForList, createTask);
router.get('/:taskId',    auth, getTask);
router.put('/:taskId',    auth, updateTask); // Members might update task status
router.delete('/:taskId', auth, requireManagerForList, deleteTask);

// Comments nested under task
router.post('/:taskId/comments',                   auth, addComment);
router.put('/:taskId/comments/:commentId',         auth, updateComment);
router.delete('/:taskId/comments/:commentId',      auth, deleteComment);

module.exports = router;

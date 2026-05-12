const express = require('express');
const router  = express.Router({ mergeParams: true }); // inherit :workspaceId
const auth    = require('../middleware/auth');
const { isMember, requireManager } = require('../middleware/workspace');
const { getLists, getList, createList, updateList, deleteList } = require('../controllers/listController');

router.get('/',          auth, isMember, getLists);
router.post('/',         auth, isMember, requireManager, createList);
router.get('/:listId',   auth, isMember, getList);
router.put('/:listId',   auth, isMember, requireManager, updateList);
router.delete('/:listId',auth, isMember, requireManager, deleteList);

module.exports = router;

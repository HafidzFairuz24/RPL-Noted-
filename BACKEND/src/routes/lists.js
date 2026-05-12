const express = require('express');
const router  = express.Router({ mergeParams: true }); // inherit :workspaceId
const auth    = require('../middleware/auth');
const { isMember } = require('../middleware/workspace');
const { getLists, getList, createList, updateList, deleteList } = require('../controllers/listController');

router.get('/',          auth, isMember, getLists);
router.post('/',         auth, isMember, createList);
router.get('/:listId',   auth, isMember, getList);
router.put('/:listId',   auth, isMember, updateList);
router.delete('/:listId',auth, isMember, deleteList);

module.exports = router;

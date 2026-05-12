const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { isMember, isOwner } = require('../middleware/workspace');
const {
    getMyWorkspaces, getWorkspace,
    createWorkspace, updateWorkspace, deleteWorkspace,
    addMember, removeMember, updateMemberRole
} = require('../controllers/workspaceController');

router.get('/',                                       auth,           getMyWorkspaces);
router.post('/',                                      auth,           createWorkspace);
router.get('/:workspaceId',                           auth, isMember, getWorkspace);
router.put('/:workspaceId',                           auth, isOwner,  updateWorkspace);
router.delete('/:workspaceId',                        auth, isOwner,  deleteWorkspace);

// Members
router.post('/:workspaceId/members',                  auth, isOwner,  addMember);
router.delete('/:workspaceId/members/:userId',        auth, isOwner,  removeMember);
router.put('/:workspaceId/members/:userId',           auth, isOwner,  updateMemberRole);

module.exports = router;

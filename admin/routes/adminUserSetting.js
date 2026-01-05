var express = require('express');
var router = express.Router();
const Admin = require("../model/adminSchema");
const settingHelper = require("../helper/adminSettingHelper");

/* GET home page. */
router.get('/setting/admin-user', function(req, res, next) {
  res.render('pages/admin-user/admin-user',);
});

router.get('/api/admin-users',async function(req, res, next) {
  await settingHelper.getAdminUsers(req, res, next);
//   let response={
//   "success": true,
//   "data": {
//     "admins": [
//       {
//         "_id": "admin123",
//         "name": "Ahmed Mohammed",
//         "email": "ahmed@igrab.com",
//         "phone": "+971501234567",
//         "role": "admin",
//         "isActive": true,
//         "assignedBranches": [
//           {
//             "_id": "branch123",
//             "name": "Downtown Dubai Branch",
//             "address": "Sheikh Zayed Road, Downtown Dubai"
//           },
//           {
//             "_id": "branch124", 
//             "name": "Marina Mall Branch",
//             "address": "Dubai Marina Mall, Dubai Marina"
//           }
//         ],
//         "lastLogin": "2023-12-20T10:30:00Z",
//         "createdAt": "2023-11-15T09:20:00Z"
//       }
//     ],
//     "pagination": {
//       "currentPage": 1,
//       "totalPages": 5,
//       "totalAdmins": 47,
//       "limit": 10,
//       "hasNext": true,
//       "hasPrev": false
//     },
//     "stats": {
//       "totalAdmins": 47,
//       "activeAdmins": 42,
//       "inactiveAdmins": 5
//     }
//   }
// }
//   res.json(response)
});

router.get('/api/branches/available',async function(req, res, next) {
  await settingHelper.getAvailableBranches(req, res, next);
});

router.post('/api/admin-users',async function(req, res, next) {
  await settingHelper.createAdminBySuperAdmin(req, res, next);
});

router.put('/api/admin-users/:adminId',async function(req, res, next) {
  await settingHelper.updateAdminBySuperAdmin(req, res, next);
});

router.patch('/api/admin-users/:adminId/status',async function(req, res, next) {
  await settingHelper.changeAdminStatusBySuperAdmin(req, res);
});

router.delete('/api/admin-users/:adminId',async function(req, res, next) {
  await settingHelper.deleteAdminBySuperAdmin(req, res);
});

router.get('/api/admin-users/check-email',async function(req, res, next) {
  await settingHelper.checkEmailAvailability(req, res, next);
});

module.exports = router;

var express = require('express');
var router = express.Router();
const Admin = require("../model/adminSchema");
const dashboardHelper = require("../helper/dashboardHelper");

/* GET home page. */
router.get('/api/admin/dashboard/overview',async function(req, res, next) {
 await dashboardHelper.getDashboardOverview(req, res, );
});

router.get('/api/admin/dashboard/revenue',async function(req, res, next) {
 await dashboardHelper.fetchRevenue(req, res);
});

router.get('/api/admin/dashboard/orders/analytics',async function(req, res, next) {
 await dashboardHelper.getOrderAnalytics(req, res);
});

router.get('/api/admin/dashboard/products/top',async function(req, res, next) {
 await dashboardHelper.getTopProducts(req, res);
});

router.get('/api/admin/dashboard/branches/performance',async function(req, res, next) {
 await dashboardHelper.getBranchPerformance(req, res);
});

router.post('/api/logout', async function(req, res, next) {
    try {
        // Clear session or token
       await req.session.destroy();
       return res.status(200).json({ success: true, message: "Logged out successfully" });
    }catch (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
})

module.exports = router;

var express = require('express');
var router = express.Router();
const productHelper = require('../helper/product-helper');
const orderHelper = require('../helper/orderHelper')
const upload = require("../helper/upload");
let products = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Classic Espresso",
    category: "Coffee",
    price: 18,
    stock: 283,
    totalOrders: 1420,
    brand: "iGrab Premium",
    status: "published",
    image: "☕",
    createdAt: "2023-12-01T10:30:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "Kunafa Supreme",
    category: "Sweets",
    price: 45,
    stock: 98,
    totalOrders: 856,
    brand: "Al Amoor Sweets",
    status: "published",
    image: "🧁",
    createdAt: "2023-11-28T15:45:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439013",
    name: "Turkish Delight",
    category: "Sweets",
    price: 32,
    stock: 154,
    totalOrders: 632,
    brand: "Heritage Sweets",
    status: "published",
    image: "🍬",
    createdAt: "2023-11-25T09:20:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439014",
    name: "Caramel Macchiato",
    category: "Coffee",
    price: 28,
    stock: 0,
    totalOrders: 445,
    brand: "iGrab Premium",
    status: "out-of-stock",
    image: "☕",
    createdAt: "2023-11-20T14:15:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439015",
    name: "Fresh Orange Juice",
    category: "Beverages",
    price: 15,
    stock: 267,
    totalOrders: 234,
    brand: "iGrab Fresh",
    status: "published",
    image: "🍊",
    createdAt: "2023-11-18T11:30:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439016",
    name: "Baklava Mix",
    category: "Sweets",
    price: 55,
    stock: 76,
    totalOrders: 389,
    brand: "Damascus Sweets",
    status: "published",
    image: "🥮",
    createdAt: "2023-11-15T16:45:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439017",
    name: "Americano",
    category: "Coffee",
    price: 22,
    stock: 145,
    totalOrders: 891,
    brand: "iGrab Premium",
    status: "published",
    image: "☕",
    createdAt: "2023-11-12T08:20:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439018",
    name: "iGrab T-Shirt",
    category: "Merchandise",
    price: 65,
    stock: 45,
    totalOrders: 67,
    brand: "iGrab Official",
    status: "draft",
    image: "👕",
    createdAt: "2023-11-10T13:10:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439019",
    name: "Iced Latte",
    category: "Beverages",
    price: 25,
    stock: 189,
    totalOrders: 512,
    brand: "iGrab Premium",
    status: "published",
    image: "🧊",
    createdAt: "2023-11-08T10:45:00Z"
  },
  {
    _id: "507f1f77bcf86cd799439020",
    name: "Ma'amoul Cookies",
    category: "Sweets",
    price: 38,
    stock: 234,
    totalOrders: 678,
    brand: "Traditional Treats",
    status: "published",
    image: "🍪",
    createdAt: "2023-11-05T12:30:00Z"
  }
]
/* GET users listing. */
router.get('/orders', function (req, res, next) {
  res.render('pages/order/orders', { title: 'Order Management' });
});
/* GET users listing. */
router.get('/api/orders', async function (req, res, next) {
  await orderHelper.getOrderByFilter(req, res);

  // const response = {
  //   "success": true,
  //   "data": {
  //     "orders": [
  //       {
  //         "_id": "507f1f77bcf86cd799439011",
  //         "orderId": "ORD-2023-001234",
  //         "storeId": "STORE-001",
  //         "userId": {
  //           "_id": "user123",
  //           "name": "Ahmed Hassan",
  //           "email": "ahmed@example.com",
  //           "phone": "+971501234567"
  //         },
  //         "orderDate": "2023-12-20T10:30:00Z",
  //         "status": "Confirmed",
  //         "paymentStatus": "Paid",
  //         "paymentMethod": "Online",
  //         "subTotal": 85.50,
  //         "charges": [
  //           { "name": "Delivery Fee", "amount": 10.00 },
  //           { "name": "Service Fee", "amount": 4.25 }
  //         ],
  //         "discount": 8.55,
  //         "totalAmount": 91.20,
  //         "couponCode": "SAVE10",
  //         "orderItems": [
  //           {
  //             "productId": "prod123",
  //             "name": "Classic Espresso",
  //             "image": "https://image-url.jpg",
  //             "qty": 2,
  //             "unitPrice": 18.00,
  //             "total": 36.00
  //           }
  //         ],
  //         "address": {
  //           "fullName": "Ahmed Hassan",
  //           "phone": "+971501234567",
  //           "building": "Al Manara Tower",
  //           "flat": "1204",
  //           "street": "Sheikh Zayed Road",
  //           "area": "Downtown Dubai",
  //           "city": "Dubai",
  //           "landmark": "Near Dubai Mall"
  //         },
  //         "assignedTo": {
  //           "_id": "delivery123",
  //           "name": "Mohammed Ali",
  //           "phone": "+971507654321"
  //         },
  //         "updatedAt": "2023-12-20T11:15:00Z"
  //       }
  //     ],
  //     "pagination": {
  //       "currentPage": 1,
  //       "totalPages": 25,
  //       "totalOrders": 247,
  //       "limit": 10,
  //       "hasNext": true,
  //       "hasPrev": false
  //     },
  //     "stats": {
  //       "totalOrders": 247,
  //       "pendingOrders": 15,
  //       "confirmedOrders": 42,
  //       "processingOrders": 23,
  //       "deliveredOrders": 156,
  //       "cancelledOrders": 11,
  //       "totalRevenue": 45230,
  //       "todayOrders": 18,
  //       "unpaidOrders": 8
  //     }
  //   }
  // }

  // res.json(response);
});
router.patch('/api/orders/:id/status', async function (req, res, next) {
  await orderHelper.updateOrderStatus(req, res);
});
router.patch('/api/orders/bulk-update', async function (req, res, next) {
  await orderHelper.bulkUpdateOrderStatus(req, res);
})

router.post('/api/orders/export', async function (req, res, next) {
  console.log(req.body);
  await orderHelper.exportOrders(req, res);

  // let response={
  // "success": true,
  // "data": {
  //   "downloadUrl": "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400",
  //   "fileName": "orders-export-20231220.xlsx",
  //   "recordCount": 15,
  //   "expiresAt": "2023-12-21T14:30:22Z"
  // }}
  // res.json(response)

})

router.get("/api/orders/delivery-executives", async (req, res) => {
  await orderHelper.getAllExecutives(req, res)
})

router.post('/api/delivery-executives/:executiveId/toggle-save', async (req, res) => {
  await orderHelper.saveDeliveryExecutiveByAdmin(req, res);
})

router.post('/api/orders/:orderId/assign-delivery', async (req, res) => {
  await orderHelper.assignDeliveryExecutive(req, res);
})

module.exports = router;

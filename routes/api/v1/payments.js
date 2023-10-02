const {
  createPaymentIntentController,
} = require("../../../controllers/paymentController");

router.post("/create-payment-intent", createPaymentIntentController);

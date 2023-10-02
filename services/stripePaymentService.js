// Load User model
const User = require("../models/User");

// Stripe
const { STRIPE_API_KEY } = process.env;
const stripe = require("stripe")(STRIPE_API_KEY);

const stripeCreatePaymentIntent = async () => {
  try {
    let user;
    if (req.session && req.session.passport && req.session.passport.user) {
      user = await User.findById(req.session.passport.user);
    }
    const { amount, currency, paymentMethod, customer } = req.body;

    const payment_intent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethod,
      customer,
    });

    if (user) {
      const existingPaymentIntent = user.payment_intents.find(
        (intent) => intent.id === payment_intent.id
      );
      if (existingPaymentIntent) {
        return res.json({ error: "Payment intent already exists" });
      }

      user.payment_intents.push(payment_intent);

      await user.save();
    }

    res.json({ payment_intent });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { stripeCreatePaymentIntent };

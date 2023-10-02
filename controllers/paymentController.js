// Load User model
const User = require("../models/User");

// Load Order model
const Order = require("../models/Order");

const { createOrder } = require("./orderController");

// Stripe
const { STRIPE_API_KEY } = process.env;
const stripe = require("stripe")(STRIPE_API_KEY);

var addNumber = require("../utils/utils.js");
const {
  stripeCreatePaymentIntent,
} = require("../services/stripePaymentService");

const createPaymentIntentController = async () => {
  // If stripe
  stripeCreatePaymentIntent();
  // If Paypal

  // If Crypto

  // ...
};

/**
 *
 * OLD
 *
 *  */
var order_number = 0;
/**
 *
 * @desc    create payment intent
 * @route   POST /users/create-payment-intent
 * @access  Public
 * @params  amount, currency, payment_method.id, user.customer_id
 * @returns user, paymentIntent, order, msg
 */
// TODO: add payment provider: stripe, paypal, ...
// TODO: better response
const createPaymentIntent = async (req, res, next) => {
  let {
    payment_method,
    total_amount,
    cart,
    shipping_method,
    shipping_address,
    gateway,
    email,
  } = req.body;
  const { userId } = req.session;
  let user = await User.findById(userId);
  // check total_cart is correct
  // NOTES: amount 1.00 = 100 for Stripe
  let t_c = 0;
  cart.forEach((item) => (t_c = t_c + item.price * item.quantity));
  // console.log(t_c, total_amount)
  if (user && t_c === total_amount) {
    console.log("user create payment intent");
    try {
      if (user.payment_methods.length === 0) {
        res.send({ msg: "Add a payment method first" });
      } else {
        // create payment intent
        order_number++;
        let orders_number = addNumber();
        // console.log(payment_method)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: total_amount * 100,
          currency: "gbp",
          payment_method: payment_method.id,
          customer: user.customer_id,
        });
        // add payment intent to user's payment intents
        // TODO: add payment intent details in order and delete payment_intents array from User model
        // TODO: add address from user.address => don't need admin/user cause admin it's an user and will have an address?
        let card = await stripe.paymentMethods.retrieve(payment_method.id);
        user.payment_intents.push(paymentIntent);
        paymentIntent.card = card.card;
        paymentIntent.card.id = card.id;
        payment_method.type = "card";
        total_amount = (total_amount * 100).toString();
        formattedAmount =
          total_amount.slice(0, total_amount.length - 2) +
          "," +
          total_amount.slice(total_amount.length - 2, total_amount.length);
        let order = new Order({
          orderedBy: {
            id: user._id,
            name: "user.name",
            mobile: "user.mobile",
          },
          address: user.address,
          items: cart,
          number: orders_number,
          payment_intent: paymentIntent,
          shipping_method: shipping_method,
          address: shipping_address,
          total_amountFormatted: formattedAmount,
          total_amount: total_amount,
          payment_method: payment_method,
          status: "to-be-accepted",
        });
        // console.log(shipping_method)
        // console.log(payment_method)
        await user.save();
        await order.save();
        res.send({
          user,
          paymentIntent,
          order,
          msg: "Payment intent created.",
        });
      }
    } catch (error) {
      console.log(error);
      res.send({ msg: error.raw ? error.raw.message : error });
    }
  } else {
    console.log("guest create payment intent");
    try {
      // guest
      /**
       * TODO:
       *
       * create orderController to add / update / delete orders
       *
       */
      let order;
      let orders_number = addNumber();
      if (payment_method) {
        // create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: total_amount * 100,
          currency: "gbp",
          payment_method: payment_method.id,
        });
        // save new order
        total_amount = (total_amount * 100).toString();
        formattedAmount =
          total_amount.slice(0, total_amount.length - 2) +
          "," +
          total_amount.slice(total_amount.length - 2, total_amount.length);
        order = new Order({
          orderedBy: {
            name: `guest${orders_number}`,
            mobile: "077226264",
            id: `guest${orders_number}`,
            email: email,
          },
          number: orders_number,
          address: shipping_address,
          shipping_method: shipping_method,
          items: cart,
          payment_intent: paymentIntent,
          payment_method: payment_method,
          total_amountFormatted: formattedAmount,
          total_amount: total_amount.toString(),
          status: "to-be-accepted",
        });
        // createOrder()
        // console.log(order)
        await order.save();
        if (shipping_method === "pick-up") {
          // if (gateway.stripe) {
          //     order = await stripePayInStore(payment_method, total_amount, cart, shipping_method)
          // }
        }
        if (shipping_method === "delivery") {
          // if (gateway.stripe) {
          //     order = await stripePayDelivery(payment_method, total_amount, shipping_address, cart, shipping_method)
          // }
        }
        res.send({
          msg: "Guest order succeded",
          order,
          paymentIntent,
        });
      } else {
        res.send({ msg: "Missing card" });
      }
    } catch (error) {
      console.log(error);
      res.send({ msg: error.raw ? error.raw.message : error });
    }
  }
};

/**
 *
 * @desc    confirm payment intent
 * @route   POST /users/confirm-payment-intent
 * @access  Public
 * @params  payment_intent
 * @returns user, paymentIntent, order, msg
 */
const confirmPaymentIntent = async (req, res, next) => {
  let { payment_intent } = req.body;
  const { userId } = req.session;
  let user = await User.findById(userId);
  let order = await Order.findOne({ "payment_intent.id": payment_intent.id });
  if (user) {
    try {
      let paymentIntent = await stripe.paymentIntents.confirm(
        payment_intent.id
      );
      console.log(paymentIntent.charges.data[0].id);
      paymentIntent.charges.id = paymentIntent.charges.data[0].id;
      // update user's payment intent
      for (let i = 0; i < user.payment_intents.length; i++) {
        if (user.payment_intents[i].id == paymentIntent.id) {
          user.payment_intents[i] = paymentIntent;
        }
      }
      // update order payment intent status
      order.payment_intent = paymentIntent;
      await user.save();
      await order.save();
      res.send({
        user,
        paymentIntent,
        order,
        msg: "Payment intent confirmed.",
      });
    } catch (error) {
      console.log(error);
      res.send({ msg: error.raw ? error.raw.message : error });
    }
  } else {
    // guest
    try {
      let paymentIntent = await stripe.paymentIntents.confirm(
        payment_intent.id
      );
      paymentIntent.charges.id = paymentIntent.charges.data[0].id;
      let order = await Order.findOne({
        "payment_intent.id": payment_intent.id,
      });
      // update order payment intent status
      order.payment_intent = paymentIntent;
      await order.save();
      res.send({
        msg: "Order completed.",
        paymentIntent,
        order,
      });
    } catch (error) {
      console.log(error);
      res.send({ msg: error.raw ? error.raw.message : error });
    }
  }
};

/**
 *
 * @desc    refund payment intent
 * @route   POST /users/refund-payment-intent
 * @access  Private
 * @params  payment_intent
 * @returns order_refunded, refund, msg
 */
const refundPaymentIntent = async (req, res, next) => {
  let { payment_intent } = req.body;
  let { userId } = req.session;
  let user = await User.findById(userId);
  let order_refunded = await Order.findOne({
    "payment_intent.id": payment_intent.id,
  });
  // console.log(order_refunded)
  console.log(
    order_refunded.payment_intent &&
      order_refunded.payment_intent.status === "succeeded" &&
      // && order_refunded.payment_intent.charges.id
      order_refunded.payment_intent.payment_method != "cash"
  );
  console.log(order_refunded.payment_intent.payment_method === "cash");
  if (user && user.admin) {
    if (
      order_refunded.payment_intent &&
      order_refunded.payment_intent.status === "succeeded" &&
      // && order_refunded.payment_intent.charges.id
      order_refunded.payment_intent.payment_method != "cash"
    ) {
      console.log("Refund user payment");
      let refund = await stripe.refunds.create({
        charge: order_refunded.payment_intent.charges.id,
      });
      order_refunded.accepted = false;
      order_refunded.status = "refunded";
      order_refunded.delivered = false;
      order_refunded.completed = false;
      order_refunded.ready = false;
      order_refunded.payment_intent = refund;
    } else if (order_refunded.payment_intent.payment_method === "cash") {
      console.log("Refund cash");
      order_refunded.accepted = false;
      order_refunded.status = "refunded";
      order_refunded.delivered = false;
      order_refunded.completed = false;
      order_refunded.ready = false;
      order_refunded.payment_intent.status = "refunded";
    }
    await order_refunded.save();
    res.send({ msg: "Order refunded.", order_refunded });
  } else {
    res.send({
      msg: "Please sign in as admin or make an account or missing product",
    });
  }
};

/**
 *
 * @desc    create payment method
 * @route   POST /users/create-payment-method
 * @access  Public
 * @params  type, card
 * @returns user, paymentMethod, msg
 */
const createPaymentMethod = async (req, res, next) => {
  let { type, card } = req.body;
  const { userId } = req.session;
  let user = await User.findById(userId);
  if (user) {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.customer_id,
      type: type,
    });
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: type,
        card: card,
      });
      if (paymentMethods.data.length != 0) {
        paymentMethods.data.forEach(async (payment) => {
          if (payment.fingerprint == paymentMethod.fingerprint) {
            res.send({
              msg: "Payment method already existing, please choose another one or select existing",
            });
          } else {
            user.payment_methods.push({
              id: paymentMethod.id,
              fingerprint: paymentMethod.card.fingerprint,
              last4: paymentMethod.card.last4,
              country: paymentMethod.card.country,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
              brand: paymentMethod.card.brand,
              card_name: card.card_name,
              type: paymentMethod.type,
            });
            await user.save();
            res.send({ user, paymentMethod, msg: "Payment method created" });
          }
        });
      } else {
        const paymentMethod = await stripe.paymentMethods.create({
          type: type,
          card: card,
        });
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: user.customer_id,
        });
        user.payment_methods.push({
          id: paymentMethod.id,
          fingerprint: paymentMethod.card.fingerprint,
          last4: paymentMethod.card.last4,
          country: paymentMethod.card.country,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          brand: paymentMethod.card.brand,
          card_name: card.card_name,
        });
        await user.save();
        res.send({ user, paymentMethod });
      }
    } catch (error) {
      res.send({ msg: error.raw.message ? error.raw.message : error });
    }
  } else {
    // guest
    const paymentMethod = await stripe.paymentMethods.create({
      type: type,
      card: card,
    });

    res.send({
      msg: "Payment method added as a guest",
      paymentMethod,
    });
  }
};

/**
 *
 * @desc    detach payment method
 * @route   POST /users/detach-payment-method
 * @access  Public
 * @params  payment_method
 * @returns user, paymentMethod, msg
 */
const detachPaymentMethod = async (req, res, next) => {
  let { payment_method } = req.body;
  const { userId } = req.session;
  let user = await User.findById(userId);
  if (user) {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(payment_method);
      for (let i = 0; i < user.payment_methods.length; i++) {
        if (user.payment_methods[i].id == payment_method) {
          user.payment_methods.splice(i, 1);
        }
      }
      await user.save();
      res.send({ user, paymentMethod, msg: "Payment method detached" });
    } catch (error) {
      res.send({ msg: error.raw.message ? error.raw.message : error });
    }
  } else {
    res.send({ msg: "No user found, please sign in or sign up first" });
  }
};

const stripePayInStore = async (
  payment_method,
  total_amount,
  cart,
  shipping_method
) => {
  let paymentMethod;
  let paymentIntent;
  let order;
  // create payment method
  paymentMethod = await stripe.paymentMethods.create({
    type: payment_method.type,
    card: payment_method.card,
  });

  // create payment intent
  paymentIntent = await stripe.paymentIntents.create({
    amount: total_amount,
    currency: "gbp",
    payment_method: paymentMethod.id,
  });

  // save new order
  order = new Order({
    orderedBy: {
      name: `guest${
        payment_method.table_number ? payment_method.table_number : order_number
      }`,
      mobile: "077226264",
      id: `guest${
        payment_method.table_number ? payment_method.table_number : order_number
      }`,
    },
    items: cart,
    payment_intent: paymentIntent,
    payment_method: paymentMethod,
    shipping_method: shipping_method,
    total_amount: total_amount,
  });
  await order.save();
  return { order, paymentIntent, paymentMethod };
};

const stripePayDelivery = async (
  payment_method,
  total_amount,
  shipping_address,
  cart,
  shipping_method
) => {
  let paymentMethod;
  let paymentIntent;
  let order;
  // create payment method
  paymentMethod = await stripe.paymentMethods.create({
    type: payment_method.type,
    card: payment_method.card,
  });

  // create payment intent
  paymentIntent = await stripe.paymentIntents.create({
    amount: total_amount,
    currency: "gbp",
    payment_method: paymentMethod.id,
  });

  // save new order
  order = new Order({
    orderedBy: {
      name: `guest${order_number}`,
      mobile: "077226264",
      id: `guest${order_number}`,
    },
    address: shipping_address,
    shipping_method: shipping_method,
    items: cart,
    payment_intent: paymentIntent,
    payment_method: paymentMethod,
    total_amount: total_amount,
  });
  // createOrder()
  console.log(order);
  await order.save();
  return { order, paymentIntent, paymentMethod };
};

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  createPaymentMethod,
  detachPaymentMethod,
  refundPaymentIntent,
  createPaymentIntentController,
};

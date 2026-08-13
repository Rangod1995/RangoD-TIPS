// ==========================================
// server/controllers/paymentController.js
// RangoD AI Engine V7 Enterprise
// Payment Controller
// ==========================================

import {
  initializePayment,
  verifyPayment
} from "../services/paystackService.js";

import User from "../models/User.js";

import Subscription from "../models/Subscription.js";



// ==========================================
// Initialize Subscription Payment
// ==========================================

export async function createSubscriptionPayment(
req,
res
) {

try {


const {
email,
amount,
plan
} =
req.body;



const reference =
`RANGOD-${Date.now()}`;



const payment =
await initializePayment({

email,

amount,

reference,

callback_url:
process.env.PAYSTACK_CALLBACK_URL

});



res.json({

success:true,

reference,

authorization_url:
payment.authorization_url,

access_code:
payment.access_code,

plan

});


}

catch(error) {


res.status(500)
.json({

success:false,

message:
error.message

});


}

}



// ==========================================
// Verify Subscription Payment
// ==========================================

export async function verifySubscriptionPayment(
req,
res
) {

try {


const {
reference
} =
req.params;



const payment =
await verifyPayment(
reference
);



if (
payment.status !== "success"
) {


return res.status(400)
.json({

success:false,

message:
"Payment verification failed"

});


}



const user =
await User.findOne({

email:
payment.customer.email

});



if (!user) {


return res.status(404)
.json({

success:false,

message:
"User not found"

});


}



const expiry =
new Date();



expiry.setMonth(
expiry.getMonth() + 1
);



await Subscription.create({

user:
user._id,

reference,

amount:
payment.amount / 100,

status:
"active",

expiresAt:
expiry

});



user.isPremium =
true;


user.subscription = {

status:
"active",

plan:
"premium",

expiresAt:
expiry

};



await user.save();



res.json({

success:true,

message:
"Subscription activated",

user

});


}

catch(error) {


res.status(500)
.json({

success:false,

message:
error.message

});


}

}



// ==========================================
// Default Export
// ==========================================

export default {

createSubscriptionPayment,

verifySubscriptionPayment

};
// ==========================================
// server/models/Subscription.js
// RangoD AI Engine V7 Enterprise
// Subscription Model
// ==========================================

import mongoose from "mongoose";


const subscriptionSchema =
new mongoose.Schema({

user: {

type:
mongoose.Schema.Types.ObjectId,

ref:
"User",

required:
true

},


reference: {

type:
String,

required:
true,

unique:
true

},


amount: {

type:
Number,

default:
0

},


status: {

type:
String,

enum: [
"active",
"pending",
"expired",
"cancelled"
],

default:
"pending"

},


plan: {

type:
String,

enum: [
"monthly",
"yearly"
],

default:
"monthly"

},


startsAt: {

type:
Date,

default:
Date.now

},


expiresAt: {

type:
Date,

required:
true

},


createdAt: {

type:
Date,

default:
Date.now

}


});


export default mongoose.model(
"Subscription",
subscriptionSchema
);
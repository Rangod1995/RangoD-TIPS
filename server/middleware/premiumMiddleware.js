// ==========================================
// server/middleware/premiumMiddleware.js
// RangoD AI Engine V7 Enterprise
// Premium Access Middleware
// ==========================================

import Subscription from "../models/Subscription.js";



export async function requirePremium(
req,
res,
next
) {

try {


const userId =
req.user?.id;



if (!userId) {


return res.status(401)
.json({

success:false,

message:
"Authentication required"

});


}



const subscription =
await Subscription.findOne({

user:
userId,

status:
"active"

})
.sort({

createdAt:
-1

});



if (!subscription) {


return res.status(403)
.json({

success:false,

message:
"Premium subscription required"

});


}



const now =
new Date();



if (
subscription.expiresAt < now
) {


subscription.status =
"expired";


await subscription.save();



return res.status(403)
.json({

success:false,

message:
"Subscription expired"

});


}



next();


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



export default {

requirePremium

};
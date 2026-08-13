// ==========================================
// server/services/paystackService.js
// RangoD AI Engine V7 Enterprise
// Paystack Payment Service
// ==========================================

import axios from "axios";
import { config } from "../config/env.js";



const paystack =
axios.create({

baseURL:
"https://api.paystack.co",


headers: {

Authorization:
`Bearer ${config.paystackSecret}`,

"Content-Type":
"application/json"

}

});



// ==========================================
// Initialize Payment
// ==========================================

export async function initializePayment({

email,

amount,

reference,

callback_url

}) {


try {


const { data } =
await paystack.post(

"/transaction/initialize",

{

email,

amount:

Math.round(
Number(amount) * 100
),

reference,

callback_url

}

);



return data.data;


}

catch(error) {


console.error(

"Paystack Initialize Error:",

error.response?.data ||
error.message

);


throw error;


}

}



// ==========================================
// Verify Payment
// ==========================================

export async function verifyPayment(
reference
) {


try {


const { data } =
await paystack.get(

`/transaction/verify/${reference}`

);



return data.data;


}

catch(error) {


console.error(

"Paystack Verify Error:",

error.response?.data ||
error.message

);


throw error;


}

}



// ==========================================
// Default Export
// ==========================================

export default {

initializePayment,

verifyPayment

};
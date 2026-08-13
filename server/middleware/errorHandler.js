// ==========================================
// server/middleware/errorHandler.js
// RangoD AI Engine V7 Enterprise
// Global Error Handler
// ==========================================


// ==========================================
// Error Middleware
// ==========================================

export function errorHandler(
error,
req,
res,
next
) {


console.error(
"Server Error:",
error.message
);



res.status(

error.statusCode || 500

)
.json({

success:false,

message:

error.message ||
"Internal Server Error"


});


}



// ==========================================
// Not Found Handler
// ==========================================

export function notFound(
req,
res
) {


res.status(404)
.json({

success:false,

message:
`Route not found: ${req.originalUrl}`

});


}



// ==========================================
// Default Export
// ==========================================

export default {

errorHandler,

notFound

};
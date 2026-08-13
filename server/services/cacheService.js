// ==========================================
// server/services/cacheService.js
// RangoD AI Engine V7 Enterprise
// Memory Cache Service
// ==========================================

const cache = new Map();


// ==========================================
// Get Cache
// ==========================================

export function getCache(
key
) {

const item =
cache.get(key);


if (!item) {

return null;

}


// Expired

if (
Date.now() >
item.expiry
) {

cache.delete(
key
);

return null;

}


return item.value;

}



// ==========================================
// Set Cache
// ==========================================

export function setCache(
key,
value,
duration = 300000
) {

cache.set(

key,

{

value,

expiry:
Date.now() + duration

}

);


return value;

}



// ==========================================
// Delete Cache
// ==========================================

export function deleteCache(
key
) {

return cache.delete(
key
);

}



// ==========================================
// Clear Cache
// ==========================================

export function clearCache() {

cache.clear();

}



// ==========================================
// Cache Stats
// ==========================================

export function getCacheStats() {

return {

size:
cache.size,


keys:
Array.from(
cache.keys()
)

};

}



// ==========================================
// Default Export
// ==========================================

export default {

getCache,

setCache,

deleteCache,

clearCache,

getCacheStats

};
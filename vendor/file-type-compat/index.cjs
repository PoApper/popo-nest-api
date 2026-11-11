const { createRequire } = process.getBuiltinModule('node:module');

// TODO: Remove this adapter and the npm override once nestjs-form-data releases
// a version that directly supports a patched file-type (>=21.3.2).

// Node 24 can load the patched ESM package from CommonJS. Use Node's loader
// here as well as in Jest, whose own loader cannot resolve module-sync exports.
const fileType = createRequire(__filename)('file-type-modern');

// nestjs-form-data still calls the file-type 16 stream API. All detection is
// delegated to upstream file-type 21.3.2, including its ASF and ZIP limits.
exports.stream = fileType.fileTypeStream;
// An explicit named export also supports Nest's native import('file-type').
exports.fileTypeFromBuffer = fileType.fileTypeFromBuffer;

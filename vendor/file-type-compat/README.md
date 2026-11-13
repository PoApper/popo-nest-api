# File type compatibility adapter

`nestjs-form-data` 11.0.1 still uses `file-type` 16's CommonJS `stream()` API.
This adapter maps that call to the patched upstream `fileTypeStream()` API in
`file-type` 21.3.2. It does not implement or copy file format parsers.

The npm override replaces the detectors in `nestjs-form-data` and Nest's file
validation, preserving both the legacy and current API. The
`file-type-modern` npm alias installs the unmodified upstream package, which
fixes both the ASF infinite loop (GHSA-5v7r-6r5c-r473) and ZIP decompression
bomb (GHSA-j47w-4g3g-c36v) vulnerabilities.

Node 24's native module loader handles the ESM dependency. Remove this adapter
and its override once `nestjs-form-data` supports a patched detector directly.
Docker must copy this directory before running `npm ci`.

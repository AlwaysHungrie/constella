# Verifier

This is a rust crate that compiles into wasm code and can be used to verify an attestation document recieved from the wallet i.e. by visiting `/api/v1/config` on the wallet server.

[crate](https://github.com/AlwaysHungrie/constella/verifier/crate) contains the actual certificate verification logic.

[nodejs (example)](https://github.com/AlwaysHungrie/constella/tree/main/verifier/nodejs%20(example)) contains the sample nodejs code to run the wasm generated.

## Compile to WebAssembly

`rustup target add wasm32-unknown-unknown` (if required)

`cargo install wasm-bindgen-cli`

Now you can run:

```
  cargo build --target wasm32-unknown-unknown --release
  wasm-bindgen target/wasm32-unknown-unknown/release/nitro_attestation_verifier.wasm --out-dir ../verifier-js --nodejs
```

You can also compile for web by running `wasm-bindgen target/wasm32-unknown-unknown/release/nitro_attestation_verifier.wasm --out-dir ../verifier-js --web`

## verify_js

`verify_js` is the exported function that needs to be called to verify the attestation document.

It takes 5 arguments:

1. `attestation_doc`: The attestation document to verify i.e. value of `code_attestation` in the response from the wallet server `/api/v1/config`.

2. `nonce`: This is always 0 for the time being (@TODO: fix this).

3. `pcrs`: The 3 pcr values returned by nitro-cli describe-enclave when enclave image is built. It can be found with the `nitro-cli describe-enclave` command if you are building the image yourself (recommended) or is on the main README page.

4. `timestamp`: The current time. This is provided in case we want to validate an outdated attestation document as each attestation document is valid for about 3 hours only since the time of issue.

5. `aws_trusted_root`: The root certificate obtained from aws. It can also be found on the main README page.

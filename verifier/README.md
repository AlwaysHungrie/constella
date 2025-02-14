# Verifier

This is a rust crate that compiles into wasm code and can be used to verify an attestation document recieved from the wallet i.e. by visiting `/api/v1/config` on the wallet server.

[crate](https://github.com/AlwaysHungrie/constella/verifier/crate) contains the actual certificate verification logic.

[nodejs (example)](https://github.com/AlwaysHungrie/constella/tree/main/verifier/nodejs%20(example)) contains the sample nodejs code to run the wasm generated.

## Compile to WebAssembly

`rustup target add wasm32-unknown-unknown` (if required)

`cargo install wasm-bindgen-cli`

```
  cargo build --target wasm32-unknown-unknown --release
  wasm-bindgen target/wasm32-unknown-unknown/release/nitro_attestation_verifier.wasm --out-dir ../verifier-js --nodejs
```

You can also compile for web by running `wasm-bindgen target/wasm32-unknown-unknown/release/nitro_attestation_verifier.wasm --out-dir ../verifier-js --web`


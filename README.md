# Constella

Autonomous wallet for agents. 

[constella.one](https://www.constella.one)

## Verification Information

### AWS Root Certificate

This is to verify if the wallet code currently running on constella.one is running inside a Trusted Execution Environment. 

```
-----BEGIN CERTIFICATE-----
MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYD
VQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4
MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQL
DANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEG
BSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb
48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZE
h8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkF
R+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYC
MQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPW
rfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6N
IwLz3/Y=
-----END CERTIFICATE-----
```

Can also be obtained by visiting [https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip](https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip)


### PCR values

This is to check if the wallet code currently running on constella.one is the exact same code as present in this repository.

```
"PCR0": "294e8442cb9eccf0a6e0f7052cf43b2d294f557628a55d7ba7b0137aa13d944c90bd5f627cb6de29c60b7b861e790ea3",
"PCR1": "0343b056cd8485ca7890ddd833476d78460aed2aa161548e4e26bedf321726696257d623e8805f3f605946b3d8b0c6aa",
"PCR2": "4e805c51312651e9aebd8ea6bed35750f6c21d94110fcc02db66bbd321f605eaf863ba407e513ea93dc3b2b3f9f6922d"
```

Can also be obtained by following the setup instructions and building the wallet in your own nitro enabled instance

### How to verify

The attestation document returned by the wallet will be  
1. Signed by AWS using its root certificate
2. Contain the PCR values of the actual code that is running inside the enclave

The `verifier` module can be used to verify the attestation document against these values.
//! Verifier for nitirding attestation documents
//!
//! ## Edited by
//! @AlwaysHungrie
//!
//! ## Original Authors
//! @asa93 for Eternis.AI
//!
//! ## Licensing and copyright notice
//! See the `LICENSE.markdown` file in the repo for
//! information on licensing and copyright.

//#![no_std]

use base64::{engine::general_purpose::STANDARD, Engine};
use core::convert::TryInto;
use p384::ecdsa::{Signature, VerifyingKey};
use rsa::signature::Verifier;
use rustls::{server::AllowAnyAuthenticatedClient, Certificate, RootCertStore};
use std::collections::BTreeMap;
use thiserror::Error;
use tracing::info;
use wasm_bindgen::prelude::*;
use x509_cert::der::Decode;
use x509_cert::der::Encode;
use x509_parser::prelude::*;

#[derive(Debug, Error)]
pub enum VerificationError {
    #[error("Invalid nonce")]
    InvalidNonce,
    #[error("Invalid PCR {0}")]
    InvalidPCR(usize),
    #[error("X509 certificate verification failed: {0}")]
    X509CertVerificationFailed(String),
    #[error("Signature verification failed: {0}")]
    SignatureVerificationFailed(String),
    #[error("Failed to decode trusted root: {0}")]
    FailedToDecodeTrustedRoot(base64::DecodeError),
    #[error("Payload length bytes conversion failed: {0}")]
    PayloadLengthBytesConversionFailed(core::num::TryFromIntError),
    #[error("Decode X509 certificate failed: {0}")]
    DecodeX509CertFailed(String),
    #[error("Public key DER failed: {0}")]
    PublicKeyDerFailed(String),
    #[error("Invalid public key: {0}")]
    InvalidPublicKey(String),
    #[error("Failed to add trusted root cert: {0}")]
    FailedToAddTrustedRootCert(String),
}

#[derive(Debug, Error)]
pub enum ParseError {
    #[error("Parse document failed: {0}")]
    ParseDocumentFailed(String),
    #[error("Parse payload failed: {0}")]
    ParsePayloadFailed(String),
}

#[derive(Debug, Error)]
pub enum ParseVerificationError {
    #[error("Parse error: {0}")]
    ParseError(ParseError),
    #[error("Verification error: {0}")]
    VerificationError(VerificationError),
}

#[derive(Debug)]
pub struct AttestationDocument {
    pub protected: Vec<u8>,
    pub signature: Vec<u8>,
    pub payload: Vec<u8>,
}

#[derive(Debug)]
pub struct Payload {
    pub module_id: String,
    pub timestamp: u64,
    pub public_key: Vec<u8>,
    pub certificate: Vec<u8>,
    pub cabundle: Vec<Vec<u8>>,
    pub nonce: Vec<u8>,
    pub user_data: Option<Vec<u8>>,
    pub digest: String,
    pub pcrs: Vec<Vec<u8>>,
}

fn verify_x509_cert(
    trusted_root: Vec<u8>,
    cabundle: Vec<Vec<u8>>,
    certificate: Vec<u8>,
    unix_time: u64,
) -> Result<(), VerificationError> {

    if let Ok((_, cert_parsed)) = X509Certificate::from_der(&certificate) {
        println!("Certificate valid from: {}", cert_parsed.validity().not_before);
        println!("Certificate valid until: {}", cert_parsed.validity().not_after);
    }

    let mut certs: Vec<Certificate> = Vec::new();
    for this_cert in cabundle.clone().iter().rev() {
        let cert = Certificate(this_cert.to_vec());
        certs.push(cert);
    }
    let cert = Certificate(certificate.clone());
    certs.push(cert.clone());

    let mut root_store = RootCertStore::empty();
    root_store
        .add(&Certificate(trusted_root.clone()))
        .map_err(|err| VerificationError::FailedToAddTrustedRootCert(err.to_string()))?;

    let verifier = AllowAnyAuthenticatedClient::new(root_store);

    println!("verifying client cert");

    //time is passed as parameter because now() fn doesn't work in wasm
    let duration = std::time::Duration::from_secs(unix_time);
    let datetime = std::time::UNIX_EPOCH + duration;
    let _verified = verifier
        .verify_client_cert(&cert, &certs, datetime)
        .map_err(|err| VerificationError::X509CertVerificationFailed(err.to_string()))?;
    Ok(())
}

fn verify_remote_attestation_signature(
    protected: Vec<u8>,
    signature: Vec<u8>,
    certificate: Vec<u8>,
    payload: Vec<u8>,
) -> Result<(), VerificationError> {
    let cert = x509_cert::Certificate::from_der(&certificate)
        .map_err(|err| VerificationError::DecodeX509CertFailed(err.to_string()))?;

    let public_key = cert
        .tbs_certificate
        .subject_public_key_info
        .to_der()
        .map_err(|err| VerificationError::PublicKeyDerFailed(err.to_string()))?;

    let public_key = &public_key[public_key.len() - 97..];
    let verifying_key = VerifyingKey::from_sec1_bytes(&public_key)
        .map_err(|err| VerificationError::InvalidPublicKey(err.to_string()))?;

    let signature = Signature::from_slice(&signature).expect("Invalid signature");

    const HEADER: [u8; 13] = [132, 106, 83, 105, 103, 110, 97, 116, 117, 114, 101, 49, 68];

    let payload_length_bytes: u8 = (payload.len() + 94 - 4446)
        .try_into()
        .map_err(|err| VerificationError::PayloadLengthBytesConversionFailed(err))?;

    let filler: [u8; 4] = [64, 89, 17, payload_length_bytes];

    let sign_structure = [
        HEADER.as_ref(),
        protected.as_ref(),
        filler.as_ref(),
        payload.as_ref(),
    ]
    .concat();

    verifying_key
        .verify(&sign_structure, &signature)
        .map_err(|err| VerificationError::SignatureVerificationFailed(err.to_string()))?;
    Ok(())
}

pub fn verify(
    attestation_document: AttestationDocument,
    payload: Payload,
    nonce: Vec<u8>,
    pcrs: Vec<Vec<u8>>,
    trusted_root: &str,
    unix_time: u64,
) -> Result<(), VerificationError> {
    if payload.nonce != nonce {
        return Err(VerificationError::InvalidNonce);
    }

    for (i, pcr) in pcrs.iter().enumerate() {
        if pcr != &vec![0 as u8; 48] && pcr != &payload.pcrs[i] {
            return Err(VerificationError::InvalidPCR(i));
        }
    }

    let trusted_root = STANDARD
        .decode(trusted_root)
        .map_err(|err| VerificationError::FailedToDecodeTrustedRoot(err))?;

    verify_x509_cert(
        trusted_root,
        payload.cabundle,
        payload.certificate.clone(),
        unix_time,
    )
    .map_err(|err| VerificationError::X509CertVerificationFailed(err.to_string()))?;

    verify_remote_attestation_signature(
        attestation_document.protected,
        attestation_document.signature,
        payload.certificate,
        attestation_document.payload,
    )
    .map_err(|err| VerificationError::SignatureVerificationFailed(err.to_string()))?;

    Ok(())
}

pub fn parse_document(document_data: &Vec<u8>) -> Result<AttestationDocument, ParseError> {
    let cbor: serde_cbor::Value = serde_cbor::from_slice(document_data)
        .map_err(|err| ParseError::ParseDocumentFailed(err.to_string()))?;
    let elements = match cbor {
        serde_cbor::Value::Array(elements) => elements,
        _ => panic!("AttestationVerifier::parse Unknown field cbor:{:?}", cbor),
    };
    let protected = match &elements[0] {
        serde_cbor::Value::Bytes(prot) => prot,
        _ => panic!(
            "AttestationVerifier::parse Unknown field protected:{:?}",
            elements[0]
        ),
    };
    let _unprotected = match &elements[1] {
        serde_cbor::Value::Map(unprot) => unprot,
        _ => panic!(
            "AttestationVerifier::parse Unknown field unprotected:{:?}",
            elements[1]
        ),
    };
    let payload = match &elements[2] {
        serde_cbor::Value::Bytes(payld) => payld,
        _ => panic!(
            "AttestationVerifier::parse Unknown field payload:{:?}",
            elements[2]
        ),
    };
    let signature = match &elements[3] {
        serde_cbor::Value::Bytes(sig) => sig,
        _ => panic!(
            "AttestationVerifier::parse Unknown field signature:{:?}",
            elements[3]
        ),
    };
    Ok(AttestationDocument {
        protected: protected.to_vec(),
        payload: payload.to_vec(),
        signature: signature.to_vec(),
    })
}

pub fn parse_payload(payload: &Vec<u8>) -> Result<Payload, ParseError> {
    let document_data: serde_cbor::Value = serde_cbor::from_slice(payload.as_slice())
        .map_err(|err| ParseError::ParsePayloadFailed(err.to_string()))?;
    let document_map: BTreeMap<serde_cbor::Value, serde_cbor::Value> = match document_data {
        serde_cbor::Value::Map(map) => map,
        _ => {
            return Err(ParseError::ParsePayloadFailed(format!(
                "AttestationVerifier::parse_payload field ain't what it should be:{:?}",
                document_data
            )))
        }
    };
    let module_id = match document_map.get(&serde_cbor::Value::Text(
        "module_id".try_into().expect("module_id_fail"),
    )) {
        Some(serde_cbor::Value::Text(val)) => val.to_string(),
        _ => {
            return Err(ParseError::ParsePayloadFailed(format!(
                "AttestationVerifier::parse_payload module_id is wrong type or not present"
            )))
        }
    };
    let timestamp: i128 = match document_map.get(&serde_cbor::Value::Text("timestamp".to_string()))
    {
        Some(serde_cbor::Value::Integer(val)) => *val,
        _ => {
            return Err(ParseError::ParsePayloadFailed(format!(
                "AttestationVerifier::parse_payload timestamp is wrong type or not present"
            )))
        }
    };
    let timestamp: u64 = timestamp.try_into().map_err(|err| {
        ParseError::ParsePayloadFailed(format!(
            "AttestationVerifier::parse_payload failed to convert timestamp to u64:{:?}",
            err
        ))
    })?;
    let public_key: Vec<u8> =
        match document_map.get(&serde_cbor::Value::Text("public_key".to_string())) {
            Some(serde_cbor::Value::Bytes(val)) => val.to_vec(),
            Some(_null) => vec![],
            _ => {
                return Err(ParseError::ParsePayloadFailed(format!(
                    "AttestationVerifier::parse_payload public_key is wrong type or not present"
                )))
            }
        };
    let certificate: Vec<u8> =
        match document_map.get(&serde_cbor::Value::Text("certificate".to_string())) {
            Some(serde_cbor::Value::Bytes(val)) => val.to_vec(),
            _ => {
                return Err(ParseError::ParsePayloadFailed(format!(
                    "AttestationVerifier::parse_payload certificate is wrong type or not present"
                )))
            }
        };
    let pcrs: Vec<Vec<u8>> = match document_map.get(&serde_cbor::Value::Text("pcrs".to_string())) {
        Some(serde_cbor::Value::Map(map)) => {
            let mut ret_vec: Vec<Vec<u8>> = Vec::new();
            let num_entries: i128 = map.len().try_into().map_err(|err| {
                ParseError::ParsePayloadFailed(format!(
                    "AttestationVerifier::parse_payload failed to convert pcrs len into i128:{:?}",
                    err
                ))
            })?;
            for x in 0..num_entries {
                match map.get(&serde_cbor::Value::Integer(x)) {
                    Some(serde_cbor::Value::Bytes(inner_vec)) => {
                        ret_vec.push(inner_vec.to_vec());
                    }
                    _ => {
                        //println!("PCR: None value");
                        // return Err(ParseError::ParsePayloadFailed(format!(
                        //     "AttestationVerifier::parse_payload pcrs inner vec is wrong type or not there?"
                        // )));
                    }
                }
            }
            ret_vec
        }
        _ => {
            return Err(ParseError::ParsePayloadFailed(format!(
                "AttestationVerifier::parse_payload pcrs is wrong type or not present"
            )))
        }
    };

    // let nonce = match document_map.get(&serde_cbor::Value::Text("nonce".to_string())) {
    //     Some(serde_cbor::Value::Bytes(val)) => val.to_vec(),
    //     _ => {
    //         return Err(ParseError::ParsePayloadFailed(format!(
    //             "AttestationVerifier::parse_payload nonce is wrong type or not present"
    //         )))
    //     }
    // };
    // skip nonce for now
    let nonce = vec![0; 20];

    let user_data: Option<Vec<u8>> =
        match document_map.get(&serde_cbor::Value::Text("user_data".to_string())) {
            Some(serde_cbor::Value::Bytes(val)) => Some(val.to_vec()),
            None => None,
            Some(_null) => None,
        };
    let digest: String = match document_map.get(&serde_cbor::Value::Text("digest".to_string())) {
        Some(serde_cbor::Value::Text(val)) => val.to_string(),
        _ => {
            return Err(ParseError::ParsePayloadFailed(format!(
                "AttestationVerifier::parse_payload digest is wrong type or not present"
            )))
        }
    };
    let cabundle: Vec<Vec<u8>> =
        match document_map.get(&serde_cbor::Value::Text("cabundle".to_string())) {
            Some(serde_cbor::Value::Array(outer_vec)) => {
                let mut ret_vec: Vec<Vec<u8>> = Vec::new();
                for this_vec in outer_vec.iter() {
                    match this_vec {
                        serde_cbor::Value::Bytes(inner_vec) => {
                            ret_vec.push(inner_vec.to_vec());
                        }
                        _ => {
                            return Err(ParseError::ParsePayloadFailed(format!(
                                "AttestationVerifier::parse_payload inner_vec is wrong type"
                            )))
                        }
                    }
                }
                ret_vec
            }
            _ => {
                return Err(ParseError::ParsePayloadFailed(format!(
                    "AttestationVerifier::parse_payload cabundle is wrong type or not present:{:?}",
                    document_map.get(&serde_cbor::Value::Text("cabundle".to_string()))
                )))
            }
        };
    Ok(Payload {
        module_id,
        timestamp,
        public_key,
        certificate,
        cabundle,
        nonce,
        user_data,
        digest,
        pcrs,
    })
}

pub fn parse_verify_with(
    document_data: Vec<u8>,
    nonce: Vec<u8>,
    pcrs: Vec<Vec<u8>>,
    unix_time: u64,
    trusted_root: &str
) -> Result<(), ParseVerificationError> {
    let attestation_document =
        parse_document(&document_data).map_err(ParseVerificationError::ParseError)?;

    let payload =
        parse_payload(&attestation_document.payload).map_err(ParseVerificationError::ParseError)?;

    verify(attestation_document, payload, nonce, pcrs, trusted_root, unix_time)
        .map_err(ParseVerificationError::VerificationError)?;
    Ok(())
}

// #[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn verify_js(attestation_document: Vec<u8>, nonce: Vec<u8>, pcrs: js_sys::Array, unix_time: u64, trusted_root: &str) -> bool {
    info!("🔍 Verify js..  ");
    info!("attestation_document: {:?}", attestation_document);
    info!("nonce: {:?}", nonce);
    info!("pcrs: {:?}", pcrs);

    println!("verify_js");
    println!("attestation_document: {:?}", attestation_document);
    println!("nonce: {:?}", nonce);
    println!("pcrs: {:?}", pcrs);

    let pcrs: Vec<Vec<u8>> = pcrs
        .iter()
        .map(|item| js_sys::Uint8Array::new(&item).to_vec())
        .collect();

    // let unix_time = (js_sys::Date::now() / 1000.0) as u64;
    
    // let parsed_document = parse_document(&attestation_document).expect("parse document failed");

    // let payload = parse_payload(&parsed_document.payload).expect("parse payload failed");

    let result = parse_verify_with(attestation_document, nonce, pcrs, unix_time, trusted_root)
        .map_err(|err: ParseVerificationError| JsValue::from_str(&err.to_string()));

    return result.is_ok();
}

#[cfg(test)]
mod tests {

    use super::*;
    use hex;
    #[test]
    fn test_verify() {
        let unix_time = std::time::UNIX_EPOCH.elapsed().unwrap().as_secs();

        // 9 hours ago
        // unix_time -= 2 * 60 * 60;
        
        // let unix_time = 1734662485;
        // use an older unix_time to test a expired cert
        // the cert below is probably expired by the time you run this test

        let trusted_root = "MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTELMAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYDVQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQLDANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEGBSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZEh8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkFR+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYCMQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPWrfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6NIwLz3/Y=";
        let document_data  = STANDARD.decode("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")
            .expect("decode cbor document failed");

        println!("document_data {:?}", document_data);

        let mut pcrs = vec![vec![0; 48]; 16];
        pcrs.insert(
            2,
            vec![
                78, 128,  92,  81,  49,  38,  81, 233, 174, 189, 142, 166, 190, 211, 87,  80, 246, 194,  29, 148,17,  15, 204,   2, 219, 102, 187, 211,  33, 246,5, 234, 248,  99, 186,  64, 126,  81,  62, 169, 61, 195, 178, 179, 249, 246, 146,  45
            ]
            .to_vec(),
        );
        let nonce =
            hex::decode("0000000000000000000000000000000000000000").expect("decode nonce failed");

        let document = parse_document(&document_data).expect("parse document failed");

        let payload = parse_payload(&document.payload).expect("parse payload failed");

        println!("pcrs {:?}", payload.pcrs);
        println!("nonce {:?}", nonce);

        match parse_verify_with(document_data, nonce, pcrs, unix_time, &trusted_root) {
            Ok(_) => (),
            Err(e) => panic!("parse_verify_with failed: {:?}", e.to_string()),
        }
    }
}

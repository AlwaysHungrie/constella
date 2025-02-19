// This example demonstrates how to verify a presentation. See `present.rs` for
// an example of how to build a presentation from an attestation and connection
// secrets.

mod config;

use std::time::Duration;

use tlsn_core::{
    presentation::{Presentation, PresentationOutput},
    signing::VerifyingKey,
    CryptoProvider,
};
use config::Config;
use tracing::debug;

use reqwest::Client;

async fn fetch_presentation(agent_host: String, file_key: String) -> Result<Presentation, Box<dyn std::error::Error>> {
    let client = Client::new();

    let presigned_url_endpoint = format!("{}/presigned-url?key={}", agent_host.trim_end_matches('/'), file_key);
    
    // First get the presigned URL
    let presigned_url_response_data = client
        .get(presigned_url_endpoint)
        .send()
        .await?
        .text()
        .await?;
        
    let presigned_url_response: serde_json::Value = serde_json::from_str(&presigned_url_response_data)?;
    let presigned_url = presigned_url_response["downloadUrl"].as_str().ok_or("downloadUrl not found")?;
    
    // Download the file using the presigned URL
    let presentation_bytes = client
        .get(presigned_url)
        .send()
        .await?
        .bytes()
        .await?;

    // Deserialize the presentation
    let presentation: Presentation = bincode::deserialize(&presentation_bytes)?;
    Ok(presentation)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::new();

    let agent_host = config.agent_host;
    let file_key = config.file_key;

    let presentation = fetch_presentation(agent_host, file_key).await?;

    // let file_path = config.file_path.unwrap();
    // Read the presentation from disk.
    // let presentation: Presentation = bincode::deserialize(&std::fs::read(file_path)?)?;

    let provider = CryptoProvider::default();

    let VerifyingKey {
        alg,
        data: key_data,
    } = presentation.verifying_key();

    debug!(
        "Verifying presentation with {alg} key: {}\n\n**Ask yourself, do you trust this key?**\n",
        hex::encode(key_data)
    );

    let mut decoded = serde_json::json!({
        "verifying_key": hex::encode(key_data)
    });

    // Verify the presentation.
    let PresentationOutput {
        server_name,
        connection_info,
        transcript,
        ..
    } = presentation.verify(&provider).unwrap();

    // The time at which the connection was started.
    let time = chrono::DateTime::UNIX_EPOCH + Duration::from_secs(connection_info.time);
    let server_name = server_name.unwrap();
    let mut partial_transcript = transcript.unwrap();
    // Set the unauthenticated bytes so they are distinguishable.
    partial_transcript.set_unauthed(b'X');

    let sent = String::from_utf8_lossy(partial_transcript.sent_unsafe());
    let recv = String::from_utf8_lossy(partial_transcript.received_unsafe());

    decoded["sent"] = serde_json::Value::String(sent.to_string());
    decoded["recv"] = serde_json::Value::String(recv.to_string());
    decoded["server_name"] = serde_json::Value::String(server_name.to_string());
    decoded["time"] = serde_json::Value::String(time.to_string());

    println!("{}", serde_json::to_string(&decoded)?);
    Ok(())
}

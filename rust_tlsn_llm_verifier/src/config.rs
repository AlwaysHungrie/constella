use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Config {
    #[arg(long, default_value = "")]
    pub file_key: String,

    #[arg(long, default_value = "")]
    pub agent_host: String,

    #[arg(long)]
    pub file_path: Option<PathBuf>,
}

impl Config {
    pub fn new() -> Self {
        let config = Config::parse();
        config
    }
}

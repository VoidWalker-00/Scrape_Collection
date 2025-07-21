use tokio::net::UnixListener;
use tokio::io::{AsyncBufReadExt, BufReader};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let path = "/tmp/logger.sock";

    // Remove old socket file if it exists
    let _ = std::fs::remove_file(path);

    let listener = UnixListener::bind(path)?;
    println!("Listening on {}", path);

    loop {
        let (stream, _) = listener.accept().await?;
        println!("Client connected!");

        // For each client, spawn a task to read lines
        tokio::spawn(async move {
            let reader = BufReader::new(stream);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                println!("LOG: {}", line);
            }

            println!("Client disconnected");
        });
    }
}

// server.rs
use tokio::net::UnixListener;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc::Sender;
// use std::error::Error;

pub async fn server_unix(tx: Sender<String>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let path = "/tmp/logger.sock";
    let _ = std::fs::remove_file(path);
    let listener = UnixListener::bind(path)?;
    println!("Listening on {}", path);

    loop {
        let (stream, _) = listener.accept().await?;
        println!("Client connected!");

        let mut tx = tx.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stream);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                let _ = tx.send(line).await;
            }

            println!("Client disconnected");
        });
    }
}

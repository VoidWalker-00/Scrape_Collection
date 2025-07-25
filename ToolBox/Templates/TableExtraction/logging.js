import fs from "fs";
import net from "net";

export class SocketServer {
  /**
   * @param {Object} options
   * @param {string} [options.socketPath] - Unix socket path, e.g. '/tmp/logger.sock'
   * @param {Object} [options.tcp] - { host, port } for TCP server
   * @param {Function} [options.onLog] - Callback for each log line received
   */
  constructor(socketPath) {
    this.socketPath = socketPath;
    this.connected = false;
    this.queue = [];
    this.socket = net.createConnection(socketPath);

    this.socket.on("connect", () => {
      this.connected = true;
      // Flush any queued messages
      while (this.queue.length) {
        this.socket.write(this.queue.shift());
      }
    });

    this.socket.on("error", (err) => {
      this.connected = false;
      // Optionally log socket error to console, or retry/reconnect logic here
      console.error(`[SocketClient] Socket error: ${err.message}`);
    });

    this.socket.on("close", () => {
      this.connected = false;
    });
  }

  send(message, type, level = null) {
    if (level == null) {
      message = JSON.stringify({
        Type: type,
        Message: message,
      });
    }
    message = JSON.stringify({
      Type: type,
      Level: level,
      Message: message,
    });

    console.log("[SocketClient] Sending message:", message);
    if (this.connected) {
      this.socket.write(message);
    } else {
      this.queue.push(message);
    }
  }

  close() {
    this.socket.end();
  }
}

export class Logger {
  constructor({ socketClient, logFile, useConsole = true }) {
    this.socketClient = socketClient;
    this.useConsole = useConsole;
    this.fileStream = logFile
      ? fs.createWriteStream(logFile, { flags: "a" })
      : null;
    this.closed = false;
  }

  _format(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  async log(level, message) {
    if (this.closed) return;
    const logStr = this._format(level, message);

    // Console logging (sync)
    if (this.useConsole) {
      if (level === "error") console.error(logStr);
      else if (level === "warn") console.warn(logStr);
      else console.log(logStr);
    }
    // Socket logging (sync for Node's net.write, but could be made more robust)
    if (this.socketClient) {
      this.socketClient.send("Log", logStr + "\n", level);
    }
    // File logging (async for safety)
    if (this.fileStream && !this.fileStream.writableEnded) {
      this.fileStream.write(logStr + "\n");
    }
  }

  async info(msg) {
    await this.log("info", msg);
  }
  async warn(msg) {
    await this.log("warn", msg);
  }
  async error(msg) {
    await this.log("error", msg);
  }

  // Async close for file and socket
  close() {
    this.closed = true;
    return Promise.all([
      new Promise((res) =>
        this.fileStream && !this.fileStream.writableEnded
          ? this.fileStream.end(res)
          : res(),
      ),
      new Promise((res) =>
        this.socketClient ? this.socketClient.close(res) : res(),
      ),
    ]);
  }
}

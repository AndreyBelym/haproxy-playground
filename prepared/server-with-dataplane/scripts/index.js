import http from "http";
import { disableCurrentServer, enableCurrentServer } from "./haproxy-client.js";

process.env.PORT ||= 1337;

class RequestHandler {
  async info() {
    return process.env.HOSTNAME + "\n";
  }

  async work() {
    await disableCurrentServer();

    const start = Date.now();
    let i = 0;

    while (Date.now() - start < 10000) {
      i++;
    }

    await enableCurrentServer();

    return String(i) + "\n";
  }
}

const handler = new RequestHandler();

http
  .createServer(async (req, res) => {
    res.writeHead(200);
    switch (req.url) {
      case "/info":
        res.write(await handler.info());
        break;
      case "/work":
        res.write(await handler.work());
        break;
      default:
        break;
    }
    res.end();
  })
  .listen(+process.env.PORT);

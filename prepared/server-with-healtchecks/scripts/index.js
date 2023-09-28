const { setTimeout: delay } = require("timers/promises");
const http = require("http");

process.env.PORT ||= 1337;

class RequestHandler {
  constructor() {
    this.pendingActions = [];
    this.state = "free";
  }

  async _startPendingActions() {
    this.state = "busy";

    await delay(0);

    while (this.pendingActions.length) {
      const action = this.pendingActions.shift();

      await action();
    }

    this.state = "free";
  }

  async _executeAction(action) {
    if (this.state === "free") {
      this.state = "pending";
    }

    return new Promise((resolve, reject) => {
      this.pendingActions.push(() => {
        return Promise.resolve(action()).then(resolve).catch(reject);
      });
    });
  }

  healtcheck() {
    if (this.state === "pending") {
      this._startPendingActions();
    }

    const result = this.state === "free" ? "free" : "busy";

    console.log("healtcheck", result, process.env.HOSTNAME);

    return result;
  }

  async info() {
    console.log("info", process.env.HOSTNAME);
    return process.env.HOSTNAME + "\n";
  }

  async work() {
    console.log("work started", process.env.HOSTNAME);
    const result = await this._executeAction(() => {
      const start = Date.now();
      let i = 0;

      while (Date.now() - start < 10000) {
        i++;
      }

      return String(i) + "\n";
    });
    console.log("work done", process.env.HOSTNAME);
    return result;
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
      case "/healthcheck":
        res.write(await handler.healtcheck());
        break;
      default:
        break;
    }
    res.end();
  })
  .listen(+process.env.PORT);

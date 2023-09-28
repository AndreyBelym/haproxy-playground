import { setTimeout as delay } from "timers/promises";
import { networkInterfaces } from "os";

const query = async (url, method, body) => {
  const response = await fetch(process.env.HAPROXY_API + "/v2" + url, {
    method,
    body,
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.HAPROXY_USER + ":" + process.env.HAPROXY_PASSWORD
        ).toString("base64"),
    },
  });

  return response.json();
};

export const getServers = async () =>
  query(
    `/services/haproxy/runtime/servers?backend=${process.env.HAPROXY_BACKEND}`
  );

export const disableServer = async (server) =>
  query(
    `/services/haproxy/runtime/servers/${server}?backend=${process.env.HAPROXY_BACKEND}`,
    "PUT",
    JSON.stringify({
      operational_state: "down",
    })
  );

export const enableServer = async (server) =>
  query(
    `/services/haproxy/runtime/servers/${server}?backend=${process.env.HAPROXY_BACKEND}`,
    "PUT",
    JSON.stringify({
      operational_state: "up",
    })
  );

export const getCurrentServer = async () => {
  const servers = await getServers();
  const interfaces = [].concat(...Object.values(networkInterfaces()));

  return servers.find((server) =>
    interfaces.some(({ address }) => server.address === address)
  );
};

export const disableCurrentServer = async () => {
  let server = null;

  while (!server) {
    try {
      server = await getCurrentServer();
    } catch (error) {
      console.error(error);
    }
  }

  await disableServer(server.name);

  while (server.operational_state !== "down") {
    await delay(100);

    server = await getCurrentServer();
  }
};

export const enableCurrentServer = async () => {
  let server = null;

  while (!server) {
    try {
      server = await getCurrentServer();
    } catch (error) {
      console.error(error);
    }
  }

  await enableServer(server.name);

  while (server.operational_state !== "up") {
    await delay(100);

    server = await getCurrentServer();
  }
};

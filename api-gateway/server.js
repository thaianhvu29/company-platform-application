const express = require("express");
const client = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3000;

client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: "api_gateway_requests_total",
  help: "Total requests handled by API Gateway",
  labelNames: ["method", "route", "status"]
});

app.use((req, res, next) => {
  res.on("finish", () => {
    requestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  next();
});

app.get("/", (req, res) => {
  res.json({
    service: "api-gateway",
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "api-gateway"
  });
});

app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready"
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`api-gateway running on port ${PORT}`);
});

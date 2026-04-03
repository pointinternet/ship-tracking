const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

let ships = {};

const ais = new WebSocket("wss://stream.aisstream.io/v0/stream");

ais.on("open", () => {
  console.log("Connected to AIS");

  ais.send(JSON.stringify({
    APIKey: process.env.AIS_KEY,
    BoundingBoxes: [[[6, 68], [37, 97]]],
    FilterMessageTypes: ["PositionReport"]
  }));
});

ais.on("message", (data) => {
  const msg = JSON.parse(data);

  if (msg.MessageType === "PositionReport") {
    const s = msg.Message.PositionReport;

    ships[s.UserID] = {
      mmsi: s.UserID,
      lat: s.Latitude,
      lng: s.Longitude,
      speed: s.Sog
    };
  }
});

app.get("/ships", (req, res) => {
  res.json(Object.values(ships));
});

app.listen(5000, () => console.log("Server running"));

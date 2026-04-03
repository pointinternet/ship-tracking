const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

let ships = {};

function connectAIS() {
  const ais = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ais.on("open", () => {
    console.log("✅ Connected to AIS");

    ais.send(JSON.stringify({
      APIKey: process.env.AIS_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
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

      console.log("🚢 Ships:", Object.keys(ships).length);
    }
  });

  ais.on("close", () => {
    console.log("❌ AIS Disconnected → Reconnecting...");
    setTimeout(connectAIS, 5000);
  });

  ais.on("error", (err) => {
    console.log("⚠️ AIS Error:", err.message);
    ais.close();
  });
}

// 👇 IMPORTANT: CALL THE FUNCTION
connectAIS();
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
app.get("/", (req, res) => {
  res.send("🚢 Ship Tracker API is Running");
});
app.get("/ships", (req, res) => {
  res.json(Object.values(ships));
});

app.listen(5000, () => console.log("Server running"));

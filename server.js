const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// Store ships
let ships = {};

// ✅ AIS CONNECTION WITH DEBUG + AUTO RECONNECT
function connectAIS() {
  const ais = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ais.on("open", () => {
    console.log("✅ Connected to AIS");

    ais.send(JSON.stringify({
      APIKey: process.env.AIS_KEY,
      BoundingBoxes: [[[0, 60], [40, 100]]],
      FilterMessageTypes: ["PositionReport"]
    }));

    console.log("📡 Subscription sent");
  });

  ais.on("message", (data) => {
    try {
      // 🔥 RAW DATA LOG (VERY IMPORTANT)
      console.log("RAW DATA:", data.toString());

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

    } catch (err) {
      console.log("❌ Parse error:", err.message);
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

// 🚀 Start AIS
connectAIS();

// ✅ ROUTES
app.get("/", (req, res) => {
  res.send("🚢 Ship Tracker API Running");
});

app.get("/ships", (req, res) => {
  res.json(Object.values(ships));
});

app.get("/status", (req, res) => {
  res.json({ ships: Object.keys(ships).length });
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

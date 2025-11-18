require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const Measurement = require("./models/Measurement");
const { DateTime } = require('luxon');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("DB connection error:", err));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>KI401 Osadchuk</title>
      <style>
        body {
          background-color:rgb(126, 162, 194);
          font-family: sans-serif;
          text-align: center;
          margin-top: 20%;
        }
        h1 {
          color: #333;
        }
      </style>
    </head>
    <body>
      <h1>Сервер працює!</h1>
    </body>
    </html>
  `);
});

// app.get("/api/data", async (req, res) => {
//   const { range = "week" } = req.query;

//   try {
//     if (range === "3hours") {
//       const latest = await Measurement.findOne().sort({ time: -1 }).lean();

//       if (!latest) {
//         return res.status(404).json({ message: "No latest data" });
//       }

//       const latestTime = new Date(latest.time);
//       const targetTime = new Date(latestTime.getTime() - 3 * 60 * 60 * 1000); // Цільовий час — 3 год тому

//       // Вікно для пошуку запису близько до цільового часу: +/- година
//       const windowStart = new Date(targetTime.getTime() - 60 * 60 * 1000);
//       const windowEnd = new Date(targetTime.getTime() + 60 * 60 * 1000);

//       const candidates = await Measurement.find({
//         time: { $gte: windowStart, $lte: windowEnd },
//       })
//         .sort({ time: 1 })
//         .lean();

//       if (!candidates.length) {
//         return res.status(404).json({ message: "No data 3 hours ago" });
//       }

//       const closest = candidates.reduce((prev, curr) =>
//         Math.abs(new Date(curr.time) - targetTime) <
//         Math.abs(new Date(prev.time) - targetTime)
//           ? curr
//           : prev
//       );

//       if (
//         new Date(closest.time).getTime() === new Date(latest.time).getTime()
//       ) {
//         return res.status(404).json({ message: "Insufficient distinct data" });
//       }

//       return res.json([closest, latest]);
//     }

//     const now = new Date();
//     let fromDate;

//     switch (range) {
//       case "month":
//         fromDate = new Date(now.setDate(now.getDate() - 30));
//         break;
//       case "6months":
//         fromDate = new Date(now.setMonth(now.getMonth() - 6));
//         break;
//       case "year":
//         fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
//         break;
//       case "week":
//       default:
//         fromDate = new Date(Date.now() - 604800000);
//         break;
//     }

//     const data = await Measurement.find({ time: { $gte: fromDate } }).sort({
//       time: 1,
//     });
//     res.json(data);
//   } catch (err) {
//     console.error("Error fetching measurements:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// --- API для отримання історії даних (з агрегацією) ---

app.get("/", async (req, res) => {
  try {
    const { range } = req.query;
    let startDate = new Date();
    let granularity = "raw"; 

    switch (range) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        granularity = "raw"; //  всі дані
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        granularity = "hour"; //  усереднити по годинах
        break;
      case "half_year":
        startDate.setMonth(startDate.getMonth() - 6);
        granularity = "day"; //  середнє за добу
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        granularity = "day"; // середнє за добу
        break;
      case "all":
        startDate = new Date(0); 
        granularity = "day"; // середнє за добу
        break;
      default:
        // За замовчуванням - тиждень
        startDate.setDate(startDate.getDate() - 7);
    }

    if (granularity === "raw") {
      const data = await Measurement.find({
        time: { $gte: startDate },
      })
        .sort({ time: 1 }) 
        .select("time htuT htuH bmeT bmeH bmeP -_id"); 

      return res.json(data);
    }

    const groupByFormat =
      granularity === "day" ? "%Y-%m-%d" : "%Y-%m-%d-%H";

    const aggregatedData = await Measurement.aggregate([
      {
        $match: {
          time: { $gte: startDate }, // Фільтр за датою
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: "$time",
              timezone: "Europe/Kyiv", 
            },
          },
          // мітка часу для графіка
          time: { $min: "$time" },
          // середні значення
          htuT: { $avg: "$htuT" },
          htuH: { $avg: "$htuH" },
          bmeT: { $avg: "$bmeT" },
          bmeH: { $avg: "$bmeH" },
          bmeP: { $avg: "$bmeP" },
        },
      },
      {
        $sort: { time: 1 }, 
      },
      {
        $project: {
          _id: 0, 
          time: 1,
          htuT: { $round: ["$htuT", 2] }, 
          htuH: { $round: ["$htuH", 2] },
          bmeT: { $round: ["$bmeT", 2] },
          bmeH: { $round: ["$bmeH", 2] },
          bmeP: { $round: ["$bmeP", 2] },
        },
      },
    ]);

    res.json(aggregatedData);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/api/data/latest", async (req, res) => {
  try {
    const latest = await Measurement.findOne().sort({ time: -1 });
    if (!latest) {
      return res.status(404).json({ message: "No data found" });
    }
    res.json(latest);
  } catch (err) {
    console.error("Error fetching latest measurement:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/api/data", async (req, res) => {
  const { time, htuT, htuH, bmeT, bmeH, bmeP } = req.body;

  console.log("Request:", req.body);

  if (
    !time ||
    !Number.isFinite(htuT) ||
    !Number.isFinite(htuH) ||
    !Number.isFinite(bmeT) ||
    !Number.isFinite(bmeH) ||
    !Number.isFinite(bmeP)
  ) {
    return res.status(400).json({ message: "Invalid data format" });
  }

  // Kyiv time convert to UTC
  const dt = DateTime.fromISO(time, { zone: 'Europe/Kyiv' });
  if (!dt.isValid) {
    return res.status(400).json({ message: 'Invalid time format' });
  }
  const parsedTime = dt.toUTC().toJSDate();

  try {
    const newMeasurement = new Measurement({
      time: parsedTime,
      htuT,
      htuH,
      bmeT,
      bmeH,
      bmeP,
    });

    await newMeasurement.save();
    console.log("Data saved successfully");

    res.status(201).json({ message: "Data saved successfully" });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

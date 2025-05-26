require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const Measurement = require('./models/Measurement');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// Підключення до DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to DB'))
  .catch((err) => console.error('DB connection error:', err));

app.get('/', (req, res) => {
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

// POST /api/data 
app.post('/api/data', async (req, res) => {
  const { time, htuT, htuH, bmeT, bmeH, bmeP } = req.body;

  console.log('Request:', req.body);

  if (
    !time ||
    !Number.isFinite(htuT) ||
    !Number.isFinite(htuH) ||
    !Number.isFinite(bmeT) ||
    !Number.isFinite(bmeH) ||
    !Number.isFinite(bmeP)
  ) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  const parsedTime = new Date(time);
  if (isNaN(parsedTime)) {
    return res.status(400).json({ message: 'Invalid time format' });
  }

  try {
    const newMeasurement = new Measurement({
      time: parsedTime,
      htuT,
      htuH,
      bmeT,
      bmeH,
      bmeP
    });

    await newMeasurement.save();
    console.log('Data saved successfully');

    res.status(201).json({ message: 'Data saved successfully' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

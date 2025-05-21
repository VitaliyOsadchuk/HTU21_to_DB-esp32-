require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Measurement = require('./models/Measurement');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Weather Server</title>
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

app.post('/api/data', async (req, res) => {
  const { temperature, humidity, pressure } = req.body;

  if (
    typeof temperature !== 'number' ||
    typeof humidity !== 'number' ||
    typeof pressure !== 'number'
  ) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  try {
    const newMeasurement = new Measurement({ temperature, humidity, pressure });
    await newMeasurement.save();
    res.status(201).json({ message: 'Data saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

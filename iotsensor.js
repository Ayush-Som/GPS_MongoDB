const mongoose = require('mongoose');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const Sensor = require('./models/sensor');

const COMMPORT = '/dev/cu.usbmodem1201';

const port = new SerialPort({ path: `${COMMPORT}`, baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const uri = 'mongodb+srv://user:hello@cluster4.b23y2li.mongodb.net/';

const sensordata = {
  time: '',
  date: '',
  fix: 0,
  quality: 0,
  latitude: '',
  longitude: '',
  speed: 0,
  angle: 0,
  altitude: 0,
  satellites: 0,
  antennaStatus: 0,
};

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    setInterval(sensortest, 10000);
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });

function sensortest() {
  parser.on('data', data => {
    // Check if the data starts with 'Time' (indicating the beginning of a new data set)
    if (data.startsWith('Time')) {
      // Parse the new data set
      parseData(data);
    } else if (!data.startsWith('Invalid data format')) {
      console.error('Invalid data format:', data);
    }
  });
}

function parseData(data) {
  // Split the data into lines
  const lines = data.split('\n');

  // Loop through each line
  for (const line of lines) {
    // Check if the line starts with 'Invalid data format'
    if (line.startsWith('Invalid data format')) {
      console.error(line); // Print the error message
      continue; // Skip processing invalid lines
    }

    const lineParts = line.split(':');

    if (lineParts.length !== 2) {
      console.error('Invalid data format:', line);
      continue;
    }

    const key = lineParts[0].trim();
    const value = lineParts[1].trim();

    switch (key) {
      case 'Time':
        // Parse and store time
        sensordata.time = value;
        break;
      case 'Date':
        // Parse and store date
        sensordata.date = value;
        break;
      case 'Fix':
        // Parse and store fix
        sensordata.fix = parseInt(value);
        break;
      case 'Quality':
        // Parse and store quality
        sensordata.quality = parseInt(value);
        break;
      case 'Location':
        // Parse and store location
        const locationParts = value.split('\t');
        if (locationParts.length === 2) {
          sensordata.latitude = locationParts[0];
          sensordata.longitude = locationParts[1];
        }
        break;
      case 'Speed (knots)':
        // Parse and store speed
        sensordata.speed = parseFloat(value);
        break;
      case 'Angle':
        // Parse and store angle
        sensordata.angle = parseFloat(value);
        break;
      case 'Altitude':
        // Parse and store altitude
        sensordata.altitude = parseFloat(value);
        break;
      case 'Satellites':
        // Parse and store satellites
        sensordata.satellites = parseInt(value);
        break;
      case 'Antenna status':
        // Parse and store antenna status
        sensordata.antennaStatus = parseInt(value);
        break;
      case '$GNGGA':
      case '$GNRMC':
        // Handle NMEA sentences if needed
        // Example: $GNGGA	54035.000	3750.6483	S	14506.8675	E	1	8	1.47	85.1	M	-4.0	M		*45
        // Example: $GNRMC	54035.000	A	3750.6483	S	14506.8675	E	0.35	32.28	130923			A*5F
        // You can parse and store NMEA sentences here if necessary
        break;
      default:
        console.error('Unsupported data key:', key);
        break;
    }
  }

  // After parsing, you can store sensordata in MongoDB as before
  const sensorData = new Sensor(sensordata);
  sensorData.save()
    .then(doc => {
      console.log('Data saved to MongoDB:', doc);
    })
    .catch(error => {
      console.error('Error saving data to MongoDB:', error);
    });
}

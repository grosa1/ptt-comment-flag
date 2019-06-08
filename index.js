const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const geoip2 = require('geoip2');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const ipValidation = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.disable('x-powered-by');
app.use('/assets', express.static('resources/flags'));
geoip2.init('./resources/GeoLite2-City.mmdb');

const getIp = ip => {
  return new Promise((resolve, reject) => {
    if (!ipValidation.test(ip)) {
      return resolve(null);
    }
  
    geoip2.lookupSimple(ip, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

app.options('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});

app.post('/ip', async (req, res) => {
  const ipList = req.body.ip;

  try {
    if (!Array.isArray(ipList)) {
      res.sendStatus(400);
    }
  
    const resolvedIPList = await Promise.all(ipList.map(ip => getIp(ip) || ''));
    const flagList = resolvedIPList.map(ip => {
      if (!ip || !ip.country) {
        return { imagePath: 'assets/unknown.png', locationName: '未知' };
      }
      const imagePath = `assets/${ip.country.toLowerCase()}.png`;
      const locationName = ip.city ? `${ip.city}, ${ip.country}` : ip.coutry;
      return { imagePath, locationName };
    });
    res.json(flagList);
  } catch (ex) {
    console.error(ex);
    res.sendStatus(500);
  }
});

app.listen(9977, () => console.log('App listening on port 9977!'));

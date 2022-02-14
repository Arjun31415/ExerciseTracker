/* eslint-disable no-underscore-dangle */
const express = require('express');

const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('pino')({
  transport: {
    target: 'pino-pretty',
  },
  level: 'debug',
});
const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(cors());
app.use(express.static('public'));

async function initDb() {
  logger.info(mongoose.connection.readyState); // logs 0
  mongoose.connection.on('connecting', () => {
    logger.info('connecting');
    logger.info(mongoose.connection.readyState); // logs 2
  });
  mongoose.connection.on('connected', () => {
    logger.info('connected');
    logger.info(mongoose.connection.readyState); // logs 1
  });
  mongoose.connection.on('disconnecting', () => {
    logger.info('disconnecting');
    logger.info(mongoose.connection.readyState); // logs 3
  });
  mongoose.connection.on('disconnected', () => {
    logger.info('disconnected');
    logger.info(mongoose.connection.readyState); // logs 0
  });
  mongoose.connect(
    `mongodb+srv://${process.env.USERNAME}:${encodeURIComponent(
      process.env.PASSWORD,
    )}@main.fjpwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
    { useNewUrlParser: true },
  );
}

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});

app.post('/api/users', async (req, res) => {
  logger.debug(req.body);

  const curUser = new User({ username: req.body.username });
  await curUser.save(async (err) => {
    if (err && err.code !== 11000) {
      logger.error(err);
      return res.json({ message: 'Another Error occurred', err });
    }
    if (err && err.code === 11000) {
      logger.error(err);
      logger.info('User Already Exists');
      return User.findOne({ username: req.body.username }).then((value) =>
        res.json({ _id: value._id, username: value.username }),
      );
    }
    return res.json({ _id: curUser._id, username: curUser.username });
  });
});

const listener = app.listen(process.env.PORT || 3000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
  await initDb();
  logger.info('Initialized database');
});

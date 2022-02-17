/* eslint-disable no-underscore-dangle */
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('pino')({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      messageFormat: '{filename} {line}: {msg}',
      ignore: 'pid,hostname,filename',
    },
  },
  level: 'debug',
}).child({ filename: path.basename(__filename) });
const mongoose = require('mongoose');
const User = require('./models/User');
const Exersise = require('./models/Exersise');
require('dotenv').config();

const app = express();
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

app.post('/api/users/:_id/exercises', async (req, res) => {
  logger.debug('POSTING EXERSISE \n\n');
  const { _id: userId } = req.params;
  logger.debug({ userId });
  logger.debug(req.body);
  const curUser = await User.findById(userId);
  logger.debug('Current User\n');
  logger.debug(curUser);
  let gotDate;
  logger.debug({ gotDate: req.body.date });
  if (req.body.date) {
    gotDate = new Date(req.body.date);
  } else {
    gotDate = new Date();
  }
  const newExersise = new Exersise({
    username: curUser.username,
    description: req.body.description,
    duration: req.body.duration,
    date: gotDate,
  });
  newExersise.save().then((value) =>
    res.json({
      _id: userId,
      username: curUser.username,
      date: gotDate.toDateString(),
      duration: value.duration,
      description: value.description,
    }),
  );
});
app.get('/api/users', async (req, res) =>
  User.find({}).then((values) => res.json(values)),
);
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id: userId } = req.params;

  const { from, to, limit } = req.query;
  logger.debug({ userId, from, to, limit });
  const curUser = await User.findById(userId);
  logger.debug({ username: curUser.username });
  if (curUser.username === 'fcc_test_16450907447') logger.debug('Yes same');
  const exercises = await Exersise.find({ username: curUser.username }).exec();
  logger.debug({ exercises });
  return res.send({
    ...curUser._doc,
    count: exercises.length,
    log: [...exercises],
  });
});
const listener = app.listen(process.env.PORT || 3000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
  await initDb();
  logger.info('Initialized database');
});

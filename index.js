const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const ocHandler = require('./handlers/clips');
const todoHandler = require('./handlers/todo');
const obHandler = require('./handlers/ourbox');

const PORT = process.env.PORT || 5000

const app = express();

const corsOptions = {
  origin: 'https://sudhakar3697.github.io',
  // origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/oc-data', ocHandler);
app.use('/api/ob-data', obHandler);
app.use('/api/td-data', todoHandler);


app.listen(PORT, () => {
  console.log(`Sudhakar3697.github.io API is running at ${PORT}`);
});

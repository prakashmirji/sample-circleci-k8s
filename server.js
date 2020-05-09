const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Use the prom-client module to expose our metrics to Prometheus
const client = require('prom-client');

/**
 * A Prometheus counter that counts the invocations of the different HTTP verbs
 * e.g. a GET and a POST call will be counted as 2 different calls
 */
numOfRequests = new client.Counter({  
    name: 'numOfRequests',
    help: 'Number of requests made',
    labelNames: ['method']
});

/**
 * A Prometheus counter that counts the invocations with different paths
 * e.g. /green will be counted as 1
 */
greenPathsTaken = new client.Counter({  
    name: 'greenPathsTaken',
    help: 'Green Paths taken in the app',
    labelNames: ['path']
});

/**
 * A Prometheus counter that counts the invocations with different paths
 * e.g. /red will be counted as 1
 */
redPathsTaken = new client.Counter({  
    name: 'redPathsTaken',
    help: 'Red Paths taken in the app',
    labelNames: ['path']
});

/**
 * A Prometheus summary to record the HTTP method, path, response code and response time
 */
module.exports.metricResponses = metricResponses = new client.Summary({  
    name: 'responses',
    help: 'Response time in millis',
    labelNames: ['method', 'path', 'status']
});

// enable prom-client to expose default application metrics
const collectDefaultMetrics = client.collectDefaultMetrics;

// define a custom prefix string for application metrics
collectDefaultMetrics({ prefix: 'my_application:' });

/* eslint-disable no-console */

const port = process.env.PORT || 3000;
const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: 'true' }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(express.static(path.join(__dirname, './')));

// expose our metrics at the default URL for Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
});

app.get('/home', (req, res) => {
    numOfRequests.inc({ method: req.method });
    res.sendFile(path.join(__dirname, './index.html'));
});

app.get('/green', (req, res) => {
    greenPathsTaken.inc({ path: req.path });
    res.sendFile(path.join(__dirname, './index.html'));
});

app.get('/red', (req, res) => {
    redPathsTaken.inc({ path: req.path });
    res.sendFile(path.join(__dirname, './error.html'));
});

app.listen(port, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`App at: http://localhost:${port}`);
    }
});
module.exports = app;

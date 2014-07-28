var _ = require('lodash');
var wd = require('wd');
var Q = require('q');

function report(stat, data) {
  data = data[stat];
  data.sort(function (a, b) {
    return a - b;
  });
  console.log([
    stat,
    data.length,
    data.reduce(function (sum, x) {
      return sum + x;
    }, 0) / data.length,
    data[0],
    data[Math.floor(data.length * 0.5)],
    data[Math.floor(data.length * 0.75)],
    data[Math.floor(data.length * 0.95)],
    data[Math.floor(data.length * 0.99)],
    data[data.length - 1]
  ].join(','));
}

var numTrials = parseInt(process.argv[2], 10);
var url = process.argv[3];

function runTrial() {
  return browser.
    get(url).
    sleep(1000).
    waitForConditionInBrowser(
      'lastObservedMutation && (performance.now() - lastObservedMutation > 500)',
      100000
    ).
    execute('return metrics;').
    then(function (metrics) {
      report('serializeRecordTime', metrics);
      report('serializationTime', metrics);
      report('postMessageTime', metrics);
    });
}

function runTrials() {
  var promise;
  var n = numTrials - 1;

  // return promise of trials

  promise = runTrial();
  do {
    n--;
    promise = promise.then(runTrial);
  } while (n > 0);

  return promise;
}

var browser = wd.promiseChainRemote();
browser.
  init({browserName:'chrome'}).
  then(function () {
    console.log([
      'stat', 'n', 'mean', 'min', 'median', '75th', '95th', '99th', 'max'
    ].join(','));

    return runTrials();
  }).
  fin(function () {
    browser.quit();
  });

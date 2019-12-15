const {
  Logger,
  Severity
} = require('../src/logger.js');

let logger;
let logCount = 0;
let logCat1Count = 0;
let onLogCount = 0;
let onLogCat1Count = 0;

function onError(e) {
  console.log('closing logfiles gracefully');
  if (logger != null) logger.close();
  // throw to break test
  throw e;
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

let count = 0;
async function cycle() {
  do {
    await sleep(500);
    logger.logWarning(`Cycle ${++count}`, logger.category.cat1);
    logCount++;
    logCat1Count++;
  } while (count < 3);
}

async function run() {
  logger = new Logger('./test/logger.json');
  await logger.init();
  logger.defineCategory('Test');
  logger.onLog(log => {
    console.log(JSON.stringify(log));
    onLogCount++;
  });
  logger.on('cat1warning', log => {
    console.log('cat1warning listener triggered');
    onLogCat1Count++;
  });

  logger.logWarning('Hello World!', logger.category.Test);
  logCount++;

  logger.log({
    category: logger.category.cat1,
    severity: Severity.Info,
    message: 'Into the sun',
    data: ['yadda', { some: 'thing' }]
  });
  logCount++;

  await cycle().catch(onError);
}

function validate() {
  console.log('Validation entry - closing logger');
  logger.close();
  console.log('Checking Results');
  if (logCount === null || logCount === 0) throw 'no logs really processed!';
  else if (logCount !== onLogCount) throw 'onLog not as often triggered as log!';
  else if (logCat1Count !== onLogCat1Count) {
    console.error(`logCat1Count: ${logCat1Count}, onLogCat1Count: ${onLogCat1Count}`);
    throw 'custom listener not as often triggered as logged!';
  }
  else console.log('Ok');
}

run()
  .then(validate)
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

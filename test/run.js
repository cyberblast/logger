const {
  Logger,
  severity
} = require('../src/logger.js');

let logger;
let logCount = 0;
let onLogCount = 0;

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
    logger.logWarning(`Cycle ${count++}`, logger.category.cat1);
    logCount++;
  } while (count < 3);
  logger.close();
}

async function run() {
  logger = new Logger('./test/logger.json');
  await logger.init();
  logger.defineCategory('Test');
  logger.onLog(log => {
    console.log(JSON.stringify(log));
    onLogCount++;
  });
  logger.logWarning('Hello World!', logger.category.Test);
  logCount++;
  logger.log({
    category: logger.category.cat1,
    severity: severity.Info,
    message: 'Into the sun',
    data: ['yadda', { some: 'thing' }]
  });
  logCount++;

  await cycle().catch(onError);
}

run()
  .then(() => {
    console.log('Checking Results');
    if (logCount !== onLogCount) throw 'onLog not as often triggered as log!';
    else console.log('Ok');
  })
  .catch(onError);

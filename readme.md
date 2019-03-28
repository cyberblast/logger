# cyberblast logger

A simple logger for node

[![Build Status](https://travis-ci.com/cyberblast/logger.svg?branch=dev)](https://travis-ci.com/cyberblast/logger)
[![npm version](https://badge.fury.io/js/%40cyberblast%2Flogger.svg)](https://badge.fury.io/js/%40cyberblast%2Flogger)

## Usage

```js
// Optional file path argument. Defaults to './logger.json'
const logger = new Logger('./logger.json');
// init will create log files and open file streams
await logger.init();
// define categories in config file or create them in code (or both)
logger.defineCategory('Sample');
// register additional custom log handlers
// attach callbacks to onError, onWarning, onInfo and onVerbose
logger.onWarning(log => {
  console.warn(`Ooops: ${log.message}. Details: ${JSON.stringify(log.data)}`);
});
// onLog catches them all
logger.onLog(log => {
  console.log(`${log.severity}: ${log.message}`);
});
// trigger some log events
logger.logVerbose('logger ready');
logger.logWarning('Do the Bartman', logger.category.Sample);
// close file streams gracefully
logger.close();
```

## Configuration

Sorry dude, nothing yet... come back soon to see more.  
Or [drop me a line](mailto://git@cyberblast.org)...

## Legal

Please take note of files [LICENSE](https://raw.githubusercontent.com/cyberblast/logger/master/LICENSE) and [CONTRIBUTING](https://raw.githubusercontent.com/cyberblast/logger/master/CONTRIBUTING).

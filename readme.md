# cyberblast logger

A simple logger for node

[![Build Status](https://travis-ci.com/cyberblast/logger.svg?branch=dev)](https://travis-ci.com/cyberblast/logger)
[![npm version](https://badge.fury.io/js/%40cyberblast%2Flogger.svg)](https://badge.fury.io/js/%40cyberblast%2Flogger)

## Usage

Sample usage:

```js
const { Logger, severity } = require('@cyberblast/logger');
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
// 'onLog' catches them all
logger.onLog(log => {
  console.log(`${log.severity}: ${log.message}`);
});
// 'on' allows to attach to custom filter rules (defined in config file)
logger.on('BackendError', log => {
  // sample function call not part of this repo:
  sendMailAlert(log);
});
// trigger some log events
logger.logVerbose('logger ready');
logger.logWarning('Do the Bartman', logger.category.Sample);
// or more explicit with some sample additional payload
logger.log({
  category: logger.category.BackendError,
  severity: severity.Error,
  message: 'storage capacity reached!',
  data: ['Drive C', {usage: '100%'}]
});
// close file streams gracefully
logger.close();
```

## Configuration

Sample configuration:

```json
{
  "categories": ["webserver"],
  "rules": [
    {
      "name": "all",
      "console": true
    },
    {
      "name": "error",
      "filePath": "./log/",
      "severity": "Error"
    },
    {
      "name": "webserver",
      "category": "webserver",
      "filePath": "./log/",
      "severity": "Info"
    }
  ]
}
```

#### Categories

_optional, array of strings_  
List of predefined log categories. Configured categories will be available via category property at Logger class. However, preconfiguring categories is not mandatory to use log categories in logData and rules at all.  
```js
logger.logWarning('Do the Bartman', logger.category.Sample);
```

#### Rules

Rules define what to do with a certain log case. 

* **name**  
  _required, string_  
  Every rules needs a unique name. Logfiles will get the name of the rule. You can also hook into log events using the rule name, like: 
  ```js
  logger.on('BackendError', log => {
    sendMailAlert(log);
  });
  ```
  Where 'BackendError' would be the name of the rule. This only works only for rules with names not matching the reserved word "any" or a severity name.
* **category**  
  _optional, string_  
  Log cases can have categories. If you specify a rule category, that rule will only be executed when rule category and log category match.
* **severity**  
  _optional, string_  
  Log cases can have a severity. If you specify a rule severity, that rule will only be executed, if rule severity and log severity match or the log severity is higer.  Also depends on 'severityOnly' rule property.  
  If you don't specify a rule severity, that rule will run for all severities.  
  You can also hook into log events using the severity name, like: 
  ```js
  logger.on('Warning', log => {
    sendMailAlert(log);
  });
  ```
* **severityOnly**  
  _optional, boolean_  
  Defaults to `false`.  
  Id severityOnly is set to `true`, rule severity and log case severity must exactly match to execute the rule. Otherwise the log case severity must match or be higher.  
* **console**  
  _optional, boolean_  
  Defaults to `false`.
  If console is set to `true`, log messages will be send to console.
* **filePath**  
  _optional, string_  
  If filePath is set, Logger will create log files at that path. The log file name will have the format `<rule.name>.log`.  
  Must be a valid path string according to Node [Path](https://nodejs.org/api/path.html) module. It must point to a directory. If that directory does not exist, it will be created.  
  Directory and logfile creation happens immediately upon Logger initialization.  
  ```js
  await logger.init();
  ```

## Legal

Please take note of files [LICENSE](https://raw.githubusercontent.com/cyberblast/logger/master/LICENSE) and [CONTRIBUTING](https://raw.githubusercontent.com/cyberblast/logger/master/CONTRIBUTING).

## Credits

Thanks to Jacob Wright <jacwright@gmail.com> for his [date format library](https://github.com/jacwright/date.format).

const LogFile = require('./logfile');
const path = require('path');
const {
  Severity,
  SeverityLevel
} = require('./severity');
// @ts-ignore
require('../lib/jacwright.date.format/date.format');

class Router {
  constructor(config, emitter) {
    if (config.rules === undefined || config.rules.length === 0)
      return;

    this.emitter = emitter;
    this.rules = config.rules;
    this.chatty = config.chatty === true;
    this.logFiles = {};
  }

  async init() {
    const self = this;
    // create LogFile Streams for each rule (with defined path)
    await this.asyncForEach(this.rules, this.parseRule, this);
    this.emitter.on('any', async data => {
      self.processLog(data);
    });
  }

  async parseRule(rule) {
    if (rule.filePath !== undefined) {
      // TODO: introduce log retention => add timestamp to logname
      // TODO: handle log retention shift => new file
      rule.logfile = this.filename(rule.name);
      await this.openStream(rule.filePath, rule.logfile);
    }
  }

  async asyncForEach(array, callback, scope) {
    if (scope) callback = callback.bind(scope);
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  filename(ruleName) {
    // TODO: Prevent usage of same filename multiple times
    return ruleName.replace(/ /g, '') + '.log';
  }

  toFileLogString(logData) {
    // fixed length for severity (more readable)
    const severity = Buffer.alloc(8, ' ', 'utf8');
    severity.write(logData.severity, 0, 'utf8');
    let message = `${logData.time.format('Y.m.d H:i:s\'v ')}${severity.toString()}${logData.category}: ${logData.message}`;
    if (logData.data !== undefined) {
      const addObj = d => {
        if (d != null) {
          try {
            // may fail. ignore. for the sake of performance.
            if (d instanceof Error) {
              if (d['trace'] !== undefined) {
                message = `${message}\n${d['trace']}`;
              } else if (d.stack != null && d.stack != '') {
                message = `${message}\n${d.message}\n${d.stack}`;
              } else {
                message = `${message}\n${d.message}`;
              }
            } else {
              const dataString = JSON.stringify(d);
              message = `${message}\n${dataString}`;
            }
          } catch{ }
        }
      }
      if (logData.data instanceof Array) {
        if (logData.data.length !== 0) logData.data.forEach(addObj);
      } else {
        addObj(logData.data);
      }
    }
    return message;
  }

  async processLog(logData) {
    try {
      // filter matching rules
      const severityMatch = rule => rule.severity === undefined
        || (rule.severityOnly === true && rule.severity === logData.severity)
        || SeverityLevel[logData.severity] >= SeverityLevel[rule.severity];
      const match = rule => (
        (rule.category === undefined || rule.category === logData.category)
        && severityMatch(rule)
      );
      const matches = this.rules.filter(match);
      // write logfile for each rule
      let writeHost = false;
      const process = async rule => {
        if (rule.console) writeHost = true;
        // compile file format only once. and only if required.
        if (logData.fileLogString === undefined) logData.fileLogString = this.toFileLogString(logData);
        if (rule.logfile !== undefined) this.writeLogfile(rule, logData);
        // also trigger event named same as rulename if it's not a predefined eventName (prevent double trigger)
        if (rule.name !== undefined && Severity[rule.name] === undefined && rule.name !== 'any') {
          this.emitter.emit(rule.name, logData);
        }
      }
      matches.forEach(process);
      // write console only once
      if (writeHost) {
        if (logData.fileLogString === undefined) logData.fileLogString = this.toFileLogString(logData);
        this.writeHost(logData);
      }
    } catch (e) {
      this.close();
      throw e;
    }
  }

  async openStream(filePath, fileName) {
    if (this.logFiles[fileName] !== undefined)
      return;
    this.logFiles[fileName] = new LogFile(path.join(filePath, fileName));
    await this.logFiles[fileName].init();
  }

  async writeLogfile(rule, logData) {
    const logfile = this.logFiles[rule.logfile];
    if (logfile === undefined) return;
    logfile.writeLine(logData.fileLogString);
  }

  writeHost(logData) {
    let log;
    if (logData.severity === Severity.Error) log = console.error;
    else if (logData.severity === Severity.Warning) log = console.warn;
    else if (logData.severity === Severity.Info) log = console.info;
    else log = console.log;
    log(logData.fileLogString);
  }

  close() {
    for (let logfileName in this.logFiles) {
      const logfile = this.logFiles[logfileName];
      if (logfile !== undefined) {
        if (this.chatty) console.log(`closing logfile ${logfileName}`);
        if (logfile.close) logfile.close();
      }
    }
  }
}

module.exports = Router;

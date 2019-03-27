const LogFile = require('./logfile');
const path = require('path');
const fs = require('fs');
require('../lib/jacwright.date.format/date.format');

module.exports = class Router{
  constructor(config, event){
    if(config.rules === undefined || config.rules.length === 0) 
      return;

    const self = this;
    this.rules = config.rules;
    this.chatty = config.chatty === true;
    this.logFiles = {};
    event.on('any', data => {
      self.processLog(data);
    });
    // create LogFile Streams for each rule (with defined path)
    const parseRule = rule => {
      if(rule.filePath !== undefined){
        // TODO: introduce log retention => add timestamp to logname
        // TODO: handle log retention shift => new file
        rule.logfile = this.filename(rule.name);
        this.openStream(rule.filePath, rule.logfile);
      }
    };
    this.rules.forEach(parseRule);
  }

  filename(ruleName){
    return ruleName.replace(/ /g, '') + '.log';
  }

  toFileLogString(logEvent){
    // fixed length for severity (more readable)
    const severity = Buffer.alloc(8, ' ', 'utf8');
    severity.write(logEvent.severity, 0, 'utf8');
    let message = `${logEvent.time.format('Y.m.d H:i:s\'v ')}${severity.toString()}${logEvent.category}: ${logEvent.message}`;
    if(logEvent.data !== undefined && logEvent.data.length){
      logEvent.data.forEach(d => {
        if(d != null){
          try{
            // may fail. ignore. for the sake of performance.
            const dataString = JSON.stringify(d);
            message = `${message}|${dataString}`;
          }catch{}
        }
      })
    }
    return message;
  }

  processLog(logEvent){
    try{
      // filter matching rules
      const match = rule => (
        (rule.severity === undefined || rule.severity === logEvent.severity)
        && (rule.category === undefined || rule.category === logEvent.category)
      );
      const matches = this.rules.filter(match);
      // write logfile for each rule
      let writeHost = false;
      const process = rule => {
        if(rule.console) writeHost = true;
        // compile file format only once. and only if required.
        if(logEvent.fileLogString === undefined) logEvent.fileLogString = this.toFileLogString(logEvent);
        if(rule.logfile !== undefined) this.writeLogfile(rule, logEvent);
      }
      matches.forEach(process);
      // write console only once
      if(writeHost) {
        if(logEvent.fileLogString === undefined) logEvent.fileLogString = this.toFileLogString(logEvent);
        this.writeHost(logEvent);
      }
    }catch(e){
      this.close();
      throw e;
    }
  }

  openStream(filePath, fileName){
    if(this.logFiles[fileName] !== undefined) 
      return;
    this.logFiles[fileName] = new LogFile(path.join(filePath, fileName));
  }

  writeLogfile(rule, logEvent){
    const logfile = this.logFiles[rule.logfile];
    if(logfile === undefined) return;
    logfile.writeLine(logEvent.fileLogString);
  }
  writeHost(logEvent){
    let log;
    if(logEvent.severity === 'Error') log = console.error;
    else if(logEvent.severity === 'Warning') log = console.warn;
    else if(logEvent.severity === 'Info')log = console.info;
    else log = console.log;
    log(logEvent.fileLogString);
  }
  close(){
    for(let logfileName in this.logFiles){
      const logfile = this.logFiles[logfileName];
      if(logfile !== undefined){
        if(this.chatty) console.log(`closing logfile ${logfileName}`);
        if(logfile.close) logfile.close();
      }
    }
  }
}
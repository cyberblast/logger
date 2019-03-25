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

  toFileLogString(data){
    // fixed length for severity (more readable)
    const severity = Buffer.alloc(8, ' ', 'utf8');
    severity.write(data.severity, 0, 'utf8');
    let message = `${data.time.format('Y.m.d H:i:s\'v ')}${severity.toString()}${data.category}: ${data.message}`;
    if(data.data !== undefined && data.data.length){
      data.data.forEach(d => {
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

  processLog(data){
    try{
      // filter matching rules
      const match = rule => (
        (rule.severity === undefined || rule.severity === data.severity)
        && (rule.category === undefined || rule.category === data.category)
      );
      const matches = this.rules.filter(match);
      // write logfile for each rule
      let writeHost = false;
      const process = rule => {
        if(rule.console) writeHost = true;
        // compile file format only once. and only if required.
        if(data.fileLogString === undefined) data.fileLogString = this.toFileLogString(data);
        if(rule.logfile !== undefined) this.writeLogfile(rule, data);
      }
      matches.forEach(process);
      // write console only once
      if(writeHost) {
        if(data.fileLogString === undefined) data.fileLogString = this.toFileLogString(data);
        this.writeHost(data);
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

  writeLogfile(rule, data){
    const logfile = this.logFiles[rule.logfile];
    if(logfile === undefined) return;
    logfile.writeLine(data.fileLogString);
  }
  writeHost(data){
    let log;
    if(data.severity === 'Error') log = console.error;
    else if(data.severity === 'Warning') log = console.warn;
    else if(data.severity === 'Info')log = console.info;
    else log = console.log;
    log(data.fileLogString);
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
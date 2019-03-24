const LogFile = require('./logfile');
const path = require('path');
const fs = require('fs');

module.exports = class Router{
  constructor(config, event){
    const self = this;
    this.rules = config.rules;
    this.chatty = config.chatty === true;
    // TODO: handle no rules
    this.logFiles = {};
    event.on('any', data => {
      self.processLog(data);
    });
    // create LogFile Streams for each rule (with defined path)
    const parseRule = rule => {
      if(rule.filePath !== undefined){
        // TODO: validate path
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
        if(rule.logfile !== undefined) this.writeLogfile(rule, data);
      }
      matches.forEach(process);
      // write console only once
      if(writeHost) this.writeHost(data);
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
    // TODO: format
    logfile.writeLine(data.message);
  }
  writeHost(data){
    // TODO: format
    console.log(data.message);
    if(data.data)
      console.log(JSON.stringify(data.data));
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
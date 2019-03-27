const Event = require('events');
const config = require('@cyberblast/config');
const Router = require('./router')

const severityEnum = {
  Error: "Error",
  Warning: "Warning",
  Info: "Info",
  Verbose: "Verbose"
};
const severityLevelEnum = {
  Error: 1,
  Warning: 2,
  Info: 3,
  Verbose: 4
};

module.exports = function Logger(configPath = './logger.json'){
  const self = this;
  let event;
  let categories;
  let router;
  
  Object.defineProperty(this, 'category', { 
    get: function() { 
      return categories; 
    } 
  });

  Object.defineProperty(this, 'severity', { 
    get: function() { 
      return severityEnum; 
    } 
  });

  Object.defineProperty(this, 'severityLevel', { 
    get: function() { 
      return severityLevelEnum; 
    } 
  });

  this.init = async function(){
    categories = {
      NONE: "NONE"
    };
    const settings = await config.load(configPath);
    settings.categories.forEach(self.defineCategory);
    event = new Event();
    router = new Router(settings, event);
  }
  
  this.close = function(){
    router.close();
    event = null;
  }

  this.defineCategory = function(name){
    categories[name] = name;
  }

  // level, category, message, data
  this.log = function(logDetails){
    if(logDetails.time === undefined) logDetails.time = new Date();
    event.emit('any', logDetails);
    event.emit(logDetails.severity, logDetails);
  }

  //#region shortcuts

  this.logError = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severityEnum.Error,
      category,
      message,
      data,
      time: new Date()
    });
  }

  this.logWarning = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severityEnum.Warning,
      category,
      message,
      data
    });
  }

  this.logInfo = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severityEnum.Info,
      category,
      message,
      data,
      time: new Date()
    });
  }

  this.logVerbose = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severityEnum.Verbose,
      category,
      message,
      data,
      time: new Date()
    });
  }

  //#endregion

  //#region register custom event handlers

  this.onLog = function(callback){
    event.on('any', callback);
  }

  this.onError = function(callback){
    event.on(severityEnum.Error, callback);
  }

  this.onWarning = function(callback){
    event.on(severityEnum.Warning, callback);
  }

  this.onInfo = function(callback){
    event.on(severityEnum.Info, callback);
  }

  this.onVerbose = function(callback){
    event.on(severityEnum.Verbose, callback);
  }

  //#endregion

}
const Event = require('events');
const Config = require('@cyberblast/config');
const Router = require('./router');
const {
  severity,
  severityLevel
} = require('./severity');

module.exports = function Logger(configPath = './logger.json'){
  const self = this;
  let event;
  let categories;
  let config;
  let router;
  
  Object.defineProperty(this, 'category', { 
    get: function() { 
      return categories; 
    } 
  });

  Object.defineProperty(this, 'severity', { 
    get: function() { 
      return severity; 
    } 
  });

  Object.defineProperty(this, 'severityLevel', { 
    get: function() { 
      return severityLevel; 
    } 
  });

  this.init = async function(){
    categories = {
      NONE: "NONE"
    };

    config = new Config(configPath);
    const settings = await config.load();
    if(settings.categories !== undefined) settings.categories.forEach(self.defineCategory);
    event = new Event();
    router = new Router(settings, event);
    await router.init();
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
      severity: severity.Error,
      category,
      message,
      data,
      time: new Date()
    });
  }

  this.logWarning = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severity.Warning,
      category,
      message,
      data
    });
  }

  this.logInfo = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severity.Info,
      category,
      message,
      data,
      time: new Date()
    });
  }

  this.logVerbose = function(message, category = categories.NONE, ...data){
    this.log({
      severity: severity.Verbose,
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

  this.on = function(eventName, callback){
    event.on(eventName, callback);
  }

  this.onError = function(callback){
    event.on(severity.Error, callback);
  }

  this.onWarning = function(callback){
    event.on(severity.Warning, callback);
  }

  this.onInfo = function(callback){
    event.on(severity.Info, callback);
  }

  this.onVerbose = function(callback){
    event.on(severity.Verbose, callback);
  }

  //#endregion

}
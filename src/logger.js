const Event = require('events');
const Config = require('@cyberblast/config');
const Router = require('./router');
const {
  severity,
  severityLevel
} = require('./severity');

/**
 * @typedef {Object} LogData - Log event data
 * @property {string} severity
 * @property {string} category
 * @property {string} message
 * @property {any} [data]
 * @property {Date} [time]
 */

/**
 * @class
 * @param {string=} configPath
 */
function Logger(configPath = './logger.json') {
  /** @type {Logger} */
  const self = this;
  /** @type {Event} */
  let event;
  /** @enum {string} */
  let categories;
  /** @type {Config} */
  let config;
  /** @type {Router} */
  let router;

  // Workaround to define Property type in vscode
  /** @enum {string} */
  this.category = undefined;
  Object.defineProperty(this, 'category', {
    get: function() {
      return categories;
    }
  });

  /**
   * Initialize logger. Create files and open streams.
   * @returns { Promise<void> }
   */
  this.init = async function() {
    categories = {
      NONE: "NONE"
    };

    config = new Config(configPath);
    const settings = await config.load();
    if (settings.categories !== undefined) settings.categories.forEach(self.defineCategory);
    event = new Event();
    router = new Router(settings, event);
    await router.init();
  }

  /** Close streams */
  this.close = function() {
    router.close();
    event = null;
  }

  /**
   * Define a log event category
   * @param { string } name - Name of the category to add
   */
  this.defineCategory = function(name) {
    categories[name] = name;
  }

  /**
   * Create a log entry
   * @param {LogData} logDetails - Log event data
   */
  this.log = function(logDetails) {
    if (logDetails.time === undefined) logDetails.time = new Date();
    event.emit('any', logDetails);
    event.emit(logDetails.severity, logDetails);
  }

  //#region shortcuts

  /**
   * Create a log entry with severity 'Error'
   * @param {string} message - Log message text
   * @param {string} [category] - Event category  
   * defaults to 'NONE'
   * @param {any[]} [data] - additional information to log
   */
  this.logError = function(message, category = categories.NONE, ...data) {
    this.log({
      severity: severity.Error,
      category,
      message,
      data,
      time: new Date()
    });
  }

  /**
   * Create a log entry with severity 'Warning'
   * @param {string} message - Log message text
   * @param {string} [category] - Event category  
   * defaults to 'NONE'
   * @param {any[]} [data] - additional information to log
   */
  this.logWarning = function(message, category = categories.NONE, ...data) {
    this.log({
      severity: severity.Warning,
      category,
      message,
      data
    });
  }

  /**
   * Create a log entry with severity 'Info'
   * @param {string} message - Log message text
   * @param {string} [category] - Event category  
   * defaults to 'NONE'
   * @param {any[]} [data] - additional information to log
   */
  this.logInfo = function(message, category = categories.NONE, ...data) {
    this.log({
      severity: severity.Info,
      category,
      message,
      data,
      time: new Date()
    });
  }

  /**
   * Create a log entry with severity 'Verbose'
   * @param {string} message - Log message text
   * @param {string} [category] - Event category  
   * defaults to 'NONE'
   * @param {any[]} [data] - additional information to log
   */
  this.logVerbose = function(message, category = categories.NONE, ...data) {
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

  /**
   * Attach to any logging event
   * @param {function(LogData): void} callback
   */
  this.onLog = function(callback) {
    event.on('any', callback);
  }

  /**
   * Attach to specific logging events
   * @param {string} eventName - rule name
   * @param {function(LogData): void} callback
   */
  this.on = function(eventName, callback) {
    event.on(eventName, callback);
  }

  /**
   * Attach to logging event with severity 'Error'
   * @param {function(LogData): void} callback
   */
  this.onError = function(callback) {
    event.on(severity.Error, callback);
  }

  /**
   * Attach to logging event with severity 'Warning'
   * @param {function(LogData): void} callback
   */
  this.onWarning = function(callback) {
    event.on(severity.Warning, callback);
  }

  /**
   * Attach to logging event with severity 'Info'
   * @param {function(LogData): void} callback
   */
  this.onInfo = function(callback) {
    event.on(severity.Info, callback);
  }

  /**
   * Attach to logging event with severity 'Verbose'
   * @param {function(LogData): void} callback
   */
  this.onVerbose = function(callback) {
    event.on(severity.Verbose, callback);
  }

  //#endregion
}

module.exports = {
  Logger,
  severity,
  severityLevel
}

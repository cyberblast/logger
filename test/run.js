const Logger = require('../src/logger.js');
const LogFile = require('../src/logfile');

let logger;

//#region Test logfile

const logfile = new LogFile('./test/result/filetest.log');

function onError(e){
  if(logfile != null) {
    console.log(`closing logfile ${logfile.path}`);
    logfile.close();
  }
  if(logger != null) logger.close();
  throw e;
}

try{
  logfile.writeLine('Hello World!');
  logfile.writeLine('Here I am.');
  console.log(`closing logfile ${logfile.path}`);
  logfile.close();

  //#endregion

  function sleep(ms){
    return new Promise(resolve=>{
      setTimeout(resolve,ms)
    })
  }

  let count = 0;
  async function cycle(){
    do{  
      await sleep(500);
      logger.logWarning(`Cycle ${count++}`, logger.category.cat1);
    }while(count<3);
    logger.close();
  }

  function test(){
    logger.logWarning("Hello World!", logger.category.Test, logger.category);
    logger.log({
      category: logger.category.cat1,
      severity: logger.severity.Info,
      message: "Into the sun",
      data: ['yadda', {some: 'thing'}]
    });
    
    cycle().catch(onError);
  }

  async function run(){
    logger = new Logger('./test/logger.json');
    await logger.init();
    logger.defineCategory('Test');
    logger.onLog(log => {
      console.log(JSON.stringify(log));
    });
    test();
  }
  run();
}
catch(e){
  onError(e);
}
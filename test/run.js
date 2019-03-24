const Logger = require('../src/logger.js');

let count = 0;

function onError(e){
  throw e;
}

const logger = new Logger(
  onError,
  logRdy => {
    logRdy.onLog(log =>{
      console.log(JSON.stringify(log));
    });
    logRdy.defineCategory('Test');
    test();
  },
  './test/logger.json'
);

function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
}

async function cycle(){
  do{  
    await sleep(200);
    logger.logVerbose(`Cycle ${count++}`);
  }while(count<3);
}

function test(){
  logger.logWarning("Hello World!", logger.category.Test, logger.category);
  logger.log({
    category: logger.category.cat1,
    severity: logger.severity.Info,
    message: "Into the sun",
    data: ['yadda', {some: 'thing'}]
  });
  
  cycle();
}

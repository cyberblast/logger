const fs = require('fs');

module.exports = function LogFile(filePath){
  this.path = filePath;

  const fileStream = fs.createWriteStream(filePath, {
    flags: 'a',
    encoding: 'utf8'
  });

  let streamReady = true;
  const letDrain = new Promise(resolve => {
    fileStream.on('drain', () => {
      streamReady = true;
      resolve();
    });
  });

  function writeStream(data){
    return new Promise((resolve, reject) => {

      function writeComplete(error){
        if(error) reject(error);
        else resolve();
      }

      function writeToStream(data){
        streamReady = fileStream.write(data, writeComplete);
      }

      if(streamReady) writeToStream(data);
      else letDrain.then(writeToStream(data));
    });
  }

  this.writeLine = function(text){
    //const now = new Date();
    writeStream(`${text}\n`);
  }

  this.close = function(){
    if(fileStream.writable) fileStream.close();
  }
}


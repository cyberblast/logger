const fs = require('fs');
const path = require('path');

module.exports = function LogFile(filePath){
  this.path = filePath;
  let streamReady = false;
  let letDrain;

  this.init = async function(){
    return new Promise((resolve, reject) => {
      // ensure directory exists
      const dir = path.dirname(filePath);
      fs.mkdir(dir, {recursive: true}, err => {
        if(err) reject(err);
        else {
          // create writable stream
          fileStream = fs.createWriteStream(filePath, {
            flags: 'a',
            encoding: 'utf8'
          });
    
          // observe drain event
          streamReady = true;
          letDrain = new Promise(resolveDrain => {
            fileStream.on('drain', () => {
              streamReady = true;
              resolveDrain();
            });
          });
          
          resolve();
        }
      });
    });
  }

  // raw stream writer
  function writeStreamAsync(data){
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

  // write a line to the file
  this.writeLine = async function(text){
    writeStreamAsync(`${text}\n`);
  }

  // close file stream
  this.close = function(){
    if(fileStream.writable) fileStream.close();
  }
}


const fs = require('fs');
const path = require('path');

module.exports = function LogFile(filePath){
  this.path = filePath;

  // ensure directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, {recursive: true});

  // create writable stream
  const fileStream = fs.createWriteStream(filePath, {
    flags: 'a',
    encoding: 'utf8'
  });

  // observe drain event
  let streamReady = true;
  const letDrain = new Promise(resolve => {
    fileStream.on('drain', () => {
      streamReady = true;
      resolve();
    });
  });

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
    await writeStreamAsync(`${text}\n`);
  }

  // close file stream
  this.close = function(){
    if(fileStream.writable) fileStream.close();
  }
}


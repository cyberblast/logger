const {
  WriteStream,
  mkdir,
  createWriteStream } = require('fs');
const path = require('path');

function LogFile(filePath) {
  /**
   * @type { string }
   */
  this.path = filePath;
  /**
   * @type { WriteStream }
   */
  let stream;
  let streamReady = false;
  /**
   * @type { Promise<void> }
   */
  let letDrain;

  this.init = async function() {
    stream = null;
    return new Promise((resolve, reject) => {
      // ensure directory exists
      const dir = path.dirname(filePath);
      mkdir(dir, { recursive: true }, err => {
        if (err) reject(err);
        else {
          // create writable stream
          stream = createWriteStream(filePath, {
            flags: 'a',
            encoding: 'utf8'
          });

          // observe drain event
          streamReady = true;
          letDrain = new Promise(resolveDrain => {
            stream.on('drain', () => {
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
  function writeStreamAsync(data) {
    return new Promise((resolve, reject) => {

      function writeComplete(error) {
        if (error) reject(error);
        else resolve();
      }

      function writeToStream(data) {
        streamReady = stream.write(data, writeComplete);
      }

      if (streamReady) writeToStream(data);
      else letDrain.then(() => writeToStream(data));
    });
  }

  // write a line to the file
  this.writeLine = async function(text) {
    writeStreamAsync(`${text}\n`);
  }

  // close file stream
  this.close = function() {
    if (stream != null && stream.writable) stream.close();
    stream = null;
  }
}

module.exports = LogFile;

const fdk = require('@fnproject/fdk');
const im = require('imagemagick');
const fs = require('fs');
const tmp = require('tmp');
const multipart = require('parse-multipart');

fdk.handle(extractDimensions, { inputMode: 'buffer' });

function extractDimensions(buffer, ctx) {
  return new Promise((resolve, reject) => {
    let boundary = getMultiPartBoundrySeparator(ctx);
    let parts = multipart.Parse(buffer, boundary);
    if (parts.length > 0) { // we have at least one file
      let part = parts[0];  // process the first file only
      tmp.tmpName((err, tmpFile) => {
        if (err) throw err;
        fs.writeFile(tmpFile, part.data, (err) => {
          if (err) throw err;
          im.identify(['-format', '{"file": "' + part.filename + '", ' + '"width": %w, "height": %h}', tmpFile],
            (err, output) => {
              if (err) {
                reject(err);
              } else {
                resolve(JSON.parse(output));
              }
            }
          );
        });
      });
    }
  });
}

function getMultiPartBoundrySeparator(ctx) {
  let contentType = ctx.getHeader("Content-Type");
  if (contentType) {
    const boundryProperty = "boundary=";
    let boundaryStart = contentType.indexOf(boundryProperty) + boundryProperty.length;
    if (boundaryStart > -1) {
      return contentType.substring(boundaryStart, contentType.length);
    }
  }
  throw "multipart/form-data expected";
}

const fs = require('fs');
const path = require('path');

exports.uploadBase64Image = (data) => {
  try {
    const encoded = data;
    console.log(encoded);
    const base64ToArray = encoded.split(";base64,");
    const prefix = base64ToArray[0];
    const extension = prefix.replace(/^data:image\//, '');

    if (extension) {
      const imageData = base64ToArray[1];
      
      // Use /tmp folder for temporary writes on serverless
      const filename = new Date().getTime() + '.' + extension;
      const imagePath = path.join('/tmp', filename);

      fs.writeFileSync(imagePath, imageData, { encoding: 'base64' });
      return filename;
    } else {
      console.log("Base64 is not valid");
      throw new Error("Base64 is not valid");
    }
  } catch (e) {
    console.log(e);
    return null; // Return null or handle the error properly in your app
  }
};


# nodejs-meme-generator
TypeScript promise-based meme generator, it takes an image as url and top/bottom text to generate meme as Buffer

## Installation
```
$ npm install memise
```
or
```
$ yarn add memise
```

## Requirements
Unless previously installed you'll need Cairo and Pango
```
brew install pkg-config cairo pango libpng jpeg giflib
```

## Example
```javascript
const express = require('express');
const app = express();
const PORT = 3001;
const memeLib = require('memise');

const memeGenerator = new memeLib({
  canvasOptions: { // optional
    canvasWidth: 500,
    canvasHeight: 500
  },
  fontOptions: { // optional
    fontSize: 46,
    fontFamily: 'impact',
    lineHeight: 2
  }
});

app.get('/', function (req, res) {
  memeGenerator.generateMeme({
      // you can use either topText or bottomText
      // or both of them at the same time
      topText: 'Meme',
      bottomText: 'Generator',
      // for local image you can use path 'img/folder/image.jpg'
      url: 'https://medialeaks.ru/wp-content/uploads/2020/07/global_yawning_by_woxys_dd4lh3m-pre-1-600x416.jpg'
    })
    .then(function(data) {
      res.set('Content-Type', 'image/png');
      res.send(data);
    })
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
```

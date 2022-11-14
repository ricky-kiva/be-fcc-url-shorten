require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const fs = require('fs');
const dns = require('dns');
const jsonUrl = require('./public/shortenedurl.json');
let rawUrl = fs.readFileSync('./public/shortenedurl.json');
let shortenedurl = JSON.parse(rawUrl)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function sendUrl(data, cb) {
  fs.writeFile('./public/shortenedurl.json', data, cb);
}

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let dnsUrl;
  let numShort;
  let url = req.body.url;
  let dnsReg = /https:\/\/|http:\/\//g;
  
  if ((jsonUrl.length) === 0) {
    numShort = 1;
  } else {
    numShort = (jsonUrl[(jsonUrl.length)-1]['short_url']) + 1;
  }
  
  if (dnsReg.test(url)) {
    dnsUrl = url.replace(dnsReg, "")
  } else {
    res.json({error: "Invalid URL"});
    return;
  }

  for (let i = 0; i < jsonUrl.length; i++) {
    if (jsonUrl[i]["original_url"] == url) {
      res.json(jsonUrl[i])
      return;
    }
  }

  let sendUrl = {
    "original_url": url,
    "short_url": numShort
  }
  
  dns.lookup(dnsUrl, (error) => {
    if (error) {
      res.json({error: "Invalid URL"});
      return;
    } else {
      shortenedurl.push(sendUrl);
      let jsonSend = JSON.stringify(shortenedurl);
      fs.writeFile('./public/shortenedurl.json', jsonSend, function(err) {
        if (err) return console.error(err);
        res.send(sendUrl);
      });
    }
  })
  
});

app.get('/api/shorturl/:num', function(req, res) {
  let locNum;
  let num = req.params.num;
  
  for (let i = 0; i < jsonUrl.length; i++) {
    if (jsonUrl[i]["short_url"] == num) {
      res.redirect(jsonUrl[i]["original_url"])
    }
  }
  
  res.json({"error": "No short URL found for the given input"})

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

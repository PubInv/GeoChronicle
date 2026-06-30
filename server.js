/*
Templokilo allows you to create map applications and record geomarkers in the app of your choosing.
Copyright (C) 2021 Robert Read, Diego Aspinwall and Neil Martis
Copyright (C) 2022 Robert L. Read

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const express = require("express");
const app = express();
var cors = require("cors");
require("dotenv").config({ path: __dirname + "/.env" });

const firebase = require("firebase/app");

require("firebase/auth");
require("firebase/database");

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  databaseURL: process.env.databaseURL,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};

firebase.initializeApp(firebaseConfig);

firebase
  .auth()
  .signInAnonymously()
  .catch(function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode);
    console.log(errorMessage);
  });

const ref = firebase.database().ref();

app.use(express.static(__dirname));
app.use(cors());

//app.use(bodyParser.urlencoded({ extended:false }));
//app.use(bodyParser.json());

var returnFirebaseSnapshot = (req, ref, res) => {
  var appName = req.query.appName;
  firebase
    .database()
    .ref("/apps/" + appName + ref)
    .once("value")
    .then((snapshot) => {
      res.send(JSON.stringify(snapshot));
    });
};

app.get("/returnTags", function (req, res) {
  returnFirebaseSnapshot(req, "/tags/", res);
});

// I could get a specific tag with a query param
// but REST should not make that necessary
app.get("/tags/*", function (req, res) {
  returnFirebaseSnapshot(req, req.path, res);
});

app.get("/reconfigureFromApp", function (req, res) {
  returnFirebaseSnapshot(req, "", res);
});
app.get("/deleteAllMarkers", function (req, res) {
  var appName = req.query.appName;
  console.log("in delete");
  firebase
    .database()
    .ref("/apps/" + appName + "/tags")
    .set(null,function (error) {
      if (error) {
        console.log("ERROR:", error);
      }
    })
    .then((snapshot) => {
      console.log("successful Delete");
      res.send(JSON.stringify("Successfully removed "+appName+ " tags"));
    });
});

app.get("/checkForAppInDatabase", function (req, res) {
  var appName = req.query.appName;
  firebase
    .database()
    .ref("/apps/" + appName)
    .once("value")
    .then((snapshot) => {
      res.send(JSON.stringify({ appExists: snapshot.exists() }));
    });
});

function writeTagIntoDB(obj, req) {
  firebase
    .database()
    .ref("/apps/" + req.query.appname + "/tags/" + req.query.tagId)
    .set(obj, function (error) {
      if (error) {
        console.log("ERROR:", error);
      }
    });
}

app.get("/writeTag", function (req, res) {
    console.log("Called |writeTag|");
  var obj = req.query.taginfo;
  obj["latitude"] = parseFloat(obj.latitude);
  obj["longitude"] = parseFloat(obj.longitude);
  writeTagIntoDB(obj, req);
});

app.get("/actuallyCreate", function (req, res) {
  var config = req.query.obj;
  for (const property in config) {
    if (config[property] == "false") {
      config[property] = false;
    }
    if (config[property] == "true") {
      config[property] = true;
    }
  }
  config.tags = {};
  firebase
    .database()
    .ref("apps/" + req.query.appname)
    .set(config, function (error) {
      if (error) {
        // The write failed...
        console.log("ERROR:", error);
      } else {
        // Data saved successfully!
        console.log("SUCCESS");
      }
    });
});

app.get("/updateDescription", function (req, res) {
  var appName = req.query.appName;
  var tagId = req.query.tagId;
  var description = req.query.description;

  firebase
    .database()
    .ref("/apps/" + appName + "/tags/" + tagId + "/description")
    .set(description, function (error) {
      if (error) {
        console.log("ERROR:", error);
        res.send(JSON.stringify({ success: false }));
      } else {
          console.log("success:", error);
        res.send(JSON.stringify({ success: true }));
      }
    });
});
const multer = require("multer");
const os = require("os");
//const ExifReader = require('exif-js')
const ExifReader = require("exifreader");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    console.log("compting file name");
    console.log(file);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), function (req, res) {
  // by the time we get here, multer
  // has already generated a hash name.
  // This has lost the mimetype information.
  console.log("req.body");
  console.log(req.body);
  var myobj = JSON.parse(req.body.obj);
  console.log("myobj");
  console.log(myobj);
  const title = req.body.title;
  const file = req.file;
  console.log(title);
  file.filename = file.originalname;
  console.log("file.path");
  console.log(file.path);
  console.log("file.path");

  var fake_req = {};
  fake_req.query = {};

  fake_req.query.appname = myobj.appname;
  fake_req.query.tagId = myobj.tagId;

  var obj = {};
  try {
    const data = fs.readFileSync(file.path);
    const tags = ExifReader.load(data);
    // the file.path is important to place in the
    // datastore so we can render the photo...
    myobj.taginfo.filePath = file.path;
    writeTagIntoDB(myobj.taginfo, fake_req);
  } catch (err) {
    console.error(err);
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("PJournal listening on port " + port);
});

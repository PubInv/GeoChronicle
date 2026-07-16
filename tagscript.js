/*
  Geotagtext allows you to create map applications and record geomarkers in the app of your choosing.
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


/*

I'm now undertaking the improvement to start using
local storage and allow exports from that.

At present I  will continue to use Firebase, but eventually
that will be obsolete.

Perhaps then it is best to create a firebase-snapshot to EventStore,
and switch to storing the EventStore object.

*/

const USE_LOCAL_STORAGE = false;


// This will actually work with units other than ms,
// so long as it is consistent.
// I don't know how to handler outside-of-range problems.
function computeTimeInterpolatedColor(start_ms, end_ms, time_ms) {
  const duration_ms = end_ms - start_ms;
  const fraction = (time_ms - start_ms) / (duration_ms);
  const interpolated_color = d3.interpolateRdYlBu(fraction);
  return interpolated_color;
}

// It is possible this accessToken will someday reach a limit. We recommend you change it if that occurs.

const checkForAppInDatabase = (appName) => {
  return new Promise((resolve) => {
    $.ajax({
      type: "GET",
      url: "checkForAppInDatabase",
      dataType: "json",
      data: { appName: appName },
      success: function (result) {
        return resolve(result.appExists);
      },
      error: function (e) {
        console.log("ERROR: ", e);
      },
    });
  });
};

function writeTag(
  tagId,
  lat,
  lon,
  color,
  message,
  username,
  appname,
  filepath
) {
  var d = new Date();

  var obj = {
    appname: appname,
    tagId: tagId,
    taginfo: {
      username: username,
      latitude: lat,
      longitude: lon,
      color: color,
      //      message: message,
      message: "test message",
      date: d.toUTCString(),
      filepath: filepath,
    },
  };

  //SERVER WRITE - POST, CAN ONLY GET 'GET' TO WORK

  // now I also place this tag in localStorage
  //  writeTagLS(appname,obj);

  console.log("obj:", obj);
  console.log(JSON.stringify(obj));
  $.ajax({
    type: "GET",
    url: "writeTag",
    dataType: "json",
    data: obj,
    success: function (result) {
      console.log("OBJ sent successfully");
    },
    error: function (e) {
      console.log("ERROR: ", e);
    },
  });

  document.getElementById("message").value = "";
}

// function getLastTagNumInDB() {
//   return new Promise(function (resolve, reject) {
//     $.ajax({
//       type: "GET",
//       url: "returnTags",
//       dataType: "json",
//       data: { appName: GLOBAL_APPNAME },
//       success: function (result) {
//         var highestnum = 0;
//         var v = result;
//         for (const prop in v) {
//           const n = parseInt(prop.substring("geotag".length));
//           highestnum = Math.max(highestnum, n);
//           if (highestnum == NaN) {
//             highestnum = 0;
//           }
//         }
//         resolve(highestnum);
//       },
//       error: function (e) {
//         console.log("ERROR: ", e);
//       },
//     });
//   });
// }

// function getLastTagNumInDBSynchronously() {
//   var highestnum = 0;
//   getLastTagNumInDB().then(function (data) {
//     highestnum = data;
//     console.log("data in promise");
//     console.log(data);
//   });
//   return highestnum;
// }

// async function getLastTagNumInDBandWrite(color) {
//   var highestnum = 0;

//   $.ajax({
//     type: "GET",
//     url: "returnTags",
//     dataType: "json",
//     data: { appName: GLOBAL_APPNAME },
//     success: function (result) {
//       var v = result;
//       for (const prop in v) {
//         const n = parseInt(prop.substring("geotag".length));
//         highestnum = Math.max(highestnum, n);
//         if (highestnum == NaN) {
//           highestnum = 0;
//         }
//       }
//       var options = { enableHighAccuracy: false, timeout: 10000 };
//       navigator.geolocation.getCurrentPosition(
//         (position) =>
//         createTag(
//           position,
//           color,
//           highestnum + 1,
//           GLOBAL_APPNAME,
//           "createdbyclick"
//         ),
//         error,
//         options
//       );
//     },
//     error: function (e) {
//       console.log("ERROR: ", e);
//     },
//   });
// }

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
  if (err.code == 3) {
    console.warn(
      "This may be because you are in a location where gps signal is weak. You may not be able to set a mark until you move."
    );
  }
}

function getLocation(color) {
  if (navigator.geolocation) {
    if (color == "black") {
      var options = { enableHighAccuracy: false, timeout: 10000 };
      navigator.geolocation.getCurrentPosition(
        (position) =>
          showPositionOnPage(position, color, "current location", "-current"),
        error,
        options
      );
    } else {
      getLastTagNumInDBandWrite(color);
    }
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function ExifDecodeTime(timeString, offset) {
  var mom = moment.utc(timeString, 'YYYY:MM:DD hh:mm:ss');
  mom.utcOffset(offset);
  var e_ms = mom.valueOf();
  if (mom.isValid())
    return e_ms;
  else
    return null;
}

// Note: Color her is should be "assigned color",
// we may use interplated color when we render this.
async function createPhotoUploadTag(file, tags, username, color) {
  // This should really come from the GUI somehow
  const title = "My file";
  const form = new FormData();
  const filename = file.name;
  form.append("title", title);
  form.append("file", file);
  form.append("filename", filename);
  console.log("tags", tags);
  //  var tagnum = highest_num + 1;
  //  var tagId = "geotag" + tagnum;
  // This tshould actually from the tags!
  // Hopefully this is a UTC
  if (
    !tags.GPSLatitude ||
    !tags.GPSLongitude ||
    !tags.GPSLongitudeRef
  ) {
    console.warn("Image has no GPS metadata");
    alert("This image does not contain geolocation information.");
    return;
  }
  var lat = parseFloat(tags.GPSLatitude.description);

  // note: By convention, East longitude is positive
  // Check
  var lon = parseFloat(tags.GPSLongitude.description);
  lon = tags.GPSLongitudeRef.value[0] == "W" ? -lon : lon;
  console.dir("tags");
  console.dir(tags);

  // note: here I attempt to read time the photo was taken
  var DateTimeOriginal = tags.DateTimeOriginal ? tags.DateTimeOriginal.value[0] : null;
  var DateTimeDigitized = tags.DateTimeDigitized ? tags.DateTimeDigitized.value[0] : null;
  var DateTime = tags.DateTime ? tags.DateTime.value[0] : null;
  var mainTime = DateTimeDigitized || DateTimeOriginal || DateTime;
  if (!mainTime) {
    alert("This image has no date/time information.");
    return;
  }
  // NOTE: This appears to be the EXIF format, although even
  // my phone appaears use different formats, so we have to wrap this
  // in a function and use some heurstics...

  var offsetTime = tags.OffsetTime ? tags.OffsetTime.value[0] : "+00:00";
  var e_ms = ExifDecodeTime(mainTime, offsetTime);
  var mainTimeUTC = moment.unix(e_ms / 1000).utc().toString();


  // The "filename" here is raw from an upload in this
  // code. We will turn it into a url (relative in this case)
  // by prepending "/uploads"
  var url = "uploads/" + filename;
  var safeTagId = url.replace(/[./#$[\]]/g, "_");
  var obj = {
    appname: GLOBAL_APPNAME ? GLOBAL_APPNAME : "abc",
    tagId: safeTagId,
    taginfo: {
      username: username,
      latitude: lat,
      longitude: lon,
      color: color,
      // TOOD: This should be renamed.
      message: url,
      description: "",
      date: mainTimeUTC
    },
  };
  form.append("obj", JSON.stringify(obj));

  if (USE_LOCAL_STORAGE) {
    writeTagLS(GLOBAL_APPNAME, obj);
  } else {
    writeTag(
      safeTagId,
      lat,
      lon,
      color,
      message,
      username,
      // Warning, this is dubious
      obj.appname,
      url
    );
  }

  $.ajax({
    method: "POST",
    url: "http://localhost:3000/upload",
    contentType: false,
    processData: false,
    data: form
  })
    .done((resp) => {
      console.log(resp);
      var position = { coords: { latitude: lat, longitude: lon } };
      // I might actually have to read the tag to get
      // the correct filepath here...
      // Apparently I am doing this call ONLY to get the filepath...
      // I think we can eliminate that...
      adjust_global_times(mainTime);
      var filepath = url;
      const interpolated_color =
        computeTimeInterpolatedColor(GLOBAL_START, GLOBAL_END, e_ms);
      showPositionOnPage(position, interpolated_color, filepath, filepath);
    })
    .fail((error) => console.log(error));
}

// function createTag(position, color, appname, filepath) {
//   var message = $("#message").val();
//   showPositionOnPage(position, color, message, filepath);
//   writeTag(
//     position.coords.latitude,
//     position.coords.longitude,
//     color,
//     message,
//     $("#user-name").val(),
//     appname
//   );
// }
function showPositionOnPage(position, color, message, filepath) {
  if (color != "black") {
    var x = (document.getElementById("demo").innerHTML =
      "Latitude: " +
      position.coords.latitude +
      "<br>Longitude: " +
      position.coords.longitude);
  }
  var lonDec = position.coords.longitude;
  var latDec = position.coords.latitude;
  showLngLatOnMap(lonDec, latDec, color, message, filepath);
}


// MapBox styles can have a lot of layers beyond what we explicitly add.
// It is therefore useful to keep our own array of layers for controlling
// visibility. This requires some management, particularly when
// it should be emptied on reconfi

var GLOBAL_ADDED_LAYERS = [];
// we will only one popup at a time.
var GLOBAL_POPUP = null;
function hideBasedOnTimes(start_ms, end_ms) {
  var layers = GLOBAL_ADDED_LAYERS;
  // now interate over sources, checking time!!
  for (const l in layers) {
    const layer = layers[l];
    const layer_ms = moment(layer.timestamp).valueOf();
    const v = (layer_ms >= start_ms && layer_ms <= end_ms)
      ? 'visible'
      : 'none';
    const official_layer = map.getLayer(layer.id);
    map.setLayoutProperty(official_layer.id,
      'visibility',
      v);
  }
}
function removeAllLayers() {
  var layers = GLOBAL_ADDED_LAYERS;
  // now interate over sources, checking time!!
  for (const l in layers) {
    const layer = layers[l];
    // We use the same source and layer id
    var id = layer.id;
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
    if (map.getSource(id)) {
      map.removeSource(id);
    }
  }
  GLOBAL_ADDED_LAYERS = [];
}
// if we embedded the file link, we could make this pop up render it,
// and then we could have it open the photo in a different page.
// I need to add a fileid for this to work.

// Note: We need unique tags. Originally I was generating these
// as a counter before I had file names. In general we may
// always need someway to have unique keys; however, one solution
// to this problem is just to punt---we really on the uniqueness
// of the message. This means that we have to have good error
// handling BEFORE we get here, but it is at least a self-consistent
// way of handling the problem.
function showLngLatOnMap(lonDec, latDec, color, message, filepath, timestamp) {
  var ll = new mapboxgl.LngLat(lonDec, latDec);

  // here we will interpolate color based on time.
  // This is NOT an intrinsic property of the point,
  // but a property of all the data.
  if (color == "black" && map.getStyle().sources["point-current"]) {
    map.getSource("point-current").setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lonDec, latDec],
          },
          properties: {
            description: "<p>" + message + "</p>",
            color: color,
          },
        },
      ],
    });
  } else {
    map.addSource(filepath, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lonDec, latDec],
            },
            properties: {
              description: "<p>" + message + "</p>",
              color: color,
            },
          },
        ],
      },
    });

    const newLayer = {
      id: filepath,
      source: filepath,
      type: "circle",
      paint: {
        "circle-radius": 10,
        "circle-color": ["get", "color"],
      },
      timestamp: timestamp
    };
    map.addLayer(newLayer);
    GLOBAL_ADDED_LAYERS.push(newLayer);

    map.on("mouseenter", filepath, function (e) {
      var coordinates = e.features[0].geometry.coordinates.slice();
      var description = e.features[0].properties.description;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // We will now add a direct link to the photo to the HTML in the popup,
      // and then try to add a nice thumbnail.
      const filename = filepath.split("/").pop();
      //const filename = filepath.split("/").pop();

      var fullHTML = `
<b>Filename:</b> ${filename}<br>
<b>Time:</b> ${timestamp}<br>
<a href='${filepath}' target='_blank'>window</a>

<div>
  <a href='${filepath}' download>download</a>
</div>

<img src="./${filepath}" alt="${filepath}" height="300">

<div id="desc-display">
  <p><b>Description:</b> ${e.features[0].properties.description || "No description added"}</p>
  <button onclick="editDescription('${filepath}')">Edit</button>
</div>

<div id="desc-edit-${filepath}" style="display:none">
  <textarea id="desc-text-${filepath}" rows="2" cols="30">${e.features[0].properties.Description || ""}</textarea>
  <button onclick="saveDescription('${filepath}')">Save</button>
</div>`;
      if (GLOBAL_POPUP) GLOBAL_POPUP.remove();
      GLOBAL_POPUP = new mapboxgl.Popup().setLngLat(coordinates).setHTML(fullHTML).addTo(map);
    });

    // map.on("mouseenter", "point" + n, function () {
    //   map.getCanvas().style.cursor = "pointer";
    // });

    // It would be nice to pull the pop up down on hover, but that makes it impossible to reach links in it!
    //    map.on("mouseleave", "point" + n, function () {
    //      map.getCanvas().style.cursor = "";
    //      if (GLOBAL_POPUP) GLOBAL_POPUP.remove();
    //    });
  }
}

function editDescription(filepath) {
  document.getElementById("desc-display").style.display = "none";
  document.getElementById("desc-edit-" + filepath).style.display = "block";
}

function saveDescription(filepath) {
  var newDescription = document.getElementById("desc-text-" + filepath).value;

  $.ajax({
    type: "GET",
    url: "updateDescription",
    dataType: "json",
    data: {
      appName: GLOBAL_APPNAME,
      tagId: filepath.replace(/[./#$[\]]/g, "_"),
      description: newDescription
    },
    success: function (result) {
      document.getElementById("desc-display").querySelector("p").innerHTML = "<b>Description:</b> " + newDescription;
      document.getElementById("desc-display").style.display = "block";
      document.getElementById("desc-edit-" + filepath).style.display = "none";
    },
    error: function (e) {
      console.log("ERROR: ", e);
    }
  });
}
var map;

async function loadToken() {
  const response = await fetch('mapbox');
  const config = await response.json();
  return config.mapboxkey
}

function initMap(appname) {
  // It is possible this accessToken will someday reach a limit. We recommend you change it if that occurs.
  let MAPBOXGL_ACCESSTOKEN;

  const GRAB_MAPBOX_TOKEN = loadToken();
  GRAB_MAPBOX_TOKEN.then(function (result) {
    MAPBOXGL_ACCESSTOKEN = "pk.eyJ1Ijoicm9iZXJ0bHJlYWQiLCJhIjoiY21wbzFwbjZjMDFjczJxcHZjNjY5bzF1cSJ9.vQ1VeDFxaikHIkMSb0kpqA";

    mapboxgl.accessToken = MAPBOXGL_ACCESSTOKEN;

    map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/light-v9",
      center: [-96, 37.8],
      zoom: 3,
    });

    map.on("load", () => (USE_LOCAL_STORAGE ? refreshAllDataLS(appname)
      : refreshAllDataDB(appname)))
  }
  );
}


function removeCurrentLoc() {
  var mapLayer = map.getLayer("point-current");

  if (typeof mapLayer !== "undefined") {
    map.removeLayer("point-current").removeSource("point-current");
  }
}

function putAllDataIntoLocalStorage(appname, result) {
  window.localStorage.setItem(appname,
    JSON.stringify(result));
}

function getAllDataFromLocalStorage(appname) {
  return JSON.parse(window.localStorage.getItem(appname));
}

function reportLS(appname) {
  var obj = getAllDataFromLocalStorage(appname);
  console.log("local Storage:");
  console.log(obj);
}

function writeTagLS(appname, obj) {
  var superSubject = getAllDataFromLocalStorage(appname);
  console.log("superSubject");
  console.log(superSubject);
  console.log("obj", obj);
  // WARNING! This is a bug...
  if (!superSubject) {
    superSubject = {};
    superSubject[obj.tagId] = obj;
  } else {
    superSubject[obj.tagId] = obj;
  }
  putAllDataIntoLocalStorage(appname, superSubject);
  reportLS(appname);
}


function renderMarkers(v) {

  for (const prop in v) {
    gt = v[prop];
    gti = gt;
    adjust_global_times(gt.date);
  }
  for (const prop in v) {
    gt = v[prop];
    //    gti = gt.taginfo;
    gti = gt;
    const time_ms = moment.utc(gti.date).valueOf();
    const color = computeTimeInterpolatedColor(GLOBAL_START, GLOBAL_END, time_ms);
    // Note: gt.color may remain of interest, but I am not currently rendering it.
    showLngLatOnMap(
      gti.longitude,
      gti.latitude,
      color,
      gti.description,
      gti.message,
      gti.date
    );
  }
}

function refreshAllDataLS(appname) {
  // first, remove all layers and markers and times
  clearWorkingSet();
  removeAllLayers();
  var data = getAllDataFromLocalStorage(appname);
  renderMarkers(data);
}


function refreshAllDataDB(appname) {

  // first, remove all layers and markers and times
  clearWorkingSet();
  removeAllLayers();
  if (appname) {
    $.ajax({
      type: "GET",
      url: "returnTags",
      dataType: "json",
      data: { appName: appname },
      success: function (result) {
        renderMarkers(result);
        var v = result;
        for (const prop in v) {
          const n = parseInt(prop.substring("geotag".length));
          gt = v[prop];
          adjust_global_times(gt.date);
        }
        for (const prop in v) {
          const n = parseInt(prop.substring("geotag".length));
          gt = v[prop];
          const time_ms = moment.utc(gt.date).valueOf();
          const color = computeTimeInterpolatedColor(GLOBAL_START, GLOBAL_END, time_ms);
          // Note: gt.color may remain of interest, but I am not currently rendering it.
          showLngLatOnMap(
            gt.longitude,
            gt.latitude,
            color,
            gt.description,
            gt.filePath,
            gt.date
          );
        }
      },
      error: function (e) {
        console.log("ERROR: ", e);
      },
    });
  }
}

// Rob has no idea where or how to get this...
function cryptoHash(str) {
}
class Event {
  hashContent(content) {
    return cryptoHash(str);
  }
  hashUploadTime() {
    // My understanding is that Solana offers some way of providing
    // a proof of time. We need to use that here, so that when this is recovered
    // we know that it is correct. How to get this, I don't know.

    // Note: this is "fakable" until we implement the Solana time function.
    const now = Date.now().toUTCString();
    return now;
  }
  // In a way that I don't understand yet, this needs to
  // hash together the contentHash, the timeHash, and uploader.
  hashEvent() {
    const concatenation = this.contentHash + "|" + this.uploader + "|" + this.timeHash;
    return cryptoHash(concatenation);
  }
  constructor(url, content, uploader, latitude, longitude, eventDate) {
    this.url = url;
    // In actuality, we need to use the content to compute a hash...
    this.contentHash = this.hashContent(content);
    this.longitude;
    this.latitude;
    this.uploader = uploader;
    this.timeHash = this.hashUploadTime();
    this.eventHash = this.hashEvent();
  }
}
class EventStore {
  constructor(name, context) {
    this.name = name;
    this.context = context;
    this.data = [];
  }
}
function produceEventStoreFromSnapshot(snapshot) {
  var v = result;
  for (const prop in v) {
    gt = v[prop];

  }
}

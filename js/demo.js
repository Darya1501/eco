var iconObject = L.icon({
  iconUrl: "./img/marker-icon.png",
  shadowSize: [50, 64],
  shadowAnchor: [4, 62],
  iconAnchor: [12, 40],
});

var currentProfile = "foot";

$(document).ready(function (e) {
  // reqButton.addEventListener("click", clickCallback);

  jQuery.support.cors = true;

  $(".tab-content").css("display", "none");
  $(".tabs-menu a").click(function (event) {
    // event.preventDefault();
    showTab($(this));
  });

  function showTab(thisDiv) {
    thisDiv.parent().addClass("current");
    thisDiv.parent().siblings().removeClass("current");
    var tab = thisDiv.attr("href");
    $(".tab-content").not(tab).css("display", "none");
    $(tab).fadeIn();

    // a bit hackish to refresh the map
    routingMap.invalidateSize(false);
  }

  var host; // = "http://localhost:9000/api/1";

  //
  // Sign-up for free and get your own key: https://graphhopper.com/#directions-api
  //
  var defaultKey = "c9b2b65d-be3d-4d96-b19c-48365a066ae3";
  var profile = "car";


  transportBtn = document.querySelectorAll('.sidebar-btn');
  transportBtn.forEach(btn => {
    btn.addEventListener('click', event => {
      currentProfile = event.target.closest('.sidebar-btn').id;
      let myEvent = new Event("click");
      const reqButton = document.getElementById("reqButton").dispatchEvent(myEvent);
    })
  })

  // create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot
  var ghRouting = new GraphHopper.Routing({
    key: defaultKey,
    host: host,
    vehicle: profile,
    elevation: false,
  });

  var key = "ead6894d-f9ec-4a9c-86e1-bbe84810f7fc";
  ghRouting.key = key;

  var routingMap = createMap("routing-map");
  setupRoutingAPI(routingMap, ghRouting);

  var tmpTab = window.location.hash;
  if (!tmpTab) tmpTab = "#routing";

  showTab($(".tabs-menu li > a[href='" + tmpTab + "']"));
});

function setupRoutingAPI(map, ghRouting) {
  map.setView([55.76, 37.57], 13);

  ghRouting.vehicle = currentProfile;

  var instructionsDiv = $("#instructions");
  map.on("click", function (e) {
    if (ghRouting.points.length > 1) {
      ghRouting.clearPoints();
      routingLayer.clearLayers();
    }

    L.marker(e.latlng, { icon: iconObject }).addTo(routingLayer);
    ghRouting.addPoint(new GHInput(e.latlng.lat, e.latlng.lng));
    if (ghRouting.points.length > 1) {
      // ******************
      //  Calculate route!
      // ******************
      ghRouting
        .doRequest()
        .then(function (json) {
          console.log(json);
          var path = json.paths[0];
          routingLayer.addData({
            type: "Feature",
            geometry: path.points,
          });
          var outHtml = "Distance in meter:" + path.distance;
          outHtml += "<br/>Times in seconds:" + path.time / 1000;
          outHtml +=
            "<br/><a href='" +
            ghRouting.getGraphHopperMapsLink() +
            "'>GraphHopper Maps</a>";
          $("#routing-response").html(outHtml);

          if (path.bbox) {
            var minLon = path.bbox[0];
            var minLat = path.bbox[1];
            var maxLon = path.bbox[2];
            var maxLat = path.bbox[3];
            var tmpB = new L.LatLngBounds(
              new L.LatLng(minLat, minLon),
              new L.LatLng(maxLat, maxLon)
            );
            map.fitBounds(tmpB);
          }

          instructionsDiv.empty();
          if (path.instructions) {
            var allPoints = path.points.coordinates;
            var listUL = $("<ol>");
            instructionsDiv.append(listUL);
            for (var idx in path.instructions) {
              var instr = path.instructions[idx];

              // use 'interval' to find the geometry (list of points) until the next instruction
              var instruction_points = allPoints.slice(
                instr.interval[0],
                instr.interval[1]
              );

              // use 'sign' to display e.g. equally named images

              $(
                "<li>" +
                  instr.text +
                  " <small>(" +
                  ghRouting.getTurnText(instr.sign) +
                  ")</small>" +
                  " for " +
                  instr.distance +
                  "m and " +
                  Math.round(instr.time / 1000) +
                  "sec" +
                  ", geometry points:" +
                  instruction_points.length +
                  "</li>"
              ).appendTo(listUL);
            }
          }
        })
        .catch(function (err) {
          var str = "An error occured: " + err.message;
          $("#routing-response").text(str);
        });
    }
  });

  const reqButton = document.getElementById("reqButton");
  reqButton.addEventListener("click", function () {
    ghRouting.clearPoints();
    routingLayer.clearLayers();
    ghRouting.vehicle = currentProfile;
    console.log(map, routingLayer);
    const from = document.getElementById("from");
    const to = document.getElementById("to");
    const API_KEY = "c9KsMyw2ruxx9v-I4LIYmyZ9r1gu4twXCyeF6w4sZT0";

    markers = [];
    const fromValue = from.value;
    const toValue = to.value;

    $.ajax({
      url: "https://geocoder.ls.hereapi.com/6.2/geocode.json",
      type: "GET",
      dataType: "jsonp",
      crossDomain: true,
      jsonp: "jsoncallback",
      data: {
        searchtext: fromValue,
        gen: "9",
        apiKey: API_KEY,
      },
      success: function (data) {
        markers.push({
          lat: data.Response.View[0].Result[0].Location.DisplayPosition
            .Latitude,
          lng: data.Response.View[0].Result[0].Location.DisplayPosition
            .Longitude,
        });
        $.ajax({
          url: "https://geocoder.ls.hereapi.com/6.2/geocode.json",
          type: "GET",
          dataType: "jsonp",
          jsonp: "jsoncallback",
          data: {
            searchtext: toValue,
            gen: "9",
            apiKey: API_KEY,
          },
          success: function (data) {
            markers.push({
              lat: data.Response.View[0].Result[0].Location.DisplayPosition
                .Latitude,
              lng: data.Response.View[0].Result[0].Location.DisplayPosition
                .Longitude,
            });

            markers.forEach((r) => {
                L.marker(r, { icon: iconObject }).addTo(routingLayer);
                ghRouting.addPoint(new GHInput(r.lat, r.lng));
              });
            
              // ******************
              //  Calculate route!
              // ******************
              ghRouting
                .doRequest()
                .then(function (json) {
                  var path = json.paths[0];
                  routingLayer.addData({
                    type: "Feature",
                    geometry: path.points,
                  });
                  var outHtml = "Distance in meter:" + path.distance;
                  outHtml += "<br/>Times in seconds:" + path.time / 1000;
                  outHtml +=
                    "<br/><a href='" +
                    ghRouting.getGraphHopperMapsLink() +
                    "'>GraphHopper Maps</a>";
                  $("#routing-response").html(outHtml);
            
                  if (path.bbox) {
                    var minLon = path.bbox[0];
                    var minLat = path.bbox[1];
                    var maxLon = path.bbox[2];
                    var maxLat = path.bbox[3];
                    var tmpB = new L.LatLngBounds(
                      new L.LatLng(minLat, minLon),
                      new L.LatLng(maxLat, maxLon)
                    );
                    map.fitBounds(tmpB);
                  }
            
                  instructionsDiv.empty();
                  if (path.instructions) {
                    var allPoints = path.points.coordinates;
                    var listUL = $("<ol>");
                    instructionsDiv.append(listUL);
                    for (var idx in path.instructions) {
                      var instr = path.instructions[idx];
            
                      // use 'interval' to find the geometry (list of points) until the next instruction
                      var instruction_points = allPoints.slice(
                        instr.interval[0],
                        instr.interval[1]
                      );
            
                      // use 'sign' to display e.g. equally named images
            
                      $(
                        "<li>" +
                          instr.text +
                          " <small>(" +
                          ghRouting.getTurnText(instr.sign) +
                          ")</small>" +
                          " for " +
                          instr.distance +
                          "m and " +
                          Math.round(instr.time / 1000) +
                          "sec" +
                          ", geometry points:" +
                          instruction_points.length +
                          "</li>"
                      ).appendTo(listUL);
                    }
                  }
                })
                .catch(function (err) {
                  var str = "An error occured: " + err.message;
                  $("#routing-response").text(str);
                });
          },
        });
      },
    });
  });

  var instructionsHeader = $("#instructions-header");
  instructionsHeader.click(function () {
    instructionsDiv.toggle();
  });

  var routingLayer = L.geoJson().addTo(map);
  routingLayer.options = {
    style: { color: "#00cc33", weight: 5, opacity: 0.6 },
  };
}

function makeRoute(map, routingLayer) {

  
}

function createMap(divId) {
  var osmAttr =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  var omniscale = L.tileLayer.wms(
    "https://maps.omniscale.net/v1/ghexamples-3646a190/tile",
    {
      layers: "osm",
      attribution:
        osmAttr + ', &copy; <a href="http://maps.omniscale.com/">Omniscale</a>',
    }
  );

  var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: osmAttr,
  });

  var map = L.map(divId, { layers: [omniscale] });
  L.control
    .layers({
      Omniscale: omniscale,
      OpenStreetMap: osm,
    })
    .addTo(map);
  return map;
}

function setupMapMatching(map, mmClient) {
  map.setView([50.9, 13.4], 9);
  var routeLayer = L.geoJson().addTo(map);
  routeLayer.options = {
    // use style provided by the 'properties' entry of the geojson added by addDataToRoutingLayer
    style: function (feature) {
      return feature.properties && feature.properties.style;
    },
  };

  var host =
    "https://raw.githubusercontent.com/graphhopper/directions-api-js-client/master/map-matching-examples";
  mybind("bike_example1", host + "/bike.gpx", "bike");
  mybind("car_example1", host + "/car.gpx", "car");
}

var markers = [];

// function clickCallback() {

// const from = document.getElementById("from");
// const to = document.getElementById("to");
// const API_KEY = "c9KsMyw2ruxx9v-I4LIYmyZ9r1gu4twXCyeF6w4sZT0";
//   markers = [];
//   const fromValue = from.value;
//   const toValue = to.value;

//   $.ajax({
//     url: "https://geocoder.ls.hereapi.com/6.2/geocode.json",
//     type: "GET",
//     dataType: "jsonp",
//     crossDomain: true,
//     jsonp: "jsoncallback",
//     data: {
//       searchtext: fromValue,
//       gen: "9",
//       apiKey: API_KEY,
//     },
//     success: function (data) {
//       markers.push({
//         lat: data.Response.View[0].Result[0].Location.DisplayPosition.Latitude,
//         lng: data.Response.View[0].Result[0].Location.DisplayPosition.Longitude,
//       });
//       $.ajax({
//         url: "https://geocoder.ls.hereapi.com/6.2/geocode.json",
//         type: "GET",
//         dataType: "jsonp",
//         jsonp: "jsoncallback",
//         data: {
//           searchtext: toValue,
//           gen: "9",
//           apiKey: API_KEY,
//         },
//         success: function (data) {
//           markers.push({
//             lat: data.Response.View[0].Result[0].Location.DisplayPosition
//               .Latitude,
//             lng: data.Response.View[0].Result[0].Location.DisplayPosition
//               .Longitude,
//           });

//           makeRoute();
//         },
//       });
//     },
//   });
// }

// var defaultKey = "c9b2b65d-be3d-4d96-b19c-48365a066ae3";
// var profile = "car";
// var host
// // create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot
// var ghRouting = new GraphHopper.Routing({key: defaultKey, host: host, vehicle: profile, elevation: false});

//         var key = 'ead6894d-f9ec-4a9c-86e1-bbe84810f7fc'
//         ghRouting.key = key;
// function makeRoute() {
//   var ghRouting = new GraphHopper.Routing({
//     key: defaultKey,
//     host: host,
//     vehicle: profile,
//     elevation: false,
//   });

//   markers.forEach((r) => {
//     L.marker(r, { icon: iconObject }).addTo(routingLayer);
//     ghRouting.addPoint(new GHInput(r.lat, r.lng));
//   });

//     // ******************
//     //  Calculate route!
//     // ******************
//     ghRouting
//       .doRequest()
//       .then(function (json) {
//         var path = json.paths[0];
//         routingLayer.addData({
//           type: "Feature",
//           geometry: path.points,
//         });
//         var outHtml = "Distance in meter:" + path.distance;
//         outHtml += "<br/>Times in seconds:" + path.time / 1000;
//         outHtml +=
//           "<br/><a href='" +
//           ghRouting.getGraphHopperMapsLink() +
//           "'>GraphHopper Maps</a>";
//         $("#routing-response").html(outHtml);

//         if (path.bbox) {
//           var minLon = path.bbox[0];
//           var minLat = path.bbox[1];
//           var maxLon = path.bbox[2];
//           var maxLat = path.bbox[3];
//           var tmpB = new L.LatLngBounds(
//             new L.LatLng(minLat, minLon),
//             new L.LatLng(maxLat, maxLon)
//           );
//           map.fitBounds(tmpB);
//         }

//         instructionsDiv.empty();
//         if (path.instructions) {
//           var allPoints = path.points.coordinates;
//           var listUL = $("<ol>");
//           instructionsDiv.append(listUL);
//           for (var idx in path.instructions) {
//             var instr = path.instructions[idx];

//             // use 'interval' to find the geometry (list of points) until the next instruction
//             var instruction_points = allPoints.slice(
//               instr.interval[0],
//               instr.interval[1]
//             );

//             // use 'sign' to display e.g. equally named images

//             $(
//               "<li>" +
//                 instr.text +
//                 " <small>(" +
//                 ghRouting.getTurnText(instr.sign) +
//                 ")</small>" +
//                 " for " +
//                 instr.distance +
//                 "m and " +
//                 Math.round(instr.time / 1000) +
//                 "sec" +
//                 ", geometry points:" +
//                 instruction_points.length +
//                 "</li>"
//             ).appendTo(listUL);
//           }
//         }
//       })
//       .catch(function (err) {
//         var str = "An error occured: " + err.message;
//         $("#routing-response").text(str);
//       });

// }

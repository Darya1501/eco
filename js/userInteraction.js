const from = document.getElementById("from");
const to = document.getElementById("to");
const API_KEY = "06_Y4gU2Iqa8uPbLE4wM0Dv3ZWg5q3c8xEid-OUqkNI";

reqButton.addEventListener("click", clickCallback);
var markers = [];

var routingMap = createMap("routing-map");

function clickCallback() {
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
        lat: data.Response.View[0].Result[0].Location.DisplayPosition.Latitude,
        lng: data.Response.View[0].Result[0].Location.DisplayPosition.Longitude,
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

          makeRoute();
        },
      });
    },
  });
}

var routingLayer = L.geoJson().addTo(routingMap);
routingLayer.options = {
  style: { color: "#00cc33", weight: 5, opacity: 0.6 },
};

routingMap.setView([55.76, 37.57], 13);
var defaultKey = "ead6894d-f9ec-4a9c-86e1-bbe84810f7fc";
var profile = "car";
var host
// create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot

function makeRoute() {
  var ghRouting = new GraphHopper.Routing({
    key: defaultKey,
    host: host,
    vehicle: profile,
    elevation: false,
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

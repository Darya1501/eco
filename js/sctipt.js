function init() {
    map = new OpenLayers.Map("basicMap");
    var mapnik         = new OpenLayers.Layer.OSM();
   
    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
   
    var position       = new OpenLayers.LonLat(37.57,55.76).transform( fromProjection, toProjection);
    var position2       = new OpenLayers.LonLat(37.57,55.50).transform( fromProjection, toProjection);
    var zoom           = 12; 

    map.addLayer(mapnik);
    map.setCenter(position, zoom );


    var markers = new OpenLayers.Layer.Markers( "Markers" );
    map.addLayer(markers);


    var markers1 = new OpenLayers.Layer.Markers( "Markers" );
    map.addLayer(markers1);

    markers.addMarker(new OpenLayers.Marker(position));
    markers1.addMarker(new OpenLayers.Marker(position2));

    map.setCenter(position, zoom);

  }



//   window.onload = function() {

//     var ghRouting = new GraphHopper.Routing({
//       key: "[Sign-up for free and get your own key: https://www.graphhopper.com/products/]",
//       vehicle: "car",
//       elevation: false
//     });

//     ghRouting.addPoint(new GHInput(37.378847, 55.558741));
//     ghRouting.addPoint(new GHInput(37.366847, 55.558741));

//     ghRouting.doRequest()
//       .then(function(json) {
//         // Add your own result handling here
//         console.log(json);
//       })
//       .catch(function(err) {
//         console.error(err.message);
//       });


//   };




//   window.onload = function() {
//     var ghRouting = new GraphHopper.Routing({
//       key: "ead6894d-f9ec-4a9c-86e1-bbe84810f7fc",
//       vehicle: "car",
//       elevation: false
//     });

//     ghRouting.addPoint(new GHInput(47.400905, 8.534317));
//     ghRouting.addPoint(new GHInput(47.394108, 8.538265));

//     ghRouting.doRequest()
//       .then(function(json) {
//         // Add your own result handling here
//         console.log(json);
//       })
//       .catch(function(err) {
//         console.error(err.message);
//       });


//   };

map = new OpenLayers.Map("demoMap");
map.addLayer(new OpenLayers.Layer.OSM());

const lonLat = new OpenLayers.LonLat( 37.61556, 55.75222)
  .transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );

const zoom=12;

const markers = new OpenLayers.Layer.Markers( "Markers" );
map.addLayer(markers);

markers.addMarker(new OpenLayers.Marker(lonLat));

map.setCenter (lonLat, zoom);

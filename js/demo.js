var iconObject = L.icon({
    iconUrl: './img/marker-icon.png',
    shadowSize: [50, 64],
    shadowAnchor: [4, 62],
    iconAnchor: [12, 40]
});

$(document).ready(function (e) {
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
        vrpMap.invalidateSize(false);
        geocodingMap.invalidateSize(false);
        isochroneMap.invalidateSize(false);
        mapMatchingMap.invalidateSize(false);
    }

    var host;// = "http://localhost:9000/api/1";

    //
    // Sign-up for free and get your own key: https://graphhopper.com/#directions-api
    //
    var defaultKey = "c9b2b65d-be3d-4d96-b19c-48365a066ae3";
    var profile = "car";

    // create a routing client to fetch real routes, elevation.true is only supported for vehicle bike or foot
    var ghRouting = new GraphHopper.Routing({key: defaultKey, host: host, vehicle: profile, elevation: false});
    var ghOptimization = new GraphHopper.Optimization({key: defaultKey, host: host, profile: profile});

            var key = 'ead6894d-f9ec-4a9c-86e1-bbe84810f7fc'
            ghRouting.key = key;
            ghOptimization.key = key;

    var routingMap = createMap('routing-map');
    setupRoutingAPI(routingMap, ghRouting);

    var vrpMap = createMap('vrp-map');
    setupRouteOptimizationAPI(vrpMap, ghOptimization, ghRouting);

    var tmpTab = window.location.hash;
    if (!tmpTab)
        tmpTab = "#routing";

    showTab($(".tabs-menu li > a[href='" + tmpTab + "']"));
});

function setupRoutingAPI(map, ghRouting) {
    map.setView([52.521235, 13.3992], 12);

    var instructionsDiv = $("#instructions");
    map.on('click', function (e) {
        if (ghRouting.points.length > 1) {
            ghRouting.clearPoints();
            routingLayer.clearLayers();
        }

        L.marker(e.latlng, {icon: iconObject}).addTo(routingLayer);
        ghRouting.addPoint(new GHInput(e.latlng.lat, e.latlng.lng));
        if (ghRouting.points.length > 1) {
            // ******************
            //  Calculate route! 
            // ******************
            ghRouting.doRequest()
                .then(function (json) {
                    var path = json.paths[0];
                    routingLayer.addData({
                        "type": "Feature",
                        "geometry": path.points
                    });
                    var outHtml = "Distance in meter:" + path.distance;
                    outHtml += "<br/>Times in seconds:" + path.time / 1000;
                    outHtml += "<br/><a href='" + ghRouting.getGraphHopperMapsLink() + "'>GraphHopper Maps</a>";
                    $("#routing-response").html(outHtml);

                    if (path.bbox) {
                        var minLon = path.bbox[0];
                        var minLat = path.bbox[1];
                        var maxLon = path.bbox[2];
                        var maxLat = path.bbox[3];
                        var tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
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
                            var instruction_points = allPoints.slice(instr.interval[0], instr.interval[1]);

                            // use 'sign' to display e.g. equally named images

                            $("<li>" + instr.text + " <small>(" + ghRouting.getTurnText(instr.sign) + ")</small>"
                                + " for " + instr.distance + "m and " + Math.round(instr.time / 1000) + "sec"
                                + ", geometry points:" + instruction_points.length + "</li>").appendTo(listUL);
                        }
                    }

                })
                .catch(function (err) {
                    var str = "An error occured: " + err.message;
                    $("#routing-response").text(str);
                });
        }
    });

    var instructionsHeader = $("#instructions-header");
    instructionsHeader.click(function () {
        instructionsDiv.toggle();
    });

    var routingLayer = L.geoJson().addTo(map);
    routingLayer.options = {
        style: {color: "#00cc33", "weight": 5, "opacity": 0.6}
    };
}

function setupRouteOptimizationAPI(map, ghOptimization, ghRouting) {
    map.setView([51.505, -0.09], 13);

    L.NumberedDivIcon = L.Icon.extend({
        options: {
            iconUrl: './img/marker-icon.png',
            number: '',
            shadowUrl: null,
            iconSize: new L.Point(25, 41),
            iconAnchor: new L.Point(13, 41),
            popupAnchor: new L.Point(0, -33),
            className: 'leaflet-div-icon'
        },
        createIcon: function () {
            var div = document.createElement('div');
            var img = this._createImg(this.options['iconUrl']);
            var numdiv = document.createElement('div');
            numdiv.setAttribute("class", "number");
            numdiv.innerHTML = this.options['number'] || '';
            div.appendChild(img);
            div.appendChild(numdiv);
            this._setIconStyles(div, 'icon');
            return div;
        },
        // you could change this to add a shadow like in the normal marker if you really wanted
        createShadow: function () {
            return null;
        }
    });

    var addPointToMap = function (lat, lng, index) {
        index = parseInt(index);
        if (index === 0) {
            new L.Marker([lat, lng], {
                icon: new L.NumberedDivIcon({iconUrl: './img/marker-icon.png', number: '1'}),
                bounceOnAdd: true,
                bounceOnAddOptions: {duration: 800, height: 200}
            }).addTo(routingLayer);
        } else {
            new L.Marker([lat, lng], {
                icon: new L.NumberedDivIcon({number: '' + (index + 1)}),
                bounceOnAdd: true,
                bounceOnAddOptions: {duration: 800, height: 200},
            }).addTo(routingLayer);
        }
    };

    map.on('click', function (e) {
        addPointToMap(e.latlng.lat, e.latlng.lng, ghOptimization.points.length);
        ghOptimization.addPoint(new GHInput(e.latlng.lat, e.latlng.lng));
    });

    var routingLayer = L.geoJson().addTo(map);
    routingLayer.options.style = function (feature) {
        return feature.properties && feature.properties.style;
    };

    var clearMap = function () {
        ghOptimization.clear();
        routingLayer.clearLayers();
        ghRouting.clearPoints();
        $("#vrp-response").empty();
        $("#vrp-error").empty();
    };

    var createSignupSteps = function () {
        return "<div style='color:black'>To test this example <br/>"
            + "1. <a href='https://graphhopper.com/#directions-api'>sign up for free</a>,<br/>"
            + "2. log in and request a free standard package then <br/>"
            + "3. copy the API key to the text field in the upper right corner<div>";
    };

    var getRouteStyle = function (routeIndex) {
        var routeStyle;
        if (routeIndex === 3) {
            routeStyle = {color: "cyan"};
        } else if (routeIndex === 2) {
            routeStyle = {color: "black"};
        } else if (routeIndex === 1) {
            routeStyle = {color: "green"};
        } else {
            routeStyle = {color: "blue"};
        }

        routeStyle.weight = 5;
        routeStyle.opacity = 1;
        return routeStyle;
    };

    var createGHCallback = function (routeStyle) {
        return function (json) {
            for (var pathIndex = 0; pathIndex < json.paths.length; pathIndex++) {
                var path = json.paths[pathIndex];
                routingLayer.addData({
                    "type": "Feature",
                    "geometry": path.points,
                    "properties": {
                        style: routeStyle
                    }
                });
            }
        };
    };

    var optimizeError = function (err) {
        $("#vrp-response").text(" ");

        if (err.message.indexOf("Too many locations") >= 0) {
            $("#vrp-error").empty();
            $("#vrp-error").append(createSignupSteps());
        } else {
            $("#vrp-error").text("An error occured: " + err.message);
        }
        console.error(err);
    };

    var optimizeResponse = function (json) {
        var sol = json.solution;
        if (!sol)
            return;

        $("#vrp-response").text("Solution found for " + sol.routes.length + " vehicle(s)! "
            + "Distance: " + Math.floor(sol.distance / 1000) + "km "
            + ", time: " + Math.floor(sol.time / 60) + "min "
            + ", costs: " + sol.costs);

        var no_unassigned = sol.unassigned.services.length + sol.unassigned.shipments.length;
        if (no_unassigned > 0)
            $("#vrp-error").append("<br/>unassigned jobs: " + no_unassigned);

        routingLayer.clearLayers();
        for (var routeIndex = 0; routeIndex < sol.routes.length; routeIndex++) {
            var route = sol.routes[routeIndex];

            // fetch real routes from graphhopper
            ghRouting.clearPoints();
            var firstAdd;
            for (var actIndex = 0; actIndex < route.activities.length; actIndex++) {
                var add = route.activities[actIndex].address;
                ghRouting.addPoint(new GHInput(add.lat, add.lon));

                if (!eqAddress(firstAdd, add))
                    addPointToMap(add.lat, add.lon, actIndex);

                if (actIndex === 0)
                    firstAdd = add;
            }

            var ghCallback = createGHCallback(getRouteStyle(routeIndex));

            ghRouting.doRequest({instructions: false})
                .then(ghCallback)
                .catch(function (err) {
                    var str = "An error for the routing occurred: " + err.message;
                    $("#vrp-error").text(str);
                });
        }
    };

    var eqAddress = function (add1, add2) {
        return add1 && add2
            && Math.floor(add1.lat * 1000000) === Math.floor(add2.lat * 1000000)
            && Math.floor(add1.lon * 1000000) === Math.floor(add2.lon * 1000000);
    };

    var optimizeRoute = function () {
        if (ghOptimization.points.length < 3) {
            $("#vrp-response").text("At least 3 points required but was: " + ghOptimization.points.length);
            return;
        }
        $("#vrp-response").text("Calculating ...");
        ghOptimization.doVRPRequest($("#optimize_vehicles").val())
            .then(optimizeResponse)
            .catch(optimizeError);
    };

    $("#vrp_clear_button").click(clearMap);

    // Increase version if one of the examples change, see #2
    var exampleVersion = 2;

    $("#set_example_vrp").click(function () {
        $.getJSON("route-optimization-examples/vrp_lonlat_new.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_tsp").click(function () {
        $.getJSON("route-optimization-examples/tsp_lonlat_new.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_tsp2").click(function () {
        $.getJSON("route-optimization-examples/tsp_lonlat_end.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([51, 10], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_us_tour").click(function () {
        $.getJSON("route-optimization-examples/american_road_trip.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([38.754083, -101.074219], 4);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#set_example_uk_tour").click(function () {
        $.getJSON("route-optimization-examples/uk50.json?v=" + exampleVersion, function (jsonData) {

            clearMap();
            map.setView([54.136696, -4.592285], 6);
            $("#vrp-response").text("Calculating ...");
            ghOptimization.doRequest(jsonData)
                .then(optimizeResponse)
                .catch(optimizeError);
        });
    });

    $("#optimize_button").click(optimizeRoute);
}


function createMap(divId) {
    var osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    var omniscale = L.tileLayer.wms('https://maps.omniscale.net/v1/ghexamples-3646a190/tile', {
        layers: 'osm',
        attribution: osmAttr + ', &copy; <a href="http://maps.omniscale.com/">Omniscale</a>'
    });

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: osmAttr
    });

    var map = L.map(divId, {layers: [omniscale]});
    L.control.layers({
        "Omniscale": omniscale,
        "OpenStreetMap": osm
    }).addTo(map);
    return map;
}

function setupMapMatching(map, mmClient) {
    map.setView([50.9, 13.4], 9);
    var routeLayer = L.geoJson().addTo(map);
    routeLayer.options = {
        // use style provided by the 'properties' entry of the geojson added by addDataToRoutingLayer
        style: function (feature) {
            return feature.properties && feature.properties.style;
        }
    };

    function mybind(key, url, vehicle) {
        $("#" + key).click(function (event) {
            $("#" + key).prop('disabled', true);
            $("#map-matching-response").text("downloading file ...");
            $.get(url, function (content) {
                var dom = (new DOMParser()).parseFromString(content, 'text/xml');
                var pathOriginal = toGeoJSON.gpx(dom);
                routeLayer.clearLayers();
                pathOriginal.features[0].properties = {style: {color: "black", weight: 2, opacity: 0.9}};
                routeLayer.addData(pathOriginal);
                $("#map-matching-response").text("send file ...");
                $("#map-matching-error").text("");
                if (!vehicle)
                    vehicle = "car";
                mmClient.vehicle = vehicle;
                mmClient.doRequest(content)
                    .then(function (json) {
                        $("#map-matching-response").text("calculated map matching");
                        var matchedPath = json.paths[0];
                        var geojsonFeature = {
                            type: "Feature",
                            geometry: matchedPath.points,
                            properties: {style: {color: "#00cc33", weight: 6, opacity: 0.4}}
                        };
                        routeLayer.addData(geojsonFeature);
                        if (matchedPath.bbox) {
                            var minLon = matchedPath.bbox[0];
                            var minLat = matchedPath.bbox[1];
                            var maxLon = matchedPath.bbox[2];
                            var maxLat = matchedPath.bbox[3];
                            var tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                            map.fitBounds(tmpB);
                        }
                        $("#" + key).prop('disabled', false);
                    })
                    .catch(function (err) {
                        $("#map-matching-response").text("");
                        $("#map-matching-error").text(err.message);
                        $("#" + key).prop('disabled', false);
                    });//doRequest
            });// get
        });//click
    }

    var host = "https://raw.githubusercontent.com/graphhopper/directions-api-js-client/master/map-matching-examples";
    mybind("bike_example1", host + "/bike.gpx", "bike");
    mybind("car_example1", host + "/car.gpx", "car");
}

window.usng_map = (function() {
    /**
     *  Custom Leaflet Classes
     */
    L.Control.HoverPopup = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-hoverpopup');
            return container;
        },
        show: function() {
            $(".leaflet-control-hoverpopup")
                .show();
        },
        hide: function() {
            $(".leaflet-control-hoverpopup")
                .hide();
        }
    });
    L.Control.DragSelect = L.Control.extend({
        options: {
            position: 'topleft',
            onClick: function() {}
        },
        onAdd: function(map) {
            // happens after added to map
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-dragselect');
            var button = L.DomUtil.create('a', 'button-dragselect', container);
            var icon = L.DomUtil.create('i', 'fa fa-object-group', button);
            L.DomEvent.addListener(container, 'click', this.options.onClick);
            return container;
        }
    });
    L.Control.ZoomToExtent = L.Control.extend({
        options: {
            position: 'topleft',
            onClick: function() {}
        },
        onAdd: function(map) {
            // happens after added to map
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-zoom-extent');
            var button = L.DomUtil.create('a', 'button-zoom-extent', container);
            var icon = L.DomUtil.create('i', 'fa fa-globe', button);
            L.DomEvent.addListener(container, 'click', this.options.onClick);
            return container;
        }
    });
    /**
     * Map Setup
     */
    var _map, _modal;
    var _dragSelectActive = false;
    var _zoomExtentButton = new L.Control.ZoomToExtent({
        onClick: _zoomToExtent
    });
    var _config = {
        data: {
            "usng_10k": "../data/10k.json",
            "city": "../data/city.json",
            "state": "../data/iowa.json"
        },
        mapLocation: "maps/",
        mapExtent: [
            [40.379535, -96.631756],
            [43.501391, -90.141582]
        ]
    };
    var _basemap = new L.TileLayer("http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    var _layers = {
        "city": new L.geoJson(null, {
            stroke: true,
            color: "#333333",
            weight: 2,
            dashArray: "2, 3",
            opacity: 1,
            fill: false,
            clickable: true,
            className: "city"
        }),
        "state": new L.geoJson(null, {
            stroke: true,
            color: "#333333",
            weight: 3,
            opacity: 1,
            fill: false,
            clickable: false,
            className: "state",
            pointerEvents: 'none'
        }),
        "usng_10k": new L.geoJson(null, {
            stroke: true,
            color: "#333333",
            weight: 2,
            opacity: 1,
            fill: false,
            clickable: true,
            className: "usng_10k"
        })
    };
    // Class for determining whether the map layers are fully loaded 
    function LoadCheck(callback) {
        var self = this;
        var _layerList = {};
        var _callback = callback;
        this.newLayer = function(ln) {
            _layerList[ln] = false;
        };
        this.loaded = function(ln) {
            _layerList[ln] = true;
            self.checkIfLoaded();
        };
        this.checkIfLoaded = function() {
            var loaded = true;
            $.each(_layerList, function(i, l) {
                if (l == false) {
                    loaded = false;
                    return false;
                }
            });
            if (loaded) {
                _callback();
            }
        };
    };

    function _checkIfGeoJSON(obj) {
        if (typeof obj.type != "undefined" && (obj.type == "Point" || obj.type == "MultiPoint" || obj.type == "LineString" || obj.type == "MultiLineString" || obj.type == "Polygon" || obj.type == "MultiPolygon" || obj.type == "GeometryCollection" || obj.type == "FeatureCollection")) {
            return true;
        } else {
            return false;
        }
    };
    // If we recieve the data files in the ESRI JSON format, we'll need to convert them to GeoJSON
    function _createGeoJSONFromArcGIS(obj) {
        if (typeof obj.spatialReference != "undefined" && obj.spatialReference.wkid == 4326) {
            var featureCollection = {
                type: 'FeatureCollection',
                features: []
            };
            $.each(obj.features, function(i, feature) {
                featureCollection.features.push(L.esri.Util.arcgisToGeoJSON(feature));
            });
            return featureCollection;
        } else {
            throw ": input file not in lat/lon coordinates";
        }
    };
    // Get all our data layers
    function _getLayerData(callback) {
        // create an object that will keep track of when our layers have been loaded
        var isLoaded = new LoadCheck(callback);
        // cycle through the _config-specified layers and get them set up
        $.each(_layers, function(layername, layer) {
            isLoaded.newLayer(layername);
            $.getJSON(_config.data[layername], function(data) {
                isLoaded.loaded(layername);
                // if the layer is proper GeoJSON, add directly to the layer
                // otherwise, the layer is probably an ArcGIS export, and therefore we need
                // to use the Esri Leaflet plugin to read the layer
                if (_checkIfGeoJSON(data)) {
                    _layers[layername].addData(data)
                } else {
                    _layers[layername].addData(_createGeoJSONFromArcGIS(data));
                }
            });
        });
    };

    function _zoomToExtent() {
        // fit the map extent to the specified boundaries
        _map.fitBounds(_config.mapExtent);
    };

    function create(options) {
        // initialize a map with the empty layers
        _map = L.map(options.mapID, {
            layers: [_basemap, _layers.state, _layers.usng_10k, _layers.city]
        });
        _modal = L.control.window(_map, {
            maxWidth: 'none'
        });
        _zoomExtentButton.addTo(_map);
        // get the layer data from the JSON files
        _getLayerData(function() {
            // when everything is loaded, rearrange files
            _layers.usng_10k.bringToBack();
            // make sure the state layer is in the back
            _layers.state.bringToBack();
            // and the city layer sits on top of the USNG 10k maps
            _layers.city.bringToFront();
        });
        // fit the map extent to the specified boundaries
        _zoomToExtent();
        _hover.init();
        _click.init();
        _dragSelect.init();
    };

    function _showResults(cities, grids) {
        if (cities.length > 0 || grids.length > 0) {
            var $text = $("<ul></ul>");
            $.each(cities, function(i, text) {
                $("<li><a href='" + _config.mapLocation + text + ".pdf'>" + text + "</a></li>").appendTo($text);
            });
            $.each(grids, function(i, text) {
                $("<li><a href='" + _config.mapLocation + text + ".pdf'>" + text + "</a></li>").appendTo($text);
            });
            _modal.title("Selected")
                .content($text.html())
                .show();
        } else {
            _modal.hide();
        }
    }
    /**
     * Selection Method Modules
     */
    var _hover = (function() {
        var _hovered = {
            cities: [],
            usng_10k: []
        };
        var _popup = new L.Control.HoverPopup();

        function _updateText() {
            if (_hovered.cities.length > 0 || _hovered.usng_10k.length > 0) {
                var $hoverText = $("<ul></ul>");
                $.each(_hovered.cities, function(i, text) {
                    $hoverText.append("<li>" + text + "</li>");
                });
                $.each(_hovered.usng_10k, function(i, text) {
                    $hoverText.append("<li>" + text + "</li>");
                });
                $(".leaflet-control-hoverpopup")
                    .empty();
                $(".leaflet-control-hoverpopup")
                    .append($hoverText);
                _popup.show();
            } else {
                $(".leaflet-control-hoverpopup")
                    .empty();
                _popup.hide();
            }
        };

        function _checkForIntersection(mouseEvent) {
            $.each(_hovered, function(key, selected) {
                _hovered[key] = [];
            });
            var grids = leafletPip.pointInLayer(mouseEvent.latlng, _layers.usng_10k);
            var cities = leafletPip.pointInLayer(mouseEvent.latlng, _layers.city);
            $.each(grids, function(i, layer) {
                _hovered.usng_10k.push(layer.feature.properties.GRID_10K);
            });
            $.each(cities, function(i, layer) {
                _hovered.cities.push(layer.feature.properties.GRID1MIL);
            });
            _updateText();
        };

        function init() {
            _popup.addTo(_map);
            _map.on("mousemove", function(e) {
                _checkForIntersection(e);
            });
        }
        return {
            init: init
        }
    })();
    var _click = (function() {
        var _clicked = {
            cities: [],
            usng_10k: []
        };

        function _click(mouseEvent) {
            $.each(_clicked, function(key, selected) {
                _clicked[key] = [];
            });
            var grids = leafletPip.pointInLayer(mouseEvent.latlng, _layers.usng_10k);
            var cities = leafletPip.pointInLayer(mouseEvent.latlng, _layers.city);
            $.each(grids, function(i, layer) {
                _clicked.usng_10k.push(layer.feature.properties.GRID_10K);
            });
            $.each(cities, function(i, layer) {
                _clicked.cities.push(layer.feature.properties.GRID1MIL);
            });
            _showResults(_clicked.cities, _clicked.usng_10k);
        };

        function init() {
            _map.on("mousedown", function(e) {
                if (!_dragSelectActive) {
                    _click(e);
                }
            });
        }
        return {
            init: init
        }
    })();
    var _dragSelect = (function() {
        var _button = new L.Control.DragSelect({
            onClick: _toggle
        });
        var _selected = {
            cities: [],
            usng_10k: []
        };
        var _handler;

        function _toggle() {
            if (!_dragSelectActive) {
                $(".button-dragselect")
                    .addClass("selected");
                // enable drawing
                _dragSelectActive = true;
                _handler.enable();
            } else {
                $(".button-dragselect")
                    .removeClass("selected");
                _dragSelectActive = false;
                _handler.disable();
            }
        };

        function _getResults(e) {
            if (e) {
                var drawnFeature = e.layer.toGeoJSON();
                var city = _layers.city.toGeoJSON();
                var usng_10k = _layers.usng_10k.toGeoJSON();
                _selected.cities = [];
                _selected.usng_10k = [];
                $.each(city.features, function(i, feature) {
                    var intersection = (typeof turf.intersect(feature, drawnFeature) !== "undefined") ? true : false;
                    if (intersection) {
                        _selected.cities.push(feature.properties.GRID1MIL);
                    }
                });
                $.each(usng_10k.features, function(i, feature) {
                    var intersection = (typeof turf.intersect(feature, drawnFeature) !== "undefined") ? true : false;
                    if (intersection) {
                        _selected.usng_10k.push(feature.properties.GRID_10K);
                    }
                });
                if (_selected.cities.length > 0 || _selected.usng_10k.length > 0) {
                    _showResults(_selected.cities, _selected.usng_10k);
                } else {
                    _modal.hide();
                }
            }
        };

        function init() {
            if (typeof L === "undefined" || typeof $ === "undefined" || typeof turf === "undefined" || typeof L.Draw === "undefined" || typeof leafletPip === "undefined" || typeof L.Control.Window === "undefined" || typeof L.esri === "undefined") {
                throw "USNG Map: Check to make sure all libraries are loaded.";
            }
            // update default Leaflet.Draw tooltips
            L.drawLocal.draw.handlers.rectangle.tooltip.start = "Click and drag to select features";
            L.drawLocal.draw.handlers.simpleshape.tooltip.end = "Release mouse when done selecting";
            _handler = new L.Draw.Rectangle(_map, {
                repeatMode: true
            });
            _button.addTo(_map);
            _map.on("draw:created", function(e) {
                if (_dragSelectActive == true) {
                    _getResults(e);
                    _handler.enable();
                }
            });
        }
        return {
            init: init
        }
    })();
    return {
        create: create
    }
})();

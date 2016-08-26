window.usng_map = (function() {
    /**
     *  Custom Leaflet Classes
     *  These create additional buttons and displays within the Leaflet map
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
            $(".leaflet-control-hoverpopup").show();
        },
        hide: function() {
            $(".leaflet-control-hoverpopup").hide();
        }
    });
    L.Control.DragSelect = L.Control.extend({
        options: {
            position: 'topleft',
            onClick: function() {}
        },
        onAdd: function(map) {
            var self = this;
            // happens after added to map
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-dragselect');
            var button = L.DomUtil.create('a', 'button-dragselect', container);
            var icon = L.DomUtil.create('i', 'fa fa-object-group', button);
            L.DomEvent.addListener(container, 'click', function(e) {
                L.DomEvent.stopPropagation(e);
                self.options.onClick();
            });
            return container;
        }
    });
    L.Control.ZoomToExtent = L.Control.extend({
        options: {
            position: 'topleft',
            onClick: function() {}
        },
        onAdd: function(map) {
            var self = this;
            // happens after added to map
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-zoom-extent');
            var button = L.DomUtil.create('a', 'button-zoom-extent', container);
            var icon = L.DomUtil.create('i', 'fa fa-globe', button);
            L.DomEvent.addListener(container, 'click', function(e) {
                L.DomEvent.stopPropagation(e);
                self.options.onClick();
            });
            return container;
        }
    });
    /**
     * Map Setup
     */
    var $appContainer;
    var $map = $("<div id='inner_map_container'></div>");
    var $results = $("<div id='results_container'><div class='close_results'><i class='fa fa-times-circle'></i> Results</div><div class='results_list'></div></div>");
    var _map;
    var _dragSelectActive = false;
    var _debug = false;
    var _zoomExtentButton = new L.Control.ZoomToExtent({
        onClick: _zoomToExtent
    });
    var _config;
    var _basemap;
    // the layers to be added to the map. JSON Data will be added to each layer after the map is created. 
    var _layers = {
        "usng_1k": new L.geoJson(null, {
            stroke: true,
            color: "#333333",
            weight: 2,
            dashArray: "2, 3",
            opacity: 1,
            fill: false,
            clickable: true,
            className: "usng_1k"
        }),
        "state": new L.geoJson(null, {
            stroke: true,
            color: "#333333",
            weight: 10,
            opacity: 0.3,
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
    /** 
     * Classes
     */
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
    /** 
     * Private Functions
     */
    // Rudimentary check to see if an object is valid GeoJSON
    function _checkIfGeoJSON(obj) {
        if (typeof obj.type != "undefined" && (obj.type == "Point" || obj.type == "MultiPoint" || obj.type == "LineString" || obj.type == "MultiLineString" || obj.type == "Polygon" || obj.type == "MultiPolygon" || obj.type == "GeometryCollection" || obj.type == "FeatureCollection")) {
            return true;
        }
        else {
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
        }
        else {
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
            var url = _config.layers[layername].dataLocation;
            $.getJSON(url, function(data) {
                isLoaded.loaded(layername);
                // if the layer is proper GeoJSON, add directly to the layer
                // otherwise, the layer is probably an ArcGIS export, and therefore we need
                // to use the Esri Leaflet plugin to read the layer
                var layerGeoJSON;
                if (_checkIfGeoJSON(data)) {
                    layerGeoJSON = data;
                }
                else {
                    layerGeoJSON = _createGeoJSONFromArcGIS(data);
                }
                _layers[layername].addData(layerGeoJSON);
                if (typeof _config.layers[layername].color !== "undefined") {
                    _layers[layername].setStyle({
                        color: _config.layers[layername].color
                    });
                };
                if (typeof _config.layers[layername].showLabels !== "undefined" && _config.layers[layername].showLabels === true) {
                    _labels.createLabelsFromGeoJSON(layername, layerGeoJSON, _config.layers[layername].labelPropertyName);
                }
            });
        });
    };
    // Zoom the map to the full map extent
    function _zoomToExtent() {
        // fit the map extent to the specified boundaries
        _map.fitBounds(_config.map_extent);
    };
    // Change the classes applied to the app container based on the current window size and aspect ratio
    function _updateSizeClasses() {
        if ($appContainer.width() < 500) {
            $appContainer.addClass("small_screen");
            $appContainer.removeClass("large_screen");
        }
        else {
            $appContainer.addClass("large_screen");
            $appContainer.removeClass("small_screen");
            if ($appContainer.width() / $appContainer.height() < 1) {
                $appContainer.removeClass("horizontal_aspect");
                $appContainer.addClass("vertical_aspect");
            }
            else {
                $appContainer.removeClass("vertical_aspect");
                $appContainer.addClass("horizontal_aspect");
            }
        }
    };
    /** 
     * Public Functions
     */
     // Used to initialize the app
    function create(options) {
        // the user should have specified a map ID
        if (typeof options.mapID === "undefined") {
            // the user didn't specify a map ID (usually a div) 
            throw "USNG Map: Creating the map requires an HTML ID. This ID should point to a container that will hold the map.";
        }
        // get our data 
        $.getJSON("config.json", function(data) {
            $appContainer = $("#" + options.mapID).addClass("usng_web_map").addClass("hide_results");
            _updateSizeClasses();
            $map.appendTo($appContainer);
            $results.appendTo($appContainer);
            _config = data;
            _basemap = L.esri.basemapLayer(_config.basemap);
            // initialize a map with the empty layers
            _map = L.map("inner_map_container", {
                layers: [_basemap, _layers.state, _layers.usng_10k, _layers.usng_1k]
            });
            _zoomExtentButton.addTo(_map);
            // create some global variables for debugging, if specified
            if (typeof options.debug != "undefined" && options.debug === true) {
                _debug = true;
                window.app = {};
                window.app.map = _map;
                window.app.layers = _layers;
            }
            // get the layer data from the JSON files
            _getLayerData(function() {
                // when everything is loaded, rearrange files
                _layers.usng_10k.bringToBack();
                // make sure the state layer is in the back
                _layers.state.bringToBack();
                // and the usng_1k layer sits on top of the USNG 10k maps
                _layers.usng_1k.bringToFront();
            });
            // fit the map extent to the specified boundaries
            _zoomToExtent();
            // initialize all the modules
            _hover.init();
            _click.init();
            _dragSelect.init();
            _labels.init();
            results.init();
            $(window).resize(_updateSizeClasses);
        });
    };
    /** 
     *
     * Modules
     *
     */
     // Results
    var results = (function() {
        function _getDOM(usng_1k, usng_10k) {
            if (usng_1k.length > 0 || usng_10k.length > 0) {
                var $text = $("<ul></ul>");
                $.each(usng_1k, function(i, text) {
                    $("<li><a href='" + _config.layers["usng_1k"].mapbookLocations + text + ".pdf'>" + text + "</a></li>").appendTo($text);
                });
                $.each(usng_10k, function(i, text) {
                    $("<li><a href='" + _config.layers["usng_10k"].mapbookLocations + text + ".pdf'>" + text + "</a></li>").appendTo($text);
                });
                return $text;
            }
            else {
                return false;
            }
        };

        function show(usng_1k, usng_10k) {
            var $dom = _getDOM(usng_1k, usng_10k);
            if ($dom) {
                $results.find(".results_list").empty().append($dom);
                $appContainer.removeClass("hide_results");
                $appContainer.addClass("show_results");
                _map.invalidateSize();
            }
        };

        function hide() {
            $appContainer.removeClass("show_results");
            $appContainer.addClass("hide_results");
            _map.invalidateSize();
        };

        function init() {
            $(document).on("click", ".close_results i", hide);
        };
        return {
            show: show,
            hide: hide,
            init: init
        }
    })();
    // Map hovering
    var _hover = (function() {
        var _hovered = {
            usng_1k: [],
            usng_10k: []
        };
        var _popup = new L.Control.HoverPopup();

        function _updateText() {
            if (_hovered.usng_1k.length > 0 || _hovered.usng_10k.length > 0) {
                var $hoverText = $("<ul></ul>");
                $.each(_hovered.usng_1k, function(i, text) {
                    $hoverText.append("<li>" + text + "</li>");
                });
                $.each(_hovered.usng_10k, function(i, text) {
                    $hoverText.append("<li>" + text + "</li>");
                });
                $(".leaflet-control-hoverpopup").empty();
                $(".leaflet-control-hoverpopup").append($hoverText);
                _popup.show();
            }
            else {
                $(".leaflet-control-hoverpopup").empty();
                _popup.hide();
            }
        };

        function _checkForIntersection(mouseEvent) {
            $.each(_hovered, function(key, selected) {
                _hovered[key] = [];
            });
            var usng_10k = leafletPip.pointInLayer(mouseEvent.latlng, _layers.usng_10k);
            var labels_10k = _config.layers["usng_10k"].labelPropertyName;
            var usng_1k = leafletPip.pointInLayer(mouseEvent.latlng, _layers.usng_1k);
            var labels_1k = _config.layers["usng_1k"].labelPropertyName;
            $.each(usng_10k, function(i, layer) {
                _hovered.usng_10k.push(layer.feature.properties[labels_10k]);
            });
            $.each(usng_1k, function(i, layer) {
                _hovered.usng_1k.push(layer.feature.properties[labels_1k]);
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
    // Map clicking
    var _click = (function() {
        var _clicked = {
            usng_1k: [],
            usng_10k: []
        };

        function _click(mouseEvent) {
            $.each(_clicked, function(key, selected) {
                _clicked[key] = [];
            });
            var usng_10k = leafletPip.pointInLayer(mouseEvent.latlng, _layers.usng_10k);
            var labels_10k = _config.layers["usng_10k"].labelPropertyName;
            var usng_1k = leafletPip.pointInLayer(mouseEvent.latlng, _layers.usng_1k);
            var labels_1k = _config.layers["usng_1k"].labelPropertyName;
            $.each(usng_10k, function(i, layer) {
                _clicked.usng_10k.push(layer.feature.properties[labels_10k]);
            });
            $.each(usng_1k, function(i, layer) {
                _clicked.usng_1k.push(layer.feature.properties[labels_1k]);
            });
            results.show(_clicked.usng_1k, _clicked.usng_10k);
        };

        function init() {
            _map.on("click", function(e) {
                if (!_dragSelectActive) {
                    _click(e);
                }
            });
        }
        return {
            init: init
        }
    })();
    // Map drag-selecting
    var _dragSelect = (function() {
        var _button = new L.Control.DragSelect({
            onClick: _toggle
        });
        var _selected = {
            usng_1k: [],
            usng_10k: []
        };
        var _handler;

        function _toggle() {
            if (!_dragSelectActive) {
                $(".button-dragselect").addClass("selected");
                // enable drawing
                _dragSelectActive = true;
                _handler.enable();
            }
            else {
                $(".button-dragselect").removeClass("selected");
                _dragSelectActive = false;
                _handler.disable();
            }
        };

        function _getResults(e) {
            if (e) {
                var drawnFeature = e.layer.toGeoJSON();
                var usng_1k = _layers.usng_1k.toGeoJSON();
                var usng_10k = _layers.usng_10k.toGeoJSON();
                _selected.usng_1k = [];
                _selected.usng_10k = [];
                $.each(usng_1k.features, function(i, feature) {
                    var intersection = (typeof turf.intersect(feature, drawnFeature) !== "undefined") ? true : false;
                    if (intersection) {
                        _selected.usng_1k.push(feature.properties.GRID1MIL);
                    }
                });
                $.each(usng_10k.features, function(i, feature) {
                    var intersection = (typeof turf.intersect(feature, drawnFeature) !== "undefined") ? true : false;
                    if (intersection) {
                        _selected.usng_10k.push(feature.properties.GRID_10K);
                    }
                });
                if (_selected.usng_1k.length > 0 || _selected.usng_10k.length > 0) {
                    results.show(_selected.usng_1k, _selected.usng_10k);
                }
                else {
                    results.hide();
                }
            }
        };

        function init() {
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
    // Map Labels
    var _labels = (function() {
        var _layerLabels = {};

        function createLabelsFromGeoJSON(layername, geoJSON, propertyToDisplay) {
            var labelCollection = [];
            $.each(geoJSON.features, function(i, feature) {
                var centroid = turf.centroid(feature);
                var icon = L.divIcon({
                    className: 'feature-label ' + layername,
                    html: feature.properties[propertyToDisplay]
                });
                var location = L.latLng(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]);
                var label = L.marker(location, {
                    icon: icon
                }).addTo(_map);
                // center icon HTML and attach properties to data object
                var iconMargin = ($(label._icon).width() / 2) * -1;
                $(label._icon).data(feature.properties).css("margin-left", iconMargin);
                // add label to list
                labelCollection.push(label);
            });
            _layerLabels[layername] = labelCollection;
        };

        function _showLabels() {
            $('.feature-label').show();
        };

        function _hideLabels() {
            $('.feature-label').hide();
        };

        function _zoomChange() {
            if (_map.getZoom() > 10) {
                _showLabels();
            }
            else {
                _hideLabels();
            }
        };

        function init() {
            _map.on('zoomend', _zoomChange);
            if (_debug === true) {
                window.app.layerLabels = _layerLabels;
            }
        };
        return {
            createLabelsFromGeoJSON: createLabelsFromGeoJSON,
            init: init
        }
    })();
    return {
        create: create
    }
})();

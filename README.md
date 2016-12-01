# USNG Web Map v1.0.1
A library for creating a specific Leaflet-based map for the state of Iowa. The map application allows users to select via interactive map the state's repository of print maps. 

### Installation 
***
* Copy `dist` folder contents into root of website
* Replace contents of `data` as required, keeping filenames. Required files:
    * `state.json` - boundary of Iowa, JSON
    * `usng_10k.json` - USNG 10k JSON
    * `usng_1k.json` - USNG Mapbook JSON
* Make any required changes to `config.json`
* Include these files in HTML :

```HTML  
<link rel="stylesheet" href="path/to/usng-web-map.css">
<script src="path/to/usng-web-map.js"></script> 
```
* Initialize the web map on your chosen `div` by adding this javascript to your code:
```Javascript 
usng_map.create({
    mapID: "map" // the ID of the div
});
```

### Options
***
Altering `config.json` allows for modification of certain app settings like: map extent, layer data sources, and path colors

#### General
* `map_extent`: lat/lng bounds for zoom extent button
* `basemap`: refers to the [ESRI basemap](https://esri.github.io/esri-leaflet/api-reference/layers/basemap-layer.html) that will be displayed

#### Layer Settings
* `dataLocation`: (String) location of GeoJSON feature data, for display on the map
* `mapbookLocation`: (String) location of mapbook directory for download
* `showLabels`: (boolean) whether or not to show labels on the map for the displayed features
* `labelPropertyName`: (String) the property in the GeoJSON that should be used to label the feature (e.g. 10k maps should use the `GRID_10K` property in the data file to name each 10k feature)
* `color`: the layer's path stroke color 

### Custom Build
***
If you need to make changes beyond what's in `config.json` (like editing the source code), you can make a custom build of the app. To create a custom build, you'll need to use Node, which will perform tasks like: concatenating and minifying dependencies, and converting stylesheets. 

#### Requirements:
* Node.js

#### Steps:
* Copy entire repository
* `npm install` within directory
* Make changes to `src`
* `grunt` to build 

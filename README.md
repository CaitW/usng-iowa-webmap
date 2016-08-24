# USNG Web Map

#### To install: 
 - Copy `dist` folder contents into root of website
 - Replace contents of `data` as required, keeping filenames
 - Make any required changes to `config.json`
 - Include these files in HTML :

```HTML  
<link rel="stylesheet" href="path/to/usng-web-map.css">
<script src="path/to/usng-web-map.js"></script> 
```
- Initialize the web map on your chosen `div` by adding this javascript to your code:
```Javascript 
usng_map.create({
    mapID: "map" // the ID of the div
});
```

#### To make a custom build:
All required dependences are concatenated and minified to create the files in `/dist`. To make changes to the app source code, you'll need to make changes and then rebuild. Steps:
 - Copy entire repository
 - `npm install` within directory
 - Make changes to `src`
 - `grunt` to build 

#### Config.json
Allows for modification of certain app settings
 ##### General
* `map_extent`: lat/lng bounds for zoom extent button
* `basemap`: refers to the [ESRI basemap](https://esri.github.io/esri-leaflet/api-reference/layers/basemap-layer.html) that will be displayed
 ##### Layer Settings
- `dataLocation`: (String) location of GeoJSON feature data, for display on the map
- `mapbookLocation`: (String) location of mapbook directory for download
- `showLabels`: (boolean) whether or not to show labels on the map for the displayed features
- `labelPropertyName`: (String) the property in the GeoJSON that should be used to label the feature (e.g. 10k maps should use the `GRID_10K` property in the data file to name each 10k feature)
- `color`: the layer's path stroke color 

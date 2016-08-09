'use strict';


let mapdraw = function () {
    'ngInject';
    var L = require('leaflet');
    L.Icon.Default.imagePath = '../node_modules/leaflet/dist/images/';

    return {
      restrict: 'AE',
      template: '<div id="map2"></div>',
      scope: {
         opt: '='
      }, //isolate the scope

      link: function(scope, elem, attrs) {

      require('leaflet-draw');

      //Default markers are too big for many coord, use a small marker instead.
      var redIcon = L.icon({
                iconUrl: '../src/admin/img/marker2.png',
                iconSize: [54, 54] // size of the icon
      });

      console.log(scope.opt.url);
      console.log("mapdraw");
      var url = scope.opt.url,
      attrib = scope.opt.attribute,
      tiles = L.tileLayer(url, {maxZoom: 18, attribution: attrib}),
      map = new L.Map('map2', {layers: [tiles], center: new L.LatLng(scope.opt.lat, scope.opt.lng), zoom: 4 });

      var drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

       //Remove markers if none or view with small red icons.
      var marker1 = null;
      if (scope.opt.edits[4] === false ) {
         marker1 = false;
      } else {
         marker1 = {icon:redIcon};
      }

       //Deactivate edit or set it to featuregroup to show edit and delete.
       var edit1 = null;
       if (scope.opt.edits[0] === scope.opt.edits[1] === scope.opt.edits[2] === scope.opt.edits[3] === scope.opt.edits[4] === false) {
         edit1 = false;
      } else {
         edit1 = { featureGroup: drawnItems, remove:true };
      }

      //Create a draw control
      var drawControl = new L.Control.Draw({
        draw: {
          position: 'topleft',
          polygon: scope.opt.edits[0],
          polyline: false, //scope.opt.edits[1],
          rectangle: scope.opt.edits[2],
          circle: false, //scope.opt.edits[3],
          marker: false //marker1
        },
        edit: edit1
      });

      map.addControl(drawControl);

      var inputLayer = L.geoJson().addTo(map);

      //When finishing the drawing catch event
      map.on('draw:created', function (e) {
        var type = e.layerType,
        layer = e.layer;

        var res = null;

        if (type === 'rectangle') {

           //Lat/lng needs to be reversed
           //last point is already reversed by Leaflet -thus lenght-1
           res = (layer.toGeoJSON()).geometry.coordinates;

           for (var i=0;i<(res[0].length-1);i++) {
               res[0][i] = res[0][i].reverse();
           }


           var rectangle1 = new L.Rectangle(res[0], {
                color: 'red',
                weight: 3
           });

           layer = rectangle1.addTo(map);

        }

        if (type === 'polygon') {
           //Get coord
           res = (layer.toGeoJSON()).geometry.coordinates;

           //Lat/lng needs to be reversed
           //last point is already reversed by Leaflet -thus lenght-1
           for (var i=0;i<(res[0].length-1);i++) {
               res[0][i] = res[0][i].reverse();
           }

           var polygon1 = new L.Polygon(res[0], {
                color: 'red',
                weight: 3
           });

           layer = polygon1.addTo(map);
        }

        //radius is not part of geoJSON - added as part  of properties
        var radius;
        if (type === 'circle') {
          //Get coord
          res = (layer.toGeoJSON()).geometry.coordinates;
          radius = e.layer._mRadius;

          layer = L.circle([res[1], res[0]],e.layer._mRadius,{
                color: 'red',
                weight: 3
          }).addTo(map);
        }

        var createLayer = drawnItems.addLayer(layer);


        //The id is the last property of createLayer._layers object
        //We need this id if object is edited
        var lastProp = (Object.keys(createLayer._layers).length)-1;
        var id = Object.keys(createLayer._layers)[lastProp];

        //convert coord to geoJson obj and add to Mapservice obj
        var coord = (layer.toGeoJSON()).geometry.coordinates;
        console.log("coord");
        console.log(coord);
  });

}
}
}

module.exports = mapdraw;
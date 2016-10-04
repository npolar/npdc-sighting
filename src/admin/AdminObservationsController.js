'use strict';
//Admin module

// Respond to search to get relevant entries
// First respond to squares drawn
// @ngInject
var AdminObservationsController = function($scope, $http, SPECIES, NpolarApiSecurity, Sighting, SightingDBSearch, npolarApiConfig, SightingExcelDBGet) {
//Input attributes

    //Do not show "loading.."
    $scope.dataLoading = false;
    $scope.edate1 = undefined;
    $scope.edate2 = undefined;
    var markers = [];
    var layerSquare;

    //using chronopic to show dates
  //  new Chronopic('input[type="datetime"]', { date: new Date(), format: "{YYYY}-{MM}-{DD}" });
  //  new Chronopic('input[type="date"][lang="en"]', { locale: 'en_US' });


    //pagination
    $scope.itemsByPage=10;
    var displayedCollection = [];

    //select -get species
    $scope.items = SPECIES;

    //Set base map, center
    //Loading leaflet
    var L = require('leaflet');
    L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';
    var map = L.map('mapid', {
      fullscreenControl: true,
      fullscreenControlOptions: {
      position: 'topleft'
      }}).setView([78.000, 16.000], 4);


    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(map);

    // Initialise the FeatureGroup to store editable layers
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);


    //Create a draw control
    var drawControl = new L.Control.Draw({
        draw: {
          position: 'topleft',
          polygon: false,
          polyline: false,
          rectangle: true,
          circle: false,
          marker: false
        },
        edit: { featureGroup: drawnItems, remove:true }
      });

      map.addControl(drawControl);


        //When finishing the drawing catch event
      map.on('draw:created', function (e) {
        //Wipe out all markes
        for(var i=0;i<markers.length;i++) {
          map.removeLayer(markers[i]);
        }

        var type = e.layerType,
        layer = e.layer;

        var res = null;

        if (type === 'rectangle') {

           //Lat/lng needs to be reversed
           //last point is already reversed by Leaflet -thus lenght-1
           res = (layer.toGeoJSON()).geometry.coordinates;

           for (i=0;i<(res[0].length-1);i++) {
               res[0][i] = res[0][i].reverse();
           }


           var rectangle1 = new L.Rectangle(res[0], {
                color: 'red',
                weight: 3
           });

           layerSquare = rectangle1.addTo(map);

        }

        var createLayer = drawnItems.addLayer(layerSquare);

        //The id is the last property of createLayer._layers object
        //We need this id if object is edited
       // var lastProp = (Object.keys(createLayer._layers).length)-1;
        //var id = Object.keys(createLayer._layers)[lastProp];

        //convert coord to geoJson obj and add to Mapservice obj
        var coord = (layer.toGeoJSON()).geometry.coordinates;
        $scope.lng1= parseFloat(coord[0][0][0]).toFixed(6);
        $scope.lat1= parseFloat(coord[0][0][1]).toFixed(6);
        $scope.lng2= parseFloat(coord[0][2][0]).toFixed(6);
        $scope.lat2= parseFloat(coord[0][2][1]).toFixed(6);
  });

  map.on('draw:edited', function (e) {

           var layers = e.layers;
           layers.eachLayer(function (layer) {
             //Update lng/lat from search
             var res = (layer.toGeoJSON()).geometry.coordinates;

                //Fetch zero and second coordinate pair to get a rectangle
                $scope.lng1= res[0][0][0];
                $scope.lat1= res[0][0][1];
                $scope.lng2= res[0][2][0];
                $scope.lat2= res[0][2][1];
               // console.log($scope);
           });
  });

  map.on('draw:deleted', function (e) {

         //Remove lat/lng from search inputs
         $scope.lat1= $scope.lng1= $scope.lat2 = $scope.lng2 = undefined;

         //Remove markers and squares
         markers = [];
  });

 // Execute this function when reset button is pressed
 $scope.reset = function() {
    //Wipe out all markes
    for(var i=0;i<markers.length;i++) {
      map.removeLayer(markers[i]);
    }
    //Remove any annotations as well
    if (map.hasLayer(layerSquare)) {
       map.removeLayer(layerSquare);
    }

    markers = [];

    //Remove previous table info
    $scope.displayedCollection = [];


    //Remove info from search input fields
    // $scope.lng1= $scope.lat1= $scope.lng2 = $scope.lat2 = null;


 };

 // Execute this function when search button is pressed
 $scope.submit = function() {

    //show loading..
    $scope.dataLoading = true;

    console.log($scope);

    // First find out which paramaters are not empty
    var sok = ''; var lat = ''; var lng = ''; var edate = '';

    // If event_date exists
    if (typeof $scope.edate1 !== "undefined" && $scope.edate1 !== "") {
           //Remember to transform into the correct format
           edate = '&filter-event_date=' + convertDate($scope.edate1) + '..';

           if (typeof $scope.edate2 !== "undefined" && $scope.edate2 !== "") {
               //Transform edate to correct format
               edate = edate + convertDate($scope.edate2);

           }
    //Else if lat2 exists
    } else if (typeof $scope.edate2 !== "undefined" && $scope.edate2 !== "") {
               //Transform edate to correct format
               edate = '&filter-event_date=..' + convertDate($scope.edate2);
    }


    // If lat1 exists
    if (typeof $scope.lat1 !== "undefined" && $scope.lat1 !== "") {
           lat = '&filter-latitude=' + $scope.lat1 + '..';


           if (typeof $scope.lat2 !== "undefined" && $scope.lat2 !== "") {
               lat = lat + $scope.lat2;
           }
    // Else if lat2 exists
    } else if (typeof $scope.lat2 !== "undefined" && $scope.lat2 !== "") {
               lat = '&filter-latitude=..' + $scope.lat2;
    }

    // If lng1 exists
    if (typeof $scope.lng1 !== "undefined" && $scope.lng1 !== "") {
           lng = '&filter-longitude=' + $scope.lng1 + '..';

           //If both exists
           if (typeof $scope.lng2 !== "undefined" && $scope.lng2 !== "") {
               lng = lng + $scope.lng2;
           }

    //Else if lng2 exists
    } else if (typeof $scope.lng2 !== "undefined" && $scope.lng2 !== "") {
               lng = '&filter-longitude=..' + $scope.lng2;

    }

    //Include species search if it exists
    if ((typeof $scope.species !== "undefined") && ($scope.species !== null) && ($scope.species !== '' )) {
           sok = sok + '&filter-species=' + ($scope.species.family).toLowerCase();
    }

    //Sum up the query
    if ($scope.search) {
       sok = $scope.search + sok;
       //Add + instead of space
       sok = sok.replace(/ /g,"+");
   // }else {
       sok = sok+lat+lng+edate;
    }


   //Prune search - transfer as little data as possible to save time
  // var fields = '&fields=id,event_date,species,excel_filename,"@placename",species,editor_assessment,total';



  // var res = encodeURI(sok+fields);
   var res = sok.replace(/ /g,"+");

   console.log(res);
   console.log("input---------------");

  // var res = "&filter-species=ursus+maritimus";

   var redIcon = L.Icon.extend({
          options: {
            iconUrl:  'admin/img/reddot.png',
            iconSize: [8, 8]
          }
    });


   var full = SightingDBSearch.get({search:res}, function(){



    var len = full.feed.entries.length;
    var total = len;
    $scope.total = len;

    //Remove any annotations now
    if (map.hasLayer(layerSquare)) {
       map.removeLayer(layerSquare);
    }
    markers = [];

    while (len--) {

      full.feed.entries[len].count = len;

      if (full.feed.entries[len].latitude && full.feed.entries[len].longitude){

       //Get id to create link on the map to edit an entry
       //Useful when whales are tagged with land GPS coord..
       var id = full.feed.entries[len].id;

       full.feed.entries[len].locality  = full.feed.entries[len]['@placename'];
       var lat = parseFloat(full.feed.entries[len].latitude);
       var lng = parseFloat(full.feed.entries[len].longitude);

       //Need to find the id to link back to excel file
      // if (full.feed.entries[len].excel_filename) {
       //   var res2 = encodeURI("&filter-filename=" + full.feed.entries[len].excel_filename+"&fields=url");
       //   console.log(res2);
       //   var excel_search = SightingExcelDBGet.get({search:res2}, function(){
       //       console.log(excel_search);
       //   });
       //};

      // var  redIcon2 = new redIcon();
       var mark = L.marker([lat,lng],{icon: new redIcon() }).addTo(map).bindPopup("<a href='http://localhost:3000/sighting/db/" + id + "/edit'>" + full.feed.entries[len].locality + "</a>").openPopup();

       //Add mark to markers
       markers.push(mark);
      }
     }

    //Reset for next search
    var markerGroup = L.layerGroup(markers);
    markerGroup.addTo(map);
    displayedCollection = [];

   // var entries = full.feed.entries;
    for(var j=0;j<full.feed.entries.length;j++) {
      displayedCollection.push(full.feed.entries[j]);
    }

    $scope.displayedCollection = displayedCollection;


    //Get hostname
    $scope.hostname = location.host;


    //Remove loading..
    $scope.dataLoading = false;

  });
}; //submit
};

/*Convert to the search date format */
function convertDate(idate) {
          //console.log(idate);
           var temp_date = idate.substring(0,4) + '-' + idate.substring(5,7) + '-' +idate.substring(8,10);
           temp_date += 'T00:00:00.000';
           //console.log(temp_date);
           return temp_date;
}




module.exports = AdminObservationsController;
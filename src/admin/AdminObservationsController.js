'use strict';
//Admin module

// Respond to search to get relevant entries
// First respond to squares drawn
// @ngInject
var AdminObservationsController = function(chronopicService, $scope, $http, SPECIES, NpolarApiSecurity, Sighting, SightingDBSearch, npolarApiConfig, SightingExcelDBGet, CSVService) {
//Input attributes

    //Do not show "loading.."
    $scope.dataLoading = false;

    var markers = [];
    var layerSquare;

    //Fetch previous search if existing
    $scope.entries = CSVService.entryObject;

    $scope.resource = Sighting;

    //Need to create an alternative base address to
    $scope.authorized = NpolarApiSecurity.isAuthorized('create', 'https:' + $scope.resource.path + '/admin');


    //Use authorized to limit access
    //$scope.authorized = NpolarApiSecurity.isAuthorized('create', admin_base + '/administrators');


    //using chronopic to show dates
   new Chronopic('input[type="datetime"]', {
    date: null,
    min: { year: 1995 },   //start year
    format: "{YYYY}-{MM}-{DD}",
    onChange: function(elem, date) {
      var scopeVar = elem.getAttribute("scopeVar");
      if(scopeVar) {
        $scope[scopeVar] = date.toISOString();
      }
    }
  });


  new Chronopic('input[type="date"][lang="en"]', {
    locale: 'en_US'
  });

   //Set chronopic view format (this does not change the internal value, i.e. ISO string date)
  chronopicService.defineOptions({ match(field) {
       return field.path.match(/_date$/);
  }, format: '{date}'});



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

   // map.invalidateSize();

   // map.getSize();

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}/', {
       maxZoom: 18,
      attribution: 'Esmapri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community'
    }).addTo(map);


  /*  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(map); */

    // Initialise the FeatureGroup to store editable layers
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);


    //Leaflet have problems with finding the map size
    //invalidateSize checks if the map container size has changed and updates map.
    //Since map resizing is done by css, need to delay the invalidateSize check.
    setTimeout(function(){ map.invalidateSize()}, 20);

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
        $scope.$apply();
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
                $scope.$apply();
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

    //Remove lat/lng from search inputs
    $scope.lat1= $scope.lng1= $scope.lat2 = $scope.lng2 = undefined;
    $scope.edate1 = $scope.edate2 = undefined;
    $scope.total = "0";

 };


 // Execute this function when search button is pressed
 $scope.submit = function() {

     console.log('scope', $scope);

     //Wipe out all previous markes
    for(var i=0;i<markers.length;i++) {
      map.removeLayer(markers[i]);
    }
     //Remove any annotations now
    if (map.hasLayer(layerSquare)) {
       map.removeLayer(layerSquare);
    }

    //show loading..
    $scope.dataLoading = true;

    // First find out which paramaters are not empty
    var sok = ''; var lat = ''; var lng = ''; var edate = ''; var species ='';

    // If event_date exists
    if (typeof $scope.edate1 !== "undefined" && $scope.edate1 !== "") {
           //Remember to transform into the correct format
           console.log($scope.edate1);
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
           species = '&filter-species=' + ($scope.species.family).toLowerCase();
           species = species.replace(/ /g,"+");
    }

    //Sum up the query
    if ($scope.search) {
       sok = ($scope.search);  //.replace(/ /g,"+");
       //Add + instead of space
    }

   //Prune search - transfer as little data as possible to save time
  // var fields = '&fields=id,event_date,species,excel_filename,"@placename",species,editor_assessment,total';
   var res = species+lat+lng+edate;

   var redIcon = L.Icon.extend({
          options: {
            iconUrl:  'admin/img/reddot.png',
            iconSize: [8, 8]
          }
    });


   var full = SightingDBSearch.get({search:res, search2:sok}, function(){


    var len = full.feed.entries.length;

    $scope.total = len;


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


      //Base address goes to API, need app address
      //For test server, need to remove the port 3000 from the link
      var base = (npolarApiConfig.base).replace(":3000","");
      base = base.replace("api.npolar.no","data.npolar.no");
      var edit_link = base + '/sighting/db/' + id + '/edit';
      var mark = L.marker([lat,lng],{icon: new redIcon() }).addTo(map).bindPopup("<a  href='" + edit_link + "' target='_blank'>" + full.feed.entries[len].locality + "</a>").openPopup();

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

    //Transfer info to CSV file via service
    console.log(full.feed.entries);
    CSVService.entryObject = full.feed.entries;

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
           temp_date += 'T12:00:00.000Z';
           //console.log(temp_date);
           return temp_date;
}




module.exports = AdminObservationsController;
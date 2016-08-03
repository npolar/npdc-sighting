'use strict';
//Admin module

// Respond to search to get relevant entries
// First respond to squares drawn
// @ngInject
var AdminObservationsController = function($scope, $http, leafletData, SPECIES, CSVService, NpolarApiSecurity, Sighting, SightingDBSearch, npolarApiConfig, IsAdmin) {

  //Do not show "loading.."
  $scope.dataLoading = false;


  //Fetch previous search if existing
  $scope.entries = CSVService.entryObject;
  //Remove empty entry from table
  if ($scope.entries.data === null) {
    $scope.entries = undefined;
  }

  $scope.edate1 = undefined;
  $scope.edate2 = undefined;


 var markers = [];

 //using chronopic to show dates
 new Chronopic('input[type="datetime"]', { date: new Date(), format: "{YYYY}-{MM}-{DD}" });
 new Chronopic('input[type="date"][lang="en"]', { locale: 'en_US' });

 //pagination
 $scope.itemsByPage=10;
 var displayedCollection = [];

 //Access to page or not?
 $scope.isAdmin = IsAdmin.entryObject.data;

 //select -get species
 $scope.items = SPECIES;
 // angular.extend($scope, {species:""});
    var drawnItems = new L.featureGroup();

    // Setting up the map
    angular.extend($scope, {
      center: {
                    lat: 78.000,
                    lng: 16.000,
                    zoom: 4
      },
      layers: {
        tileLayer: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileLayerOptions: { attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' },
        maxZoom: 14,
        minZoom: 2
      },
     controls: {
        draw: {
          position : 'topleft',
          polygon : false,
          polyline : false,
          rectangle : true,
          circle : false,
          marker: false
        },
        edit: {
        featureGroup: drawnItems
        },
        remove : false
        }
  });


  //Draw a rectangle on the map to get coordinates from
  $scope.test = leafletData.getMap().then(function(map) {

       drawnItems.addTo(map);

       map.on('draw:created', function (e) {
                 var layer = e.layer;
                drawnItems.addLayer(layer);
                var res = (layer.toGeoJSON()).geometry.coordinates;

                //fetch zero and second coordinate pair to get a rectangle
                $scope.lng1= res[0][0][0];
                $scope.lat1= res[0][0][1];
                $scope.lng2= res[0][2][0];
                $scope.lat2= res[0][2][1];


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
         $scope.markers = [];
        });


}); //leafletdata.getMap


  // Execute this function when advanced search button is pressed
 $scope.submit = function() {

    //show loading..
    $scope.dataLoading = true;

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
            //Add + instead of space
           sok = sok.replace(/ /g,"+");
    }

    //Sum up the query
    if ($scope.search) {
       sok = $scope.search;
       //Add + instead of space
       sok = sok.replace(/ /g,"+");
    }else {
       sok = sok+lat+lng+edate;
    }

   // console.log(sok);
   // console.log("cccccc");

   //Prune search - transfer as little data as possible to save time
   var fields = '&fields=id,event_date,latitude,longitude,locality,location_comment,species,adult_m,adult_f,adult,subadult,polar_bear_condition,\
cub_calf_pup,bear_cubs,unidentified,total,habitat,occurrence_remark,excelfile.filename,expedition.name,expedition.contact_info,\
expedition.organisation,expedition.platform,expedition.platform_comment,expedition.start_date,expedition.end_date';

   var full = SightingDBSearch.get({search:sok+fields}, function(){

    var redIcon = {
    iconUrl: 'img/icons/reddot.png',
    iconSize:     [8, 8] // size of the icon
    };

    var len = full.feed.entries.length;
    $scope.total = len;

    // Fetch the lat/lon entries. Have to switch lat/lon for display
    while (len--) {

      full.feed.entries[len].count = len;

      if (full.feed.entries[len].latitude && full.feed.entries[len].longitude){

       //Get id to create link on the map to edit an entry
       //Useful when whales are tagged with land GPS coord..
       var id = full.feed.entries[len].id;

       markers.push({
                lng: parseFloat(full.feed.entries[len].longitude),
                lat: parseFloat(full.feed.entries[len].latitude),
                focus: true,
                draggable: false,
                message: "<a href='http://localhost:3000/sighting/observations/" + id + "/edit'>" + full.feed.entries[len].locality + "</a>",
                icon: redIcon
       });
     }
    }

    //Display markers on map
    $scope.markers = markers;

    //Reset for next search
    markers = [];


    //Pagination
    displayedCollection.push(full.feed.entries);
    $scope.displayedCollection = displayedCollection;
    $scope.entries = full.feed.entries;


    //Transfer info to CSV file via service
    CSVService.entryObject = full.feed.entries;

    //Get hostname
    $scope.hostname = location.host;

    //Remove loading..
    $scope.dataLoading = false;

  });
}; //submit



};  //AdminObservationsCtrl

/*Convert to the search date format */
function convertDate(idate) {
          //console.log(idate);
           var temp_date = idate.substring(0,4) + '-' + idate.substring(5,7) + '-' +idate.substring(8,10);
           temp_date += 'T00:00:00.000';
           //console.log(temp_date);
           return temp_date;
}


  module.exports = AdminObservationsController;
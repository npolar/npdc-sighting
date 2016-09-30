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
    new Chronopic('input[type="datetime"]', { date: new Date(), format: "{YYYY}-{MM}-{DD}" });
    new Chronopic('input[type="date"][lang="en"]', { locale: 'en_US' });


    //pagination
    $scope.itemsByPage=10;
    var displayedCollection = [];

    //select -get species
    $scope.items = SPECIES;

   var inputParams = {
    lat: 78.000,
    lng: 16.000,
    zoom: 4,
    cssmark:'mapid',
    marker:'redIcon', //"redIcon","default"
    editable: 'y', //yes means editable
    edit :[
        "rectangle",
    ],
    geoJson: []
}

var ret = leafletMap.createmap(inputParams);


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

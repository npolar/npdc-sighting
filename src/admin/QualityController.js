'use strict';

// @ngInject
//var QualityController = function($scope, $http, Sighting, npolarApiConfig, SightingDBSearch, IsAdmin) {
var QualityController = function($scope, $http, Sighting, npolarApiConfig, SightingDBSearch) {
  //pagination
  $scope.itemsByPage=15;
  var displayedCollection = [];


  //editor_assessment=unknown means new entries
  $scope.full = SightingDBSearch.get({search:"&filter-editor_assessment=not+assigned|yellow|red"}, function(){

     //For pagination - a copy is needed for display aka displayedCollection
     displayedCollection.push($scope.full.feed.entries);
     console.log(displayedCollection);

   });

  //Admin logon?
  //$scope.isAdmin = IsAdmin.entryObject.data;

};

module.exports = QualityController;

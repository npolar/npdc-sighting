'use strict';

// @ngInject
//var QualityController = function($scope, $http, Sighting, npolarApiConfig, SightingDBSearch, IsAdmin) {
var QualityController = function($scope, $http, Sighting, npolarApiConfig, SightingDBSearch, NpolarApiSecurity) {
  //pagination
  $scope.itemsByPage=15;
  var displayedCollection = [];

  // $scope.security = NpolarApiSecurity;
    $scope.resource = Sighting;
    $scope.security = NpolarApiSecurity;

    $scope.isAdmin = function(){
      const base = NpolarApiSecurity.canonicalUri('/sighting/admin');
      var ret = $scope.security.isAuthorized('create', base);
      return (ret);
    };


  //editor_assessment=unknown means new entries
  $scope.full = SightingDBSearch.get({search:"&filter-editor_assessment=unknown|yellow|red"}, function(){

     //For pagination - a copy is needed for display aka displayedCollection
     displayedCollection.push($scope.full.feed.entries);

   });

  //Admin logon?
  //$scope.isAdmin = IsAdmin.entryObject.data;

};

module.exports = QualityController;

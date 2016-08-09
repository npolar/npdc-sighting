'use strict';
//Admin module

// Respond to search to get relevant entries
// First respond to squares drawn
// @ngInject
var AdminObservationsController = function($scope, $http, SPECIES, NpolarApiSecurity, Sighting, SightingDBSearch, npolarApiConfig) {
//var AdminObservationsController = function($scope, $http, leafletData, SPECIES, NpolarApiSecurity, Sighting, SightingDBSearch, npolarApiConfig) {
//Input attributes

//Set base map, center
  var opt = {};
  opt.edits = [true, true, true, true, true];
  opt.lng = 16.000;
  opt.lat = 78.000;
  opt.attribute = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
  opt.url = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';

  $scope.opt = opt;

  console.log($scope.opt);
  console.log("AdminObservationsController");
};


  module.exports = AdminObservationsController;
'use strict';

var router = function($routeProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/', {
    templateUrl: 'info/learn.html',
    controller: 'SightingController'
  }).when('/db/:id', {
    templateUrl: 'sighting-db/show/show-sighting.html',
    controller: 'SightingShowController'
  }).when('/db/:id/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'SightingEditController'
  }).when('/observe', {
    templateUrl: 'info/observe.html',
    controller: 'SightingController'
  }).when('/admin', {
     templateUrl: 'admin/all.html',
     controller: 'AdminObservationsController'
  }).when('/upload', {
     templateUrl: 'admin/upload.html',
     controller: 'UploadObservationsController'
  }).when('/quality_check', {
     templateUrl: 'admin/quality_check.html',
     controller: 'QualityController'
  }).when('/sighting/admin', {
     templateUrl: './all.html',
     controller: 'SightingController'
  }).when('/db', {
    templateUrl: 'sighting-db/search/search.html',
    controller: 'SightingSearchController',
    reloadOnSearch: false
  });
};

module.exports = router;

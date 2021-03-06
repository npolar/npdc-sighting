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
   }).when('/db/_new/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'SightingEditController'
  }).when('/db/:id/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'SightingEditController'
  }).when('/observe', {
    templateUrl: 'info/observe.html',
    controller: 'SightingController'
  }).when('/observe_no', {
    templateUrl: 'info/observe_no.html',
    controller: 'SightingController'
  }).when('/administrators', {
     templateUrl: 'admin/all.html',
     controller: 'AdminObservationsController'
  }).when('/upload', {
     templateUrl: 'admin/upload.html',
     controller: 'UploadObservationsController'
  }).when('/csv', {
     templateUrl: 'admin/csv.html',
     controller: 'CSVController'
  }).when('/quality_check', {
     templateUrl: 'admin/quality_check.html',
     controller: 'QualityController'
  }).when('/db', {
    templateUrl: 'sighting-db/search/search.html',
    controller: 'SightingSearchController',
    reloadOnSearch: false
  }).when('/:id', {
    templateUrl: 'sighting-db/show/show-sighting.html',
    controller: 'SightingShowController'
  });
};

module.exports = router;

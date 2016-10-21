'use strict';
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');

var leaflet = require('../node_modules/leaflet');
var leaflet_draw = require('../node_modules/leaflet-draw/dist/leaflet.draw');
var leaflet_fullscreen = require('../node_modules/leaflet-fullscreen/dist/Leaflet.fullscreen');


var npdcSightingApp = angular.module('npdcSightingApp', ['npdcCommon']);

npdcSightingApp.controller('SightingShowController', require('./sighting-db/show/SightingShowController'));
npdcSightingApp.controller('SightingSearchController', require('./sighting-db/search/SightingSearchController'));
npdcSightingApp.controller('SightingEditController', require('./sighting-db/edit/SightingEditController'));
npdcSightingApp.controller('SightingController', require('./info/SightingController'));
npdcSightingApp.controller('AdminObservationsController', require('./admin/AdminObservationsController'));
npdcSightingApp.controller('QualityController', require('./admin/QualityController'));
npdcSightingApp.controller('UploadObservationsController', require('./admin/UploadObservationsController'));
npdcSightingApp.controller('CSVController', require('./admin/CSVController'));
npdcSightingApp.directive('sightingCoverage', require('./sighting-db/edit/coverage/coverageDirective'));
npdcSightingApp.factory('Sighting', require('./Sighting'));
npdcSightingApp.constant('SPECIES', require('./info/SpeciesGallery'));
npdcSightingApp.service('SightingDBSearch', require('./admin/SightingDBSearch'));
npdcSightingApp.service('SightingDBGet', require('./admin/SightingDBGet'));
npdcSightingApp.service('SightingExcelDBGet', require('./admin/SightingExcelDBGet'));
npdcSightingApp.service('CSVService', require('./admin/CSVService'));


// Bootstrap ngResource models using NpolarApiResource
var resources = [
  {'path': '/', 'resource': 'NpolarApi'},
  {'path': '/user', 'resource': 'User'},
 // {'path': '/sighting', 'resource': 'Sighting'},
  {'path': '/sighting', 'resource': 'SightingResource', 'uiBase': '/sighting/db'},
  {'path': '/expedition', 'resource': 'Expedition'},
  {'path': '/sighting-excel', 'resource': 'SightingExcel'}

];

resources.forEach(service => {
  // Expressive DI syntax is needed here
  npdcSightingApp.factory(service.resource, ['NpolarApiResource', function (NpolarApiResource) {
  return NpolarApiResource.resource(service);
  }]);
});



// Routing
npdcSightingApp.config(require('./routes'));

//npdcSightingApp.config(($httpProvider, npolarApiConfig) => {
npdcSightingApp.config(($httpProvider) => {
  //var autoconfig = new AutoConfig("production");
  //angular.extend(npolarApiConfig, autoconfig, { resources });
  //console.debug("npolarApiConfig", npolarApiConfig);

  $httpProvider.interceptors.push('npolarApiInterceptor');
});

npdcSightingApp.run(($http, npolarApiConfig, npdcAppConfig, NpolarTranslate, NpolarLang) => {
  //var environment = "production";

  var environment = "test";
  var autoconfig = new AutoConfig(environment);
 // console.log("npdcAppConfig", npdcAppConfig);

  Object.assign(npolarApiConfig, autoconfig, { resources, formula : { template : 'default' } });
 // console.log("npolarApiConfig", npolarApiConfig);

  NpolarTranslate.loadBundles('npdc-sighting');
  npdcAppConfig.toolbarTitle = 'Marine Mammal Sighting';
});

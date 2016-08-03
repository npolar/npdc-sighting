'use strict';
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');
require('npdc-common/src/wrappers/leaflet');

var npdcSightingApp = angular.module('npdcSightingApp', ['npdcCommon','leaflet']);

npdcSightingApp.controller('SightingShowController', require('./sighting-db/show/SightingShowController'));
npdcSightingApp.controller('SightingSearchController', require('./sighting-db/search/SightingSearchController'));
npdcSightingApp.controller('SightingEditController', require('./sighting-db/edit/SightingEditController'));
npdcSightingApp.controller('SightingController', require('./info/SightingController'));
npdcSightingApp.directive('sightingCoverage', require('./sighting-db/edit/coverage/coverageDirective'));
npdcSightingApp.factory('Sighting', require('./sighting-db/edit/Sighting'));
npdcSightingApp.constant('SPECIES', require('./info/SpeciesGallery'));


// Bootstrap ngResource models using NpolarApiResource
var resources = [
  {'path': '/', 'resource': 'NpolarApi'},
  {'path': '/user', 'resource': 'User'},
  {'path': '/sighting', 'resource': 'Sighting'},
  {'path': '/expedition', 'resource': 'Expedition'}
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
   var environment = "production";
  var autoconfig = new AutoConfig(environment);

  Object.assign(npolarApiConfig, autoconfig, { resources, formula : { template : 'default' } });
  console.log("npolarApiConfig", npolarApiConfig);

  NpolarTranslate.loadBundles('npdc-sighting');
  npdcAppConfig.toolbarTitle = 'Marine Mammal Sighting';
});

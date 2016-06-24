'use strict';
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');
require('npdc-common/src/wrappers/leaflet');

var npdcSightingApp = angular.module('npdcSightingApp', ['npdcCommon','leaflet']);

npdcSightingApp.controller('SightingShowController', require('./show/SightingShowController'));
npdcSightingApp.controller('SightingSearchController', require('./search/SightingSearchController'));
npdcSightingApp.controller('SightingEditController', require('./edit/SightingEditController'));
npdcSightingApp.directive('sightingCoverage', require('./edit/coverage/coverageDirective'));


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
npdcSightingApp.config(require('./router'));

npdcSightingApp.config(($httpProvider, npolarApiConfig) => {
  var autoconfig = new AutoConfig("test");
  angular.extend(npolarApiConfig, autoconfig, { resources });
  console.debug("npolarApiConfig", npolarApiConfig);

  $httpProvider.interceptors.push('npolarApiInterceptor');
});

npdcSightingApp.run(($http, npdcAppConfig, NpolarTranslate, NpolarLang) => {
  NpolarTranslate.loadBundles('npdc-sighting');
  npdcAppConfig.toolbarTitle = 'Marine Mammal Sighting';
});

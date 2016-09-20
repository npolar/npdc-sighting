'use strict';
/*service */

// @ngInject
var SightingExcelDBGet = function($resource,  npolarApiConfig){
	return $resource( 'https:' + npolarApiConfig.base + '/sighting-excel/?q=:search&format=json&locales=utf-8&limit=5000' , { search:'@search'}, {
    query: {method: 'GET'}
    });
};

module.exports = SightingExcelDBGet;
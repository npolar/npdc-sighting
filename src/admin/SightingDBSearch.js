'use strict';
//service

// @ngInject

var SightingDBSearch = function($resource,  npolarApiConfig){
	return $resource( 'https:' + npolarApiConfig.base + '/sighting/?q=:search&sort=-event_date&format=json&locales=utf-8&limit=5000' , { search:'@search'}, {
    query: {method: 'GET'}
    });
};

module.exports = SightingDBSearch;
'use strict';
//service

// @ngInject

var SightingDBSearch = function($resource,  npolarApiConfig){
	//return $resource( 'https:' + npolarApiConfig.base + '/sighting/?q=:search&sort=-event_date&format=json&locales=utf-8&limit=5000' , { search:'@search'}, {
    return $resource( 'https:' + npolarApiConfig.base + '/sighting/?q=&limit=5000&locales=utf-8:search' , { search:'@search'}, {
    query: {method: 'GET'}
    });
};

module.exports = SightingDBSearch;
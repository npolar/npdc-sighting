'use strict';
//service

// @ngInject

var SightingDBSearch = function($resource,  npolarApiConfig){
    return $resource( 'https:' + npolarApiConfig.base + '/sighting/?q=:search2&limit=all&locales=utf-8:search' , { search:'@search', search2:'@search2'}, {
    query: {method: 'GET'}
    });
};

module.exports = SightingDBSearch;
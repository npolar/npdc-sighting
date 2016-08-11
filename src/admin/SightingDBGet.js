'use strict';
/*service */

// @ngInject
var SightingDBGet = function($resource,  npolarApiConfig){
	return $resource( 'https:' + npolarApiConfig.base + '/sighting/:id' , { id:'@id'}, {
    	query: {method: 'GET'}
    });
};

module.exports = SightingDBGet;
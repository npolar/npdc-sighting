'use strict';

let Resource = function($document, $resource, $cacheFactory, $window, npolarApiConfig) {
  'ngInject';
  // ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash']
  const PARSE_URL = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
  let base = $document[0].getElementsByTagName('base')[0];
  let appBase = base ? PARSE_URL.exec(base.href)[5].replace(/^\//, '').replace(/\/$/, '') : '';
  // Path to resource, relative to /base/ defined in index.html
  let href = function (id) {
    let hrefBase = this.uiBase.replace(appBase, '').replace(/^\/+/, '');
    return (hrefBase ? hrefBase + '/': '') + id;
  };

  let editHref = function(id) {
    return this.href(id) + '/edit';
  };

  let newHref = function() {
    return this.editHref('__new');
  };

  let _base = function(service) {
    // @todo canonicalUri?
    return (typeof service.base === "string") ? service.base : npolarApiConfig.base;
  };

  // Generate random UUID, from http://stackoverflow.com/a/8809472
  // jshint -W016, -W116
  this.randomUUID = function () {
    var d = new Date().getTime();
    if($window.performance && typeof $window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c == 'x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  };


  // NpolarApiResource factory
  // @param service e.g. { path: '/dataset', 'resource': 'Dataset'}
  // @return NpolarApiResource - extended ngResource
  // @todo service.get == null|GET|JSONP
  // @todo make extending ngResource optional
  // @todo Support user-supplied extending
  // @todo Support non-search engine query/array/fetch
  this.resource = function(service) {

    let base = _base(service);
    let cache = service.cache;

    // Default parameters
    let params = {
      id: null,
      limit: 100,
      format: 'json',
      q: '',
      variant: 'atom'
    };

    //let fields_feed = (angular.isString(service.fields)) ? service.fields : null ;
    let fields_query = (typeof service.fields === 'string') ? service.fields : 'id,title,name,code,titles,links,created,updated';

    //let params_feed = angular.extend({}, params, { fields: fields_feed });
    let params_query = Object.assign({}, params, {
      variant: 'array',
      limit: 1000,
      fields: fields_query
    });

    const TIMEOUT = 20000;

    let resource = $resource(base + service.path + '/:id', {}, {
      feed: {
        method: 'GET',
        params: params,
        headers: {
          Accept: 'application/json, application/vnd.geo+json'
        },
        cache,
        timeout: TIMEOUT
      },
      query: {
        method: 'GET',
        params: params_query,
        isArray: true,
        cache,
        timeout: TIMEOUT
      },
      array: {
        method: 'GET',
        params: params_query,
        isArray: true,
        cache,
        timeout: TIMEOUT
      },
      facets: {
        method: 'GET',
        params: Object.assign({}, params, { limit: 0 }),
        isArray: true,
        cache,
        timeout: TIMEOUT,
        transformResponse(data) {
          if (!data) {
            return [];
          }
          return JSON.parse(data).feed.facets.map(facet => {
            let key = Object.keys(facet)[0];
            return {
              facet: key,
              terms: facet[key]
            };
          });
        }
      },
      fetch: {
        method: 'GET',
        params: {},
        headers: {
          Accept: 'application/json'
        },
        cache,
        timeout: TIMEOUT
      },
      remove: {
        cache,
        method: 'DELETE',
        timeout: TIMEOUT
      },
      delete: {
        cache,
        method: 'DELETE',
        timeout: TIMEOUT
      },
      update: {
        cache,
        method: 'PUT',
        params: {
          id: '@id'
        },
        headers: {
          Accept: 'application/json'
        },
        timeout: TIMEOUT
      }
    });

    resource.uiBase = service.uiBase || service.path;
    resource.path = base + service.path;
    resource.href = href;
    resource.newHref = newHref;
    resource.editHref = editHref;
    resource.randomUUID = this.randomUUID;

    return resource;

  };
};

module.exports = Resource;

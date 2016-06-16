'use strict';

let angular = require('angular');

/**
 * NpolarApiSecurity provides JWT Bearer HTTP Authorization header for Npolar API request,
 * see npolarApiInterceptor
 *
 * Also contains method to check decoded JWT objects from [Gouncer](https://github.com/npolar/gouncer) JWT
 *
 */
var Security = function($location, $log, base64, jwtHelper, npolarApiConfig, NpolarApiUser, NpolarMessage) {
  'ngInject';
  // Gouncer location
  // secure uri

  //const authenticateUri = 'https://'+ npolarApiConfig.base.split("//")[1] +'/user/authenticate';

  // Gouncer system actions
  const actions = ['create', 'read', 'update', 'delete'];

  // @return Authorization header string (either Bearer/JWT or Basic)
  this.authorization = function() {

    let user = NpolarApiUser.getUser();

    if ('basic' === npolarApiConfig.security.authorization) {
      return 'Basic ' + this.basicToken(user);
    } else if ('jwt' === npolarApiConfig.security.authorization) {
      return 'Bearer ' + user.jwt;
    } else {
      console.error('NpolarApiSecurity authorization not implemented: ' + npolarApiConfig.security.authorization);
      return '';
    }
  };

  // @return HTTP Basic Authorization header string
  this.basicToken = function(username, password) {
    return base64.encode(username + ':' + password);
  };

  // Normalize shortened URI to absolute URI
  this.canonicalUri = function(uri, scheme = 'https') {
    let canonical;

    if (uri === undefined || uri === null) {
      return false;
      //throw new Error(`Bad URI: ${uri}`);
    }

    if (new RegExp(`^${scheme}:\/\/`).test(uri)) {
      canonical = uri;

    } else if ((/^\/\//).test(uri)) {
      canonical = scheme + ':' + uri;

    } else if ((/^\/[^/]/).test(uri)) {
      //throw new Error(`Relative URI: ${uri}`);
      canonical = scheme + '://' + npolarApiConfig.base.split("//")[1] + uri;

    } else if ((/^https?:\/\//).test(uri)) {
      canonical = uri.replace(/^https?/, scheme);

    } else {
      throw new Error(`Could not canonicalize URI: ${uri}`);
    }
    return canonical;
  };

  // @return Object
  this.decodeJwt = function(jwt) {
    return jwtHelper.decodeToken(jwt);
  };

  // @return current user or empty user object
  this.getUser = function() {
    return NpolarApiUser.getUser();
  };

  // @return JWT string
  this.getJwt = function() {
    return this.getUser().jwt;
  };

  // Return all systems matching current URI (or *)
  this.systems = function(uri) {

    let systems = this.getUser().systems;

    if (uri === undefined) {
      return systems;
    }
    uri = this.canonicalUri(uri);

    return this.getUser().systems.filter(
      system => {

        if (system.uri === uri) {
          return true;
        } else if (system.uri === this.canonicalUri(npolarApiConfig.base + "/*")) {
          return true;
        } else {
          return false;
        }
      }
    );
  };

  // Check if the user has (any kind) of rights on system (uri)
  // @return true | false
  this.hasSystem = function(uri) {
    return (this.systems(uri).length > 0);
  };

  // @return true | false
  this.isAuthenticated = function() {
    return this.isJwtValid();
  };

  // Is current user authorized to perform action on the provided uri?
  // Checks if the user is authorized *at the current time* - ie. always returns false if not authenticated
  // @param action ["create" | "read" | "update" | "delete"] => actions
  this.isAuthorized = function(action, uri, user=this.getUser()) {
    if (!uri) {
      return false; // Called without uri to check against, just say no.
    }
    uri = this.canonicalUri(uri);

    if (false === actions.includes(action)) {
      $log.error(`isAuthorized(${action}, ${uri}) called with invalid action`);
      return false;
    }

    // @todo support just ngResource or NpolarApiResurce => get path from that
    // @todo fallback to relative application path


    // First, verify login
    if (false === this.isAuthenticated()) {
      return false;
    }
    // Then check permissions
    return this.isPermitted(action, uri, user);
  };

  // @return true | false
  this.isJwtExpired = function() {
    let jwt = this.getJwt();

    if (jwt === undefined || jwt === null || !angular.isString(jwt)) {
      return true;
    }

    try {
      return ((Date.now() / 1000) > this.decodeJwt(jwt).exp);
    } catch (e) {
      return true;
    }
  };
  
  // Check if user is permitted to perform action on uri
  this.getSystem = function(action, uri, user=this.getUser()) {

    uri = this.canonicalUri(uri);
    if (false === uri) {
      return false;
    }
    
    // Get all systems for uri and check if at least one gives right to perform action
    let systems = this.systems(uri).filter(
      system => {
        return system.rights.includes(action);
      }
    );
    
    // If we have at least 1 system, it does not matter which is returned
    // (More than 1 is probably caused by *)
    if (systems.length > 0) {
      return systems[0];
    } else {
      return false;
    }
    
  };
  
  // Check if user is permitted to perform action on uri
  // => ie. if we are left with at least 1 system
  this.isPermitted = function(action, uri, user=this.getUser()) {
    let system = this.getSystem(action, uri, user);
    if (false === system) {
      return false;
    } else {
      return true;
    }
  };

  // @return true | false
  this.isJwtValid = function() {
    return (false === this.isJwtExpired());
  };

  // @return true | false
  this.notAuthenticated = () => {
    return !this.isAuthenticated();
  };

  // Delete user in local storage
  this.removeUser = function() {
    return NpolarApiUser.removeUser();
  };

  // Store user in local storage
  this.setUser = function(user) {
    return NpolarApiUser.setUser(user);
  };

  this.setJwt = function(jwt) {

    var token = this.decodeJwt(jwt);
    var expires = new Date(1000 * token.exp).toISOString();

    let user = {
      name: token.name || token.email,
      email: token.email,
      jwt,
      uri: token.uri || '',
      expires: expires,
      systems: token.systems || []
    };

    this.setUser(user);

    $log.debug('New JWT expires: ', expires, jwt);
  };

  this.logout = function(reason) {
    var who = this.getUser();
    who.reason = reason;
    NpolarMessage.logout(who);

    this.removeUser();
    $location.path('/');
  };


};

module.exports = Security;

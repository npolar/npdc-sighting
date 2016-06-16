'use strict';

let Resource = require('./Resource');
require('should');

describe("Resource", () => {
  let appBase = "";
  let $resourceMock = function () {
    return {};
  };
  let $documentMock = [{
    getElementsByTagName() {
      return [{
        href: appBase
      }];
    }
  }];

  let npolarApiConfig = require('../config');

  describe("#href", () => {

    it('should handle /app/', () => {
      appBase = 'https://data.npolar.no/dataset/';
      let testResourceFactory = new Resource($documentMock, $resourceMock, null, null, npolarApiConfig);
      let testResource = testResourceFactory.resource({ path: '/dataset' });
      let id = 'myID';
      let expected = id;
      testResource.href(id).should.eql(expected);
    });

    it('should handle /app', () => {
      appBase = 'https://data.npolar.no/dataset';
      let testResourceFactory = new Resource($documentMock, $resourceMock, null, null, npolarApiConfig);
      let testResource = testResourceFactory.resource({ path: '/dataset' });
      let id = 'myID';
      let expected = id;
      testResource.href(id).should.eql(expected);
    });

    it('should handle /group/app/', () => {
      appBase = 'https://data.npolar.no/map/';
      let testResourceFactory = new Resource($documentMock, $resourceMock, null, null, npolarApiConfig);
      let testResource = testResourceFactory.resource({ path: '/map/archive' });
      let id = 'myID';
      let expected = 'archive/'+id;
      testResource.href(id).should.eql(expected);
    });

    it('should handle /group/app2/', () => {
      appBase = 'https://data.npolar.no/map/';
      let testResourceFactory = new Resource($documentMock, $resourceMock, null, null, npolarApiConfig);
      let testResource = testResourceFactory.resource({ path: '/map/app2' });
      let id = 'myID';
      let expected = 'app2/'+id;
      testResource.href(id).should.eql(expected);
    });
  });
});

'use strict';

var SightingEditController = function($scope, $controller, $routeParams, Sighting, $http, $timeout, formula,
  formulaAutoCompleteService, npdcAppConfig, chronopicService, fileFunnelService, NpolarLang, npolarApiConfig,
  NpolarApiSecurity, npolarCountryService, NpolarMessage) {
  'ngInject';


  function init() {


  // EditController -> NpolarEditController
  $controller('NpolarEditController', {
    $scope: $scope
  });



  // Sighting -> npolarApiResource -> ngResource
  $scope.resource = Sighting;

    let formulaOptions = {
      schema: '//api.npolar.no/schema/sighting',
      form: 'sighting-db/edit/formula.json',
      language: NpolarLang.getLang(),
      templates: npdcAppConfig.formula.templates.concat([{
        match(field) {
          if (field.id === 'links_item') {
            let match;

          // Hide data links and system links for the ordinary links block (defined in formula as instance === 'links')
            match = ["data", "alternate", "edit", "via"].includes(field.value.rel) && field.parents[field.parents.length-1].instance === 'links';
          //  console.log(match, field.id, field.path, 'value', field.value, 'instance', field.parents[field.parents.length-1].instance);
            return match;
          }
        },
        hidden: true
      },
    {
        match: "placenames_item",
        template: '<npdc:formula-placename></npdc:formula-placename>'
      }
    ]),
      languages: npdcAppConfig.formula.languages.concat([{
        map: require('./en.json'),
        code: 'en'
      }, {
        map: require('./no.json'),
        code: 'nb_NO'
      }])
  };


 // console.log(npdcAppConfig.formula.languages, formulaOptions);


  $scope.formula = formula.getInstance(formulaOptions);
  initFileUpload($scope.formula);

/*
   formulaAutoCompleteService.autocomplete({
    match: "@placename",
    querySource: npolarApiConfig.base + '/placename',
    label: 'title',
    value: 'ident'
}, $scope.formula);
*/


 //formulaAutoCompleteService.autocompleteFacets(['organisation'], Sighting, $scope.formula);

  //chronopicService.defineOptions({ match: 'released', format: '{date}'});
  // chronopicService.defineOptions({ match(field) {
  //  return field.path.match(/^#\/activity\/\d+\/.+/);
  //}, format: '{date}'});
//}

//Set chronopic view format (this does not change the internal value, i.e. ISO string date)
 chronopicService.defineOptions({ match(field) {
    return field.path.match(/_date$/);
 }, format: '{date}'});
}


 function initFileUpload(formula) {

    let server = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/:id/_file`;

    fileFunnelService.fileUploader({
      match(field) {
        return field.id === "files";
      },
      server,
      multiple: true,
       restricted: function () {
        return formula.getModel().restricted;
      },
   //   restricted: function () {
   //     return !formula.getModel().license;
   //   },
      fileToValueMapper: Sighting.fileObject,
      valueToFileMapper: Sighting.hashiObject,
      fields: [] // 'type', 'hash'
    }, formula);
  }

  try {
    init();
    // edit (or new) action
    $scope.edit();
  } catch (e) {
    NpolarMessage.error(e);
}
};

module.exports = SightingEditController;

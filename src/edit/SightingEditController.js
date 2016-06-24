'use strict';

var SightingEditController = function($scope, $controller, $routeParams, Sighting, formula,
  formulaAutoCompleteService, npdcAppConfig, chronopicService, fileFunnelService, NpolarLang, npolarApiConfig,
  NpolarApiSecurity, npolarCountryService, NpolarMessage) {
  'ngInject';

  // EditController -> NpolarEditController
  $controller('NpolarEditController', {
    $scope: $scope
  });

  // StationBooking -> npolarApiResource -> ngResource
  $scope.resource = Sighting;


   let templates = [
    {
      match: "locations_item",
      template: "<inventory:coverage></inventory:coverage>"
    }
];

  let i18n = [{
      map: require('./en.json'),
      code: 'en'
    },
    {
      map: require('./no.json'),
      code: 'nb_NO',
    }];

  $scope.formula = formula.getInstance({
    schema: '//api.npolar.no/schema/sighting',
    form: 'edit/formula.json',
    language: NpolarLang.getLang(),
    templates: npdcAppConfig.formula.templates.concat(templates),
    languages: npdcAppConfig.formula.languages.concat(i18n)
   });

   formulaAutoCompleteService.autocomplete({
    match: "@placename",
    querySource: npolarApiConfig.base + '/placename',
    label: 'title',
    value: 'ident'
}, $scope.formula);

  let autocompleteFacets = ["organisation"];
  formulaAutoCompleteService.autocompleteFacets(autocompleteFacets, Sighting, $scope.formula);


  chronopicService.defineOptions({ match: 'released', format: '{date}'});
  chronopicService.defineOptions({ match(field) {
    return field.path.match(/^#\/activity\/\d+\/.+/);
  }, format: '{date}'});

   $scope.edit();
};

module.exports = SightingEditController;

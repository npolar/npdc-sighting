'use strict';

function Sighting(SightingResource, NpolarApiSecurity) {
  'ngInject';

  const schema = 'http://api.npolar.no/schema/sighting';

  return Object.assign(SightingResource, {

    schema,

  create: function() {

      let user = NpolarApiSecurity.getUser();
      let collection = "sighting";
      let base = "http://api.npolar.no";
      let language = "en";
      let draft = "yes";
      let rights_holder = "Norwegian Polar Institute";
      let basis_of_record = "HumanObservation";
      let kingdom = "animalia";
      let recorded_by = user.email;
      let recorded_by_name = user.name;
      let editor_assessment = "unknown";

      let p = { collection, base, language, draft, rights_holder, basis_of_record, kingdom, recorded_by, recorded_by_name };
      console.debug(p);
      return p;

    },

  hashiObject: function(file) {
       console.debug('hashiObject', file);
      return {
        url: file.uri,
        filename: file.filename,
        // icon
        length: file.file_size,
        md5sum: (file.hash||'md5:').split('md5:')[1],
        content_type: file.type
      };
    },

  fileObject: function(hashi) {
      console.debug('fileObject', hashi);
      return {
        uri: hashi.url,
        filename: hashi.filename,
        length: hashi.file_size,
        hash: 'md5:'+hashi.md5sum,
        type: hashi.content_type
      };
    }

  });

}

module.exports = Sighting;
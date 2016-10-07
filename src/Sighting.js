'use strict';

function Sighting($q, SightingResource) {
  'ngInject';

  const schema = 'http://api.npolar.no/schema/sighting';

  return Object.assign(SightingResource, { schema,

    create: function() {

      let collection = "sighting";
      let base = "http://api.npolar.no";
      let rights = "NPI's own license";
      let rights_holder = "Norwegian Polar Institute";
      let basis_of_record = "HumanObservation";
      let kingdom = "animalia";

      let p = { schema, collection, base, rights, rights_holder, basis_of_record, kingdom };
      console.debug(p);

      return p;

    },

     hashiObject: function(file) {
      console.log("hashi");
      return {
        url: file.uri,
        filename: file.filename,
        // icon
        file_size: file.length,
        md5sum: (file.hash||'md5:').split('md5:')[1],
        content_type: file.type
      };
    },

    fileObject: function(hashi) {
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
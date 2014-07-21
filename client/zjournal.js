

Template.hhtable.cols = function() {
    var tt=_.map(hhSchema, function(val,key){return {name: key, label: val.label}});
//    var ret= _.filter(tt,function(val){return !val.iscolhidden});
    return tt;
  };



Template.hhtable.rows = function() {
    return HouseHolds.find();
  };

Template.hhtable.val = function(obj,key) {
    var r = obj[key];
    var ret = r;
    if ( r instanceof Date) {ret = moment(r).format("DD.MM.YY HH:mm")};
    return ret;
  };


var checkOrX = function (value) {
    var html;
    return value;
    // first, normalize the value to a canonical interpretation
    if (typeof value === 'boolean')
      value = {
        support: value
      };

    if (value === null || value === undefined) {
      html = '<span style="color: orange; font-weight: bold">?</span>';
    } else {
      if (value.support === true)
        html = '<span style="color: green">&#10004;</span>'
      else if (value.support === false)
        html = '<span style="color: red">&#10008;</span>';
      else
        html = '<span style="color: lightblue">' + value.support + '</span>';
      if (value.link)
        html += ' (<a href="' + value.link + '">more</a>)';
      }
    return new Spacebars.SafeString(html);
  };

function getSchemaFields(schema){
var tt=_.map(schema, function(aval,akey){return {key: akey, label: aval.label, fn:checkOrX}});
    return tt;
}


Template.hhtable.householdsTableSettings = function () {
    return {
      rowsPerPage: 50,
      showNavigation: 'auto',
      fields: getSchemaFields(hhSchema)
  };
}

Template.hhtable.cHouseHolds = function () {
  return HouseHolds;

}

Template.hhtable.ZZZ_householdsTableSettings = function () {
    return {
      rowsPerPage: 50,
      showNavigation: 'auto',
      fields: [
        {
          key: 'name',
          label: 'Library',
          fn: function (name, object) {
            var html = '<a name="' + name +'" target="_blank" href="' + object.url + '">' + name + '</a>';
            return new Spacebars.SafeString(html);
          }
        },
        { key: 'sort', label: 'Sorting', fn: checkOrX },
        { key: 'pages', label: 'Pagination', fn: checkOrX },
        { key: 'filter', label: 'Filtering/Search', fn: checkOrX },
        { key: 'resize', label: 'Resizable Columns', fn: checkOrX },
        { key: 'edit', label: 'Inline Editing', fn: checkOrX },
        { key: 'responsive', label: 'Mobile/Responsive', fn: checkOrX },
        { key: 'i18n', label: 'Internationalization', fn: checkOrX },
        { key: 'keyboard', label: 'Keyboard navigation', fn: checkOrX },
        { key: 'meteor', label: 'Meteor Integration', fn: checkOrX }
      ]
    };
  };


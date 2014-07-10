

Template.logtable.cols = function() {
    var tt=_.map(clschema, function(val,key){return {name: key, label: val.label}});
//    var ret= _.filter(tt,function(val){return !val.iscolhidden});
    return tt;
  };



Template.logtable.rows = function() {
    return Calllogs.find();
  };

Template.logtable.val = function(obj,key) {
    var r = obj[key];
    var ret = r;
    if ( r instanceof Date) {ret = moment(r).format("DD.MM.YY HH:mm")};
    return ret;
  };



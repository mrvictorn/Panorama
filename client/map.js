// map.js
// gmaps api key AIzaSyD2Wus29oCZXwaTjMJ6qupv26fi5NEWUrw

var ourCityName="Киев, ";
		

function showMarkers(){
var curr= HouseHolds.find({position:{$exists:true}});
if(curr.count()<1) return;
var tmpl=Template.mapCanvas2;
tmpl.liveMarkers = LiveMaps.addMarkersToMap(tmpl.map,
			  [ {
			    cursor: curr,
			    transform: function(document) { //var r={}; getGoogleMapPosition(document,r); 
			      return {
			        title: document.formatted_address + ' #' + document.appartmentsCount,
			        position: document.position||tmpl.mapCenterLL,
			        //animation: google.maps.Animation.BOUNCE,
			        markerId: document._id
			        //icon: '//cdn.mydomain.com/icons/icon-house.png'
			      };
			    }
			  } ]
		);
};

Template.mapCanvas2.setAllMap = function (map) {
	var markers=Template.mapCanvas2.markers;
	for (var key in markers) {
		markers[key].setMap(map);
	};
};

// toggle the markers on the map  state == true is on
Template.mapCanvas2.toggleMarkers = function (state) { 
	var tmpl=Template.mapCanvas2;	
  	Template.mapCanvas2.setAllMap(state?tmpl.map:null);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}


Template.mapCanvas2.events({
    'click #btnTotals':  function(e, tmpl) {
      e.preventDefault();
      showMarkers();
 	} ,
 	'click #btnCalcGeoPos':  function(e, tmpl) {
      e.preventDefault();
      console.log('getting geo positions');
 	  getPositions2HouseHolds();
 	},
    'click #btnShowAllPoints':  function(e, tmpl) {
      e.preventDefault();
      console.log('toggle show all markers');
      var a=Session.get("showAllPoints");
      Session.set("showAllPoints",!a);
      Template.mapCanvas2.toggleMarkers(!a);
      } 	     
});

Template.mapCanvas2.helpers({
  messErrDecodedAddresses: function () {
  	var n=Session.get("nAddressDecodedCount");
    return n>0?""+n+" Помилок декодування адрес":"";
  },
  numAllEntrances: function() {
  	var anumAllEntrances=0;
  	HouseHolds.find().map(function(doc){
  		if (typeof doc.entranceCount == 'number'){ anumAllEntrances+=doc.entranceCount;}});
	return anumAllEntrances;
  },
  numAllHouseHolds: function() {
  	var anumAllHouseHolds=0;
  	HouseHolds.find().map(function(doc){ var a=doc.appartmentsCount;
  		if (typeof a == 'number'){ anumAllHouseHolds+=a;}});
	return anumAllHouseHolds;
  },
  isCheckedAP: function() {
  	return Session.get("showAllPoints")?" active":"";
  },
  noPosAddresses: function() {
	var curr=HouseHolds.find({position:{$exists:false}});
	return curr.count();
  }
});

function GeoSolver(aCollection,mapCenter) {
	this.geocoder = new google.maps.Geocoder();
	this.coll=aCollection;
	this.currDoc=undefined;
	this.currItemNum=0;
	this.numErrors=0;
	this.numCodedPositions=0;
	this.timer=undefined;
	this.mapCenterLL=mapCenter;
	this.finished=false;
	GeoSolver.GS = this;
	this._geoPosProcessing = function(){
		o=GeoSolver.GS;
		o.currDoc=o.coll.findOne({position:{$exists:false}});
		if(o.currDoc) {
			  o.currItemNum++;
    	
			  console.log("Looking at #" +o.currItemNum+" "+o.currDoc._id);
			  o.geocoder.geocode( { 'address': ourCityName+o.currDoc.street+" "+o.currDoc.buildingNumber, 'latLng':o.mapCenterLL}, 
		      function(results, status) {
		      title = o.currDoc.street+" № "+o.currDoc.buildingNumber + ' #' + o.currDoc.appartmentsCount;
		      if (status == google.maps.GeocoderStatus.OK) {
		        o.coll.update({_id:o.currDoc._id},{$set: {'position.lat': results[0].geometry.location.lat(), 'position.lng':results[0].geometry.location.lng(),
		        	formatted_address:results[0].formatted_address}});o.numCodedPositions++;
		        console.log(""+o.numCodedPositions+" for "+title+" we get position:"+results[0].geometry.location+" and address"+results[0].formatted_address);
		      } else 
		      { o.numErrors++;Session.set("nAddressDecodedCount",o.numErrors);
		        console.log("Err #"+o.numErrors+" for "+title+" we get error:"+status);
		      };});
  		} else {o.finished=true;}; 
      
       //find a record without position field
	};
	this.getGeoPosition = function(){
    // if this.currDoc in ! empty, get position, then update it, add property doc.position
    	o=GeoSolver.GS;
    	o._geoPosProcessing();
    	// trying to find next doc
    	if(!o.finished) {
    		o.timer = setTimeout(o.getGeoPosition, 2000);
    	}else{
    		console.log("finished geolocation sequence"); return;
    	};
	};
	this.startGeoSolving = function (){
		this.finished =false;
		this.getGeoPosition();
	};
}

function getPositions2HouseHolds() {
var tmpl=Template.mapCanvas2;
if(!GS){ var GS  = new GeoSolver(HouseHolds,tmpl.mapCenterLL);};
GS.startGeoSolving();
};
//var ttt=getPositions2HouseHolds();

///Live markers
  var LiveMaps, liveMarkers;

LiveMaps = {
    addMarkersToMap: function(map, cursors) {
      var cursor, queries;
      if (!Array.isArray(cursors)) {
        cursors = [cursors];
      }
      queries = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cursors.length; _i < _len; _i++) {
          cursor = cursors[_i];
          _results.push(liveMarkers(map, cursor));
        }
        return _results;
      })();
      return {
        stop: function() {
          var stopQuery, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = queries.length; _i < _len; _i++) {
            stopQuery = queries[_i];
            _results.push(stopQuery());
          }
          return _results;
        }
      };
    }
  };

  liveMarkers = function(map, cursor) {
    var addMarker, liveQuery, markers, removeMarker, transform;
    Template.mapCanvas2.markers = [];
    markers = Template.mapCanvas2.markers;
    if (cursor.observe) {
      transform = function(doc) {
        return {
          position: new google.maps.LatLng(doc.latitude || doc.lat || doc.location[1], doc.longitude || doc.lon || doc.lng || doc.location[0]),
          title: doc.title || doc.name || doc.label,
          animation: doc.animation || google.maps.Animation.DROP,
          icon: doc.icon || '//maps.google.com/mapfiles/ms/icons/green-dot.png'
        };
      };
    } else {
      transform = cursor.transform;
      cursor = cursor.cursor;
    }
    addMarker = function(doc) {
      var options;
      options = transform(doc);
      if (!options.map) {
        options.map = map;
      }
      return markers[doc._id] = new google.maps.Marker(options);
    };
    removeMarker = function(doc) {
      markers[doc._id].setMap(null);
      return delete markers[doc._id];
    };
    liveQuery = cursor.observe({
      added: addMarker,
      changed: function(newDoc, oldDoc) {
        removeMarker(oldDoc);
        return addMarker(newDoc);
      },
      removed: removeMarker
    });
    return function() {
      var marker, _i, _len, _results;
      liveQuery.stop();
      _results = [];
      for (_i = 0, _len = markers.length; _i < _len; _i++) {
        marker = markers[_i];
        _results.push(marker.setMap(null));
      }
      return _results;
    };
  };

  if (typeof Package === "undefined" || Package === null) {
    this.LiveMaps = LiveMaps;
  }



Template.mapCanvas2.rendered = function () {
	var tmpl = Template.mapCanvas2;
	
	//var mapCenterLL, geocoder;
   	GoogleMaps.init(
	    {
	        'sensor': true, //optional
	        'key': 'AIzaSyCgGSK4bE6on5zjLUwG62FpNi5XBt6RQTc'
	        //, 'language': 'de' //optional
	    }, 
	    function(){
	    	 //Дарница:)
   			tmpl.mapCenterLL = new google.maps.LatLng(50.4089071,30.6554254);
			geocoder = new google.maps.Geocoder();
	        var mapOptions = {
	            zoom: 14,
	            center: tmpl.mapCenterLL,
	            mapTypeId: google.maps.MapTypeId.ROADMAP
	        };
	        tmpl.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 
	       
	      });
};








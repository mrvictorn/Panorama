// map.js
// gmaps api key AIzaSyD2Wus29oCZXwaTjMJ6qupv26fi5NEWUrw

var ourCityName="Киев, ";
Session.setDefault("addNewZoneNow", false);		
Session.setDefault("EditZoneNow",null);
Session.setDefault("EditZoneBounds",null);
Session.setDefault("selectedMarkers",[]);

var fullColorPalette =["#78a25f","#0000ee","4d5e7b","#cd5b45","#008b8b","#9932cc","#ff7f00","#eec900","#999999","#ff69b4","#add8e6","#9370db"];
var drawingManager, selectedShape;
Template.mapCanvas2.markers = [];
Template.mapCanvas2.zones = [];


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
              markerId: document._id,
              appartmentsCount: document.appartmentsCount,
              entrancesTotal: document.entrancesTotal
              //icon: '//cdn.mydomain.com/icons/icon-house.png'
            };
          }
        } ]
    );
}

function showZones(){
  var curr= Zones.find({bounds:{$exists:true}});
  var tmpl=Template.mapCanvas2;
  tmpl.liveZones = LiveMaps.addZonesToMap(tmpl.map,[ {cursor: curr}]);
};


function pushUnique2Array(arr,el){
  return _.union(arr, [el]);
}


function pullUniqueFromArray(arr,el){
  return arr.filter(function (curr){ return el.toString()!=curr.toString()});
}
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

Template.mapCanvas2.addNewZoneNow = function () { 
  return Session.get('addNewZoneNow');
}

Template.mapCanvas2.hasSelectedMarkers = function () {
  return Session.get("selectedMarkers").length>0?true:false;
}


Template.mapCanvas2.zones = function(){
  return Zones.find({});
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
  'click #btnAddZone':  function(e, tmpl) {
    e.preventDefault();
    // 2 add: disable button btnAddNewZone
    st=Session.get("addNewZoneNow");
    if (st) {
      title=tmpl.find("#inputNewZoneTitle").value;
      n=Zones.find().count();
      color=fullColorPalette[n]||"#999999";
      // 2 add: check for sanity and unique our  inputNewZoneTitle.value !!!
      if (!(title ==="")){
        Zones.insert({title:title,type:ZONE_TYPE_HOUSEHOLDS,color:color});
        tmpl.find("#inputNewZoneTitle").value="";
        Session.set("addNewZoneNow",  false);   
      } 
    }
    else {Session.set("addNewZoneNow",  true);};
  },
  'dblclick .zone-cell':  function(e, tmpl) {
    e.preventDefault();
    id=e.target.id;
    if(Session.get("EditZoneNow")==null) {Session.set("EditZoneNow",id);};
  },
  'click .edit-zone-bounds':  function(e, tmpl) {
    e.preventDefault();
    if (Session.get("EditZoneBounds")){
      //saveZoneBounds();
      clearZoneSelection();
      Session.set("EditZoneBounds",null);
      return;
    };
    var zoneId=e.target.id.substr(8);
    zoneToEdit=Zones.findOne({_id:zoneId});
    Session.set("EditZoneBounds",zoneToEdit);
    enableZoneDrawingManager(Template.mapCanvas2.map);
  },
  'click .delete-button':  function(e, tmpl) {
    e.preventDefault();
    id=e.target.id;
    id=id.substr(10);
    // 2 add ask user for deletion Zone
    Zones.remove({_id:id});
  },
  'keypress #inputEditZoneTitle':function(e, tmpl) {
    if(e.keyCode == 13){
      e.preventDefault();
      newTitle=tmpl.find("#inputEditZoneTitle").value;
      //2 add: check for unique title!
      if(!Zones.findOne({title:newTitle})){
        Zones.update({_id:Session.get("EditZoneNow")}, {$set: {title:newTitle}});
      }
     Session.set("EditZoneNow",null); 
   }
  },    
 /* 'click':function(e, tmpl) {//chasing for marker click evt
    if(e.keyCode == 13){
      e.preventDefault();
      }
   
  },*/      
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
  	HouseHolds.find({position:{$exists:true}}).map(function(doc){
  		if (typeof doc.entranceCount == 'number'){ anumAllEntrances+=doc.entranceCount;}});
	return anumAllEntrances;
  },
  numAllHouseHolds: function() {
  	var anumAllHouseHolds=0;
  	HouseHolds.find({position:{$exists:true}}).map(function(doc){ var a=doc.appartmentsCount;
  		if (typeof a == 'number'){ anumAllHouseHolds+=a;}});
	return anumAllHouseHolds;
  },
  numBuildings: function() {
  	return HouseHolds.find({position:{$exists:true}}).count();
  },
  numSelectedEntrances: function() {
    var anumAllEntrances=0;
    smarkers=Session.get("selectedMarkers");
    HouseHolds.find({_id:{$in:smarkers}}).map(function(doc){
      if (typeof doc.entranceCount == 'number'){ anumAllEntrances+=doc.entranceCount;}});
  return anumAllEntrances;
  },
  numSelectedHouseHolds: function() {
    var anumAllHouseHolds=0;
    smarkers=Session.get("selectedMarkers");
    HouseHolds.find({_id:{$in:smarkers}}).map(function(doc){ var a=doc.appartmentsCount;
      if (typeof a == 'number'){ anumAllHouseHolds+=a;}});
  return anumAllHouseHolds;
  },
  numSelectedBuildings: function() {
    smarkers=Session.get("selectedMarkers");
    return HouseHolds.find({_id:{$in:smarkers}}).count();
  },
  isCheckedAP: function() {
  	return Session.get("showAllPoints")?" active":"";
  },
  isEditZoneNow: function(id) {
    return Session.get("EditZoneNow") == id;
  },
  zoneBoundsMode: function(id) {
    var zone=Session.get("EditZoneBounds");
    if(zone){
      return zone._id == id?" glyphicon-resize-full":" glyphicon-pencil";
    }
    return " glyphicon-pencil";
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
var LiveMaps, liveMarkers,liveZones;

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
    },
    addZonesToMap: function(map, cursors) {
      var cursor, queries;
      if (!Array.isArray(cursors)) {
        cursors = [cursors];
      }
      queries = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cursors.length; _i < _len; _i++) {
          cursor = cursors[_i];
          _results.push(liveZones(map, cursor));
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




function getIcon(color) {
	return MapIconMaker.createMarkerIcon({width: 20, height: 34, primaryColor: color, cornercolor:color});
}  

function newStyledMarker(options,doc){
	options.styleIcon = new StyledIcon(StyledIconTypes.BUBBLE,{color:"#ff0000",text:""+doc.entranceCount+"п \n"+doc.appartmentsCount+"кв"});
    return new StyledMarker(options);
}



function bulkSelectMarkersIn(bnds){
  var markers=Template.mapCanvas2.markers;
  var smarkers=Session.get("selectedMarkers");
  var bounds = bnds; //new google.maps.LatLngBounds(sw, ne);
  for (var a in markers) {
    if (bounds.contains(markers[a].position)){//new google.maps.LatLng(markers[a].lat, markers[a].lng))) {
      var m=marker[a];
      var color = "#ff8c94";
      if(!m.isSelected){
        m.isSelected=true;
        Session.set("selectedMarkers",pushUnique2Array(smarkers,m.markerId));
        m.setAnimation(google.maps.Animation.DROP);
        color = "#0000FF";
        //window.setTimeout(function() { }, 3000);
      } else {
        m.isSelected=false;
        m.setAnimation(null);
        Session.set("selectedMarkers",pullUniqueFromArray(smarkers,m.markerId));
      };
      m.styleIcon.set("color",color);
    };
  }
}



function setOnClickToMarker(marker){
	var m=marker;
	google.maps.event.addListener(marker, 'rightclick', function (event) {
	    event.stop(); var color = "#FF0000";
      var se = Session.get("selectedMarkers");
	    if(!m.isSelected){
	      m.isSelected=true;
        Session.set("selectedMarkers",pushUnique2Array(se,m.markerId));
	      m.setAnimation(google.maps.Animation.DROP);
	      color = "#0000FF";
	      //window.setTimeout(function() { }, 3000);
	    } else {
		    m.isSelected=false;
	      m.setAnimation(null);
        Session.set("selectedMarkers",pullUniqueFromArray(se,m.markerId));
	    };
	    m.styleIcon.set("color",color);
	});
}
  
liveMarkers = function(map, cursor) {
    var addMarker, liveQuery, markers, removeMarker, transform;
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
      var m = new newStyledMarker(options,doc);
      //m=new google.maps.Marker(options);
      setOnClickToMarker(m);
      return markers[doc._id] = m;
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

liveZones = function(map, cursor) {
    var addZone, liveQuery, zones, removeZone, transform;
    zones = Template.mapCanvas2.zones;
    if (cursor.observe) {
      transform = function(doc) {
        return {
          /*  google.maps.PolygonOptions:
          clickable boolean Indicates whether this Polygon handles mouse events. Defaults to true.
          draggable boolean If set to true, the user can drag this shape over the map. The geodesic property defines the mode of dragging. Defaults to false.
          editable  boolean If set to true, the user can edit this shape by dragging the control points shown at the vertices and on each segment. Defaults to false.
          fillColor string  The fill color. All CSS3 colors are supported except for extended named colors.
          fillOpacity number  The fill opacity between 0.0 and 1.0
          geodesic  boolean When true, edges of the polygon are interpreted as geodesic and will follow the curvature of the Earth. When false, edges of the polygon are rendered as straight lines in screen space. Note that the shape of a geodesic polygon may appear to change when dragged, as the dimensions are maintained relative to the surface of the earth. Defaults to false.
          map Map Map on which to display Polygon.
          paths MVCArray.<MVCArray.<LatLng>>|MVCArray.<LatLng>|Array.<Array.<LatLng|LatLngLiteral>>|Array.<LatLng|LatLngLiteral>  The ordered sequence of coordinates that designates a closed loop. Unlike polylines, a polygon may consist of one or more paths. As a result, the paths property may specify one or more arrays of LatLng coordinates. Paths are closed automatically; do not repeat the first vertex of the path as the last vertex. Simple polygons may be defined using a single array of LatLngs. More complex polygons may specify an array of arrays. Any simple arrays are converted into MVCArrays. Inserting or removing LatLngs from the MVCArray will automatically update the polygon on the map.
          strokeColor string  The stroke color. All CSS3 colors are supported except for extended named colors.
          strokeOpacity number  The stroke opacity between 0.0 and 1.0
          strokePosition  StrokePosition  The stroke position. Defaults to CENTER. This property is not supported on Internet Explorer 8 and earlier.
          strokeWeight  number  The stroke width in pixels.
          visible boolean Whether this polygon is visible on the map. Defaults to true.
          zIndex  number  The zIndex compared to other polys.
          */
          fillColor: doc.color,
          fillOpacity: 0.45,
          strokeColor: doc.color,
          strokeOpacity: 0.45,
          map:map,
          paths: doc.bounds,
          title: doc.title 
        };
      };
    } else {
      transform = cursor.transform;
      cursor = cursor.cursor;
    }
    addZone = function(doc) {
      var options;
      options = transform(doc);
      if (!options.map) {
        options.map = map;
      }
      var m = new google.maps.Polygon(options);
      //m=new google.maps.Marker(options);
      google.maps.event.addListener(m, 'click', function() {
        setSelection(m);
      });
      return zones[doc._id] = m;
    };
    removeZone = function(doc) {
      zones[doc._id].setMap(null);
      return delete zones[doc._id];
    };
    liveQuery = cursor.observe({
      added: addZone,
      changed: function(newDoc, oldDoc) {//////////////////////////////////////////////////////////////////////////////////////
        removeZone(oldDoc);
        return addZone(newDoc);
      },
      removed: removeZone
    });
    return function() {
      var zone, _i, _len, _results;
      liveQuery.stop();
      _results = [];
      for (_i = 0, _len = zones.length; _i < _len; _i++) {
        zone = zones[_i];
        _results.push(zone.setMap(null));
      }
      return _results;
    };
  };

  if (typeof Package === "undefined" || Package === null) {
    this.LiveZones = LiveZones;
  }


function keyController(evt){
  if(evt.keyCode==27 && Session.get("addNewZoneNow")) {
    Session.set("addNewZoneNow", false);
  }; 
  if(evt.keyCode==27 && Session.get("EditZoneBounds")){
      Session.set("EditZoneBounds",null);
    };
}

Template.mapCanvas2.rendered = function () {
  var tmpl = Template.mapCanvas2;
  //Дарница:)
  tmpl.mapCenterLL = new google.maps.LatLng(50.4089071,30.6554254);
  geocoder = new google.maps.Geocoder();
    var mapOptions = {
        zoom: 14,
        center: tmpl.mapCenterLL,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    tmpl.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    $('body').on('keydown',keyController); 
    plugStyledMarkers();
    showZones();
    showMarkers();
};

function clearZoneSelection() {
  if (selectedShape) {
    selectedShape.setEditable(false);
    selectedShape = null;
    Session.set("EditZoneBounds",null);
  }
}

function saveZoneBounds(aShape){
  if(!aShape) {console.log("error saveZoneBounds() - shape undefined");return;};
  var bounds = {};
  abounds = aShape.getPaths();
  abounds.forEach(function(xy, i) {
    bounds[i]=[];   
    xy.forEach(function(node, n) {
      bounds[i][n]=new google.maps.LatLng(node.lat(),node.lng());
      });
  });
  Zones.update({_id:aShape.zoneId},{$set:{bounds:bounds}});
}

function enableZoneDrawingManager(map){
  var zone2edit= Session.get("EditZoneBounds");
  
  function setSelection(shape) {
        clearZoneSelection();
        selectedShape = shape;
        shape.setEditable(true);
        selectedZone=Zones.findOne({_id:shape.zoneId});
        Session.set("EditZoneBounds",selectedZone);
   }  
  var polyOptions = {
    strokeWeight: 0,
    fillOpacity: 0.45,
    editable: true,
    fillColor:zone2edit.color
  };
  // Creates a drawing manager attached to the map that allows the user to draw
  // markers, lines, and shapes.
  drawingManager =  drawingManager || new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControlOptions: {drawingModes:[google.maps.drawing.OverlayType.POLYGON]},
    markerOptions: {
      draggable: true
    },
    polygonOptions: polyOptions,
    map: map
  });

  drawingManager.polygonOptions=polyOptions;
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
      if (e.type == google.maps.drawing.OverlayType.POLYGON) {
      drawingManager.setDrawingMode(null);

      // Add an event listener that selects the newly-drawn shape when the user
      // mouses down on it.
      var newShape = e.overlay;
      newShape.type = e.type;
      var zone=Session.get("EditZoneBounds");
      if(!zone){e.preventDefault(); return;};
      newShape.zoneId=zone._id;
      saveZoneBounds(newShape);
      google.maps.event.addListener(newShape, 'click', function() {
        setSelection(newShape);
      });
      setSelection(newShape);
    }
  });

  // Clear the current selection when the drawing mode is changed, or when the
  // map is clicked.
  google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearZoneSelection);
  google.maps.event.addListener(map, 'click', clearZoneSelection);
}









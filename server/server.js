Meteor.publish("households", function () {
  return HouseHolds.find();
});


Meteor.publish("zones", function () {
  return Zones.find();
});




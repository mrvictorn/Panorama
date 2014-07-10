Meteor.publish("calllogs", function () {
  return Calllogs.find();
});
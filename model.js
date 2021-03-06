hhSchema =  {
        inputtedByUser: 
        {   type: Object,
            autoValue: function (){return Meteor.userId()},
        },
        whenInputted:
         {  type: Date,
            label: "Дата внесення",
            optional: false
        },
        agent: {
            type: String,
            label: "Агент",
            optional: false
        },
        street: {
            type: String,
            label: "Вулиця",
            optional: false
        },
        buildingNumber:
         {
            type: String,
            label: "Номер дому",
            optional: false
        },
        buildingCorpsNumber:
         {
            type: String,
            label: "Корпус",
            optional: true
        },
        entranceCount:
         {
            type: Number,
            label: "Кількість під`їздів",
            optional: false
        },
        appartmentsByEntrancesDesc:
         {
            type: String,
            label: "Кількість квартир в під`їздах"
        },
        appartmentsCount:
         {
            type: Number,
            label: "Кількість квартир в будинку",
            optional: false
        },
        entranceGuardType:
         {
            type: String,
            label: "Вид доступу"
        },
        entranceServiceCompany:
         {
            type: String,
            label: "Сервісна компанія"
        },
        notes: {
            type: String,
            label: "Примітки",
            optional: true,
            max: 1000
        },
        position:
        {type: Object,
        optional:true}
};

ZONE_TYPE_HOUSEHOLDS='HouseHolds';
zonesSchema =  {
        owner: 
        {   type: Object, //!!! cross reference type need here!! to be changed!
            autoValue: function (){return Meteor.userId()},
        },

        title: 
        {   type: String,
            autoValue: function (){return "*Нова зона"}
        },
        type: 
        {   type: String
            
        },
        color:
        { type:String,
          autoValue: function(){return "#999999" }// default grey
        },
        bounds:
        {   type: [Object],
            optional: true
        }
}


function ifSuperAdmin()
{
    return true;// just stub, till user system is implemented!
}

HouseHolds = new Meteor.Collection("households");
//HouseHolds = new Meteor.Collection("households", {schema: hhSchema});

Zones = new Meteor.Collection("zones",zonesSchema);


HouseHolds.allow({
  insert: function (userId, party) {
    return true; 
  },
  update: function (userId, party, fields, modifier) {
     return true;
  },
  remove: function (userId, party) {
    // You can only remove parties that you created and nobody is going to.
    return party.owner === userId ;
  }
});

Zones.allow({
  insert: function (userId, doc) {
    return true; 
  },
  update: function (userId, doc, fields, modifier) {
     return true;
  },
  remove: function (userId, doc) {
    // You can only remove parties that you created and nobody is going to.
    return (doc.owner === userId) || ifSuperAdmin() ;
  }
});



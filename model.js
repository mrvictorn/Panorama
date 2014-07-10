clschema =  {
        owner: 
        {   type: Object,
            autoValue: function (){return Meteor.userid()},
        },
        date:
         {  type: Date,
            label: "Дата звонку",
            optional: false
        },
        client: {
            type: String,
            label: "Ф.І.П. клієнта"
        },
        phonenumber: {
            type: Number,
            label: "Номер телефону",
            min: 0
        },
        ourmessage:
         {
            type: String,
            label: "Наше повідомлення",
            optional: false,
            max: 200
        },
        clientanswer:
         {
            type: String,
            label: "Відповідь клієнта",
            optional: false,
            max: 200
        },
        summary: {
            type: String,
            label: "Результат",
            optional: true,
            max: 1000
        }
};

Calllogs = new Meteor.Collection("calllogs", {schema: clschema});

Calllogs.allow({
  insert: function (userId, party) {
    return true; // no cowboy inserts -- use createParty method
  },
  update: function (userId, party, fields, modifier) {
     return true;
  },
  remove: function (userId, party) {
    // You can only remove parties that you created and nobody is going to.
    return party.owner === userId ;
  }
});
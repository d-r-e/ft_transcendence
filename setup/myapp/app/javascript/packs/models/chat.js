import Backbone from 'backbone'
import Helper from '../Helper.js'

let ChatModel = Backbone.Model.extend({
    urlRoot: 'api/chats',
    initialize: function() {
        console.log("Fetching chat [" + this.get("name") + "]");
    },
});

let ChatCollection = Backbone.Collection.extend(
    {
        url: 'api/chats',
        model: ChatModel,
        parse: function(data) {
            return data;

        },
        initialize: function(){
            Helper.fetch(this);
        },
    }
);

let chatcol = new ChatCollection();
chatcol.on("change", function(){console.log("User changed. Current size: "+ this.length)});
console.log("CHATCOL: " + chatcol.length);
export default chatcol;
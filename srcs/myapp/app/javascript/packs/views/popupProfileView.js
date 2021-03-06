import Backbone from 'backbone'
import $ from 'jquery'
import _ from 'underscore'
import Helper from '../Helper'
import channelcol from '../models/channel'
import consumer from "./../../channels/consumer"
import userscollection from '../models/user.js'

let PopupProfileView = Backbone.View.extend({
    el: '#popup-content',
    userCol: userscollection,
    
    async fetchUsers() {
        self = this;
        await Helper.fetch(this.userCol).then(function() {
            self.render();
        })
    },
    initialize(name) {
        if(!name)
            return;
        this.username = name
        this.fetchUsers();
    },
    render(){
        this.model = this.userCol.where({ nickname: this.username })[0];        
        if (this.username != Helper.current_user())
        {
            let output=
                "<div><a href=\"#challenge/"+ this.model.get("id") +"\" data-challenge=\""+ this.model.get("id") + "\" class=\"btn btn-dark challengebutton\">" + "Challenge " + this.model.get("nickname")+ "</a></div>" +
                "<div><a href =\"#users/"+this.model.get("id")+"\" class=\"btn btn-dark\">" + "Go to " + this.model.get("nickname")+ " profile</a></div>" +
                "<div class=\"blockbutton\" ><a href =\"#users/"+this.model.get("id")+"\" class=\"btn btn-danger\">" + "Block " + this.model.get("nickname")+ " profile</a></div>";
            let template = _.template($("#popup-template").html());
            output = template({user: this.model.toJSON()});
            this.$el.html(output);
            //this.$el.append("<div><a href =\"#users/"+this.model.get("id")+"\" class=\"btn btn-dark\">" + "Go to " + this.model.get("nickname")+ " profile</a></div>");
        }
        else{
            this.$el.html("<div><a href =\"#users/"+this.model.get("id")+"\" class=\"btn btn-dark\">" + "Go to your profile</a></div>");

        }
        $('#popup-user-avatar').html(`<img src="${this.model.toJSON().avatar.thumb.url}"></img>`)

    }
});


export default PopupProfileView;
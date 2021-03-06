import $ from 'jquery'
import _ from 'underscore'
import Backbone from 'backbone'
import Helper from '../Helper'
import Matchmaking from '../../channels/matchmaking_channel'
import MyApp from '../application'
import consumer from '../../channels/consumer'
import MySession from '../models/session'

const SearchMatch = {}

if (Helper.logged() && Helper.valid()) {

$(function () {

    SearchMatch.view = Backbone.View.extend({

        el: "#content",

        game_found: false,

        template: _.template($('#search_match_template').html()),

        match_found_template: _.template($('#match_found_template').html()),

        initialize(id, from) {
            // connecting to the channel by sending the user id
            if (id === 'quick' || id === 'ranked' || id === 'tournament' || id === 'war')
            {
                this.type = id;
                this.render();
                Matchmaking.channel.connect(Helper.userId(), this.receive_data, this, id + "_game")
                return;
            }
            this.type = 'challenge';
            this.render()
            if (id && id.length > 0 && from &&  from.length > 0)
            {
                Matchmaking.channel.connect(Helper.userId(), this.receive_data, this, "accept_peer", id)
            }
            else if (id && id.length > 0)
            {
                Matchmaking.channel.connect(Helper.userId(), this.receive_data, this, "wait_peer", id)
            }
            else
                Matchmaking.channel.connect(Helper.userId(), this.receive_data, this)
        },

        async checkMissMatch() {
            self = this;
            let myself = await Helper.ajax('GET', 'api/users/' + Helper.userId());
            this.myself = myself;
            let preGuild = await Helper.ajax('GET', 'api/guilds/' + myself.guild_id);
            let guild = JSON.parse(preGuild.success);
            let war = await Helper.ajax('GET', 'api/wars/' + guild.war_id);
            this.ownCable = consumer.subscriptions.subscriptions.find(el => (el.identifier.includes(`"MatchmakingChannel\",\"id\":${Helper.userId()}`)));
            setTimeout(function(){
                if (self.game_found === false) {
                    self.ownCable.perform('miss_match');
                    $('#search_match_modal').modal('hide');
                    window.location.href = '#play';
                    Helper.custom_alert('success', "Unanswered match, your guild wins 1 war point.");
                }
            }, (war.answer_time * 60 * 1000));
        },

        render() {
			let output = this.template({'type': this.type})
            this.$el.html(output);
            this.game_found = false;
            self = this;
            $('#search_match_modal').modal('show');
            if (this.type === 'war')
                this.checkMissMatch();
            $('#cancel-button').on("click", function(){
                if (self.type === 'war')
                    self.ownCable.perform('cancel_war_game')
                $('#search_match_modal').modal('hide')
                window.location.href = '#play';
            })
            return this;
        },

        stopQueue(message){
            $('#search_match_modal').modal('hide')
            window.location.href = '#play';
            Helper.custom_alert('danger', message);
        },

        // this function is called from matchmaking_channel when a match game is found
        receive_data(data) {
            switch (data.action) {
                case 'searching':
                    break;
                case 'game_found':
                    this.game_found = true;
                    this.render_match_found(data.player1, data.player2, data.match)
                    break;
                case 'current_game':
                    $('#search_match_modal').modal('hide')
                    setTimeout(function () {
                        MyApp.core.navigate('match/' + data.match)
                    }, 300)
                    break;
                case 'try_later':
                    this.stopQueue('There is already a match in your war, try again later.');
                    break;
                case 'not_war':
                    this.stopQueue('You are not in a war now.');
                    break;
                case 'not_tournament':
                    this.stopQueue('Your are not in a tournament.');
                    break;
            }
        },

		capitalize(word) {
			return word[0].toUpperCase() + word.slice(1).toLowerCase();
	  	},


        render_match_found(player1, player2, match_id) {
            $('#search_match_modal').modal('hide')
            this.$el.html(this.match_found_template({
				'player1': player1,
				'player2': player2,
				'type': this.capitalize(this.type)
				}));
            $('#match_found_modal').modal('show')
            setTimeout(function () {
                $('#match_found_modal').modal('hide')
                //Redirection to the match
                setTimeout(function () {
                    MyApp.core.navigate('match/' + match_id)
                }, 300)
            }, 3000)
        },

        removeChannel() {
            Matchmaking.channel.disconnect()
        }
    });
})
}

export default SearchMatch;

import $ from 'jquery'
import _ from 'underscore'
import Backbone from 'backbone'
import Helper from '../Helper'
import userscollection from '../models/user.js'
import Blockeds from './profile/blockedsView'
import Friends from './profile/friendsView'
import MatchHistory from './profile/match_history'
import MySession from '../models/session'

const Profile = {}

$(function () {

if (Helper.logged() && Helper.valid()) {

    Profile.view = Backbone.View.extend({

        collection: userscollection,

        el: "#content",

        template: _.template($('#user_profile_template').html()),

        uinfo_template: _.template($('#user_info_template').html()),

        two_fa_template: _.template($('#two-fa-profile-template').html()),

        extra_user_template: _.template($('#extra_user_template').html()),

        events: {
            "submit #avatar-form" : "updateAvatar",
            "submit #edit-user-form": "editUserForm",
            "click #addFriend": "addFriend",
            "click #blockUser": "blockUser",
            "click #addToGuild": "inviteToGuild",
            "click #enable-2fa": "enable2FA",
            "click #disable-2fa": "disable2FA"
        },

        async checkUser(id) {
            self = this;
            $.ajax("api/users/" + id, {
                "type": "GET"
            })
            .done(function () {
                self.startView(id);
            })
            .fail(function () {
                window.location.href = '#error';
            })
        },

        async startView(id) {
            MySession.data.update()
            this.user_id = id
            await Helper.fetch(this.collection)
            this.user = this.collection.get(this.user_id);
            if (this.user.get('guild_id')) {
                this.guild = await Helper.ajax('GET', 'api/guilds/' + this.user.get('guild_id'))
            } else {
                this.guild = null
            }
            this.render()
            this.render_userInfo()
            this.render_extraUser()
            this.friendView = new Friends.view(this.user_id)
            this.friendView.update()
            this.matchhistoryView = new MatchHistory.view(this.user_id)
            this.matchhistoryView.update()
            if (Helper.userId() == this.user_id) { // Only show block user list if is the current_user
                this.update_two_fa()
                this.blockView = new Blockeds.view(this.user_id)
                this.blockView.update()
            }
        },
    
        initialize(id) {
            this.checkUser(id);
          },
        
        render() {
            this.$el.html(this.template( { 'user': this.user.toJSON(), 'me': MySession.data.officer_or_owner() } ));
            return this;
        },

        render_userInfo() {
            var guild = null
            if (this.guild && this.guild['success']) {
                guild = JSON.parse(this.guild['success'])
            }
            this.$el.find('#user_info').html(this.uinfo_template({'user': this.user.toJSON(), 'guild': guild }));
        },

        render_extraUser() {
            this.$el.find('#extra_user_info').html(this.extra_user_template({'user': this.user.toJSON()}));
        },

        async update_two_fa() {
            var response = await Helper.ajax('GET', 'api/users/' + Helper.userId() + '/two_fa')
            if (response['success']) {
                this.render_two_fa(response['success'])
            }
        },

        render_two_fa(data) {
            this.$el.find('#two-fa-data').html(this.two_fa_template({'two_fa': data }));
        },

        render_friends() {
            if (this.friendView) {
                this.friendView.update()
            }
        },

        render_blockeds() {
            if (this.blockView) {
                this.blockView.update()
            }
        },
    
        updateAvatar(e) {
            var input = document.getElementById('avatarFileInput')
            if (input.files && input.files[0]) { //Checks if a file is uploaded
                const self = this
                setTimeout(async function() {
                    await Helper.fetch(self.collection)
                    var nav_avatar = document.getElementById('nav-avatar-user')
                    var c_user = self.collection.get(self.user_id).toJSON();
                    nav_avatar.src = c_user.avatar.thumb.url
                    self.render_userInfo();
                    self.matchhistoryView.update();
                }, 1000)
            } else {
                e.preventDefault()
                e.stopPropagation()
            }
        },
    
        editUserForm(e) {
            e.preventDefault()
            e.stopPropagation()
            this.user.set({
                nickname: $('#form-nickname').val(),
                name: $('#form-name').val()
            })
            const self = this
            this.user.save().then( function (response) {
                $('#editUserModal').modal('hide')
                if (response['error']) {
    
                    document.getElementById('edit-user-form').reset()
                    Helper.custom_alert('danger', response['error'])
                } else {
    
                    var nav_avatar = document.getElementById('nav-nickname-user')
                    nav_avatar.innerHTML = $('#form-nickname').val()
                    self.render_userInfo()
                    self.matchhistoryView.update()
                    Helper.custom_alert('success', 'Successfully updated.')
                }
            })
        },
    
        async addFriend(e) {
            e.preventDefault()
            var formData = {
                request: {
                    requestor_id: Helper.userId(),
                    receiver_id: $(e.currentTarget).data().userfriendId,
                    type: 'Friend Request'
                }
            }
            var response = await Helper.ajax('POST', 'api/requests', formData)
            if (response['error']) {
                Helper.custom_alert('danger', response['error'])
            } else {
                Helper.custom_alert('success', response['success'])
            }
        },
    
        async blockUser(e) {
            e.preventDefault()
            var formData = { user_id: $(e.currentTarget).data().userblockId }
            var response = await Helper.ajax('POST', 'users/' + Helper.userId() + '/block_user', formData)
            if (response['error']) {
                Helper.custom_alert('danger', response['error'])
            } else {
                Helper.custom_alert('success', response['success'])
            }
        },

        async inviteToGuild(e) {
            e.preventDefault()
            var formData = {
                request: {
                    requestor_id: MySession.data.guild().id,
                    receiver_id: $(e.currentTarget).data().userguildId,
                    officer: MySession.data.id(),
                    type: 'Guild Request'
                }
            }
            var response = await Helper.ajax('POST', 'api/requests', formData)
            if (response['error']) {
                Helper.custom_alert('danger', response['error'])
            } else {
                Helper.custom_alert('success', response['success'])
            }
        },

        async enable2FA(e) {
            e.preventDefault()
            var response = await Helper.ajax('POST', 'api/users/'+ MySession.data.id() + '/enable_two_fa', '')
            if (response['error']) {
                Helper.custom_alert('danger', response['error'])
            } else {
                Helper.custom_alert('success', response['success'])
                await Helper.fetch(this.user)
                this.render_userInfo()
                this.update_two_fa()
            }
        },

        async disable2FA(e) {
            e.preventDefault()
            var response = await Helper.ajax('POST', 'api/users/'+ MySession.data.id() + '/disable_two_fa', '')
            if (response['error']) {
                Helper.custom_alert('danger', response['error'])
            } else {
                Helper.custom_alert('success', response['success'])
                await Helper.fetch(this.user)
                this.render_userInfo()
                this.update_two_fa()
            }
        },

        undelegateChildViews() {
            if (this.blockView) {
                this.blockView.undelegateEvents()
            }
            if (this.friendView) {
                this.friendView.undelegateEvents()
            }
            if (this.matchhistoryView) {
                this.matchhistoryView.undelegateEvents()
            }
        }
    
    });
}
})

export default Profile;

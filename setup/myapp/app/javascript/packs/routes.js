import Backbone from 'backbone'
import Login from './views/loginView'
import Register from './views/registerView'
import Profile from './views/profileView'
import pongView from './views/pongView'
import chatView from './views/chatView'
import SearchMatch from './views/searchMatchView'
import channelsView from './views/channelsView'
import Match from './views/matchView'
import Helper from './Helper'
import PopupProfileView from './views/popupProfileView'
import Guilds from './views/guildsView'
import Errors from './views/notFoundView'
import rankingView from './views/rankingView'
import adminview from './views/adminView'
import playview from './views/playView'
import adminView from './views/adminView'
import waitView from './views/challengeWaitingView'

class Workspace extends Backbone.Router {

    execute(callback, args, name) {
        this.undelegateViews()
            // If user is not logged in, redirect to login page (except sign in and signup views)
        if (!Helper.logged() && (name != 'userSignin' && name != 'userSignup')) {
            this.navigate('sign_in', { trigger: true })
            return false
        }
        // if user is logged in, redirect to main page (when the sign in and signup views is accessed)
        if (Helper.logged() && (name == 'userSignin' || name == 'userSignup')) {
            this.navigate('', { trigger: true })
            return false
        }
        if (callback)
            callback.apply(this, args);
    }

    // function than removes the last active view for fix zombie views error
    undelegateViews() {
        if (this.pongview) {
            this.pongview.undelegateEvents()
        }
        if (this.chatview) {
            this.chatview.undelegateEvents()
        }
        if (this.channelView) {
            this.channelView.undelegateEvents()
        }
        if (this.signinView) {
            this.signinView.undelegateEvents()
        }
        if (this.signupView) {
            this.signupView.undelegateEvents()
        }
        if (this.profileview) {
            this.profileview.undelegateChildViews()
            this.profileview.undelegateEvents()
        }
        if (this.searchmatchView) {
            this.searchmatchView.removeChannel()
            this.searchmatchView.undelegateEvents()
        }
        if (this.matchView) {
            this.matchView.removeChannel()
            this.matchView.undelegateEvents()
        }
        if (this.guildsView) {
            this.guildsView.removeChannel()
            this.guildsView.undelegateEvents()
        }
        if (this.guildView) {
            this.guildView.removeChannel()
            this.guildView.undelegateEvents()
        }
    }

    get routes() {
        return {
            "": "pong",
            "chat": "chat",
            "chat/:name": "chat",
            "sign_in": "userSignin",
            "sign_up": "userSignup",
            "play": 'play',
            "users/:id": "userProfile",
            "channels/": "channels",
            "channels/:name": "channels",
            "popup1": "popup_profile",
            "popup1/:name": "popup_profile",
            "search_match/:id": "search_match",
            "match/:id": "match",
            "guilds": "guilds",
            "guilds/:id": "guild",
            "ranking": "ranking",
            "admin": "admin",
            "challenge/:id": "search_match",
            "challenge/:id/accept/:from": "search_match",
            "*actions": "notFound"
        }
    }
/* 
    wait(id){
        this.waitview = new waitView(id);
        this.waitview.render();
    } */

    admin(){
        if (!this.adminview)
            this.adminview = new adminView();
        this.adminview.render();
    }

    popup_profile(){
        this.popupprofile = new PopupProfileView(($('.popup-user-title').text()));
    }

    pong() {
        console.log("pong route");
        this.pongview = new pongView();
        //pongview.render();
    }

    chat(name) {
        if (!this.chatview)
            this.chatview = new chatView();
        if (name)
        {
            this.chatview.renderConversation(name);
        }
        else
            this.chatview.render();
    }

    ranking() {
        if (!this.rankView)
            this.rankView = new rankingView();
        this.rankView.render();
    }

    channels(name){
        console.log(name);
        if (!this.channelView)
            this.channelView = new channelsView();
        if (name != "default")
            this.channelView.check_password(name);
        else
            this.channelView.render();
    }

    userSignin() {
        console.log("userSignin route")
        this.signinView = Login.view
        this.signinView.delegateEvents()
        this.signinView.render()
    }

    userSignup() {
        console.log("userSignup route.")
        this.signupView = Register.view
        this.signupView.delegateEvents()
        this.signupView.render()
    }

    userProfile(id) {
        console.log("userProfile route")
        this.profileview = new Profile.view(id)
    }

    play(){
        this.playview = playview;
        this.playview.render();
    }

    search_match(id, from) { // Id is also used for type of match
        console.log('search_match route')
        if (id && id.length > 0 && from && from.length > 0)
            this.searchmatchView = new SearchMatch.view(id, from)
        else if (id && id.length > 0)
            this.searchmatchView = new SearchMatch.view(id)
        else
            this.searchmatchView = new SearchMatch.view()
    }

    match(id) {
        console.log('match route')
        this.matchView = new Match.view(id)
    }

    guilds() {
        console.log('guilds route')
        this.guildsView = Guilds.view
        this.guildsView.delegateEvents()
        this.guildsView.render()
    }

    guild(id) {
        console.log('guild ' + id + ' route')
        this.guildView = new Guilds.GuildView(id)
    }

    notFound() {
        console.log('error 404 Not Found')
        this.error404 = Errors.NotFound
        this.error404.render()
    }

};

export default Workspace;

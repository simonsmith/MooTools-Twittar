
/*
---

description: Twittar Class. Request a users' recent tweets and displays them

author:
- Simon Smith - http://blink-design.net

requires:
- core/1.4.1:*
- more:1.4.0.1:Request.JSONP

provides: [Twittar]

...
*/

var Twittar = new Class({

    Implements: [Options, Events],

    initialize: function(username, element, options) {

        this.setOptions(options);

        this.username = username;
        this.element = $(element);
        this.url = this.formatUrl();

        this.request = new Request.JSONP({
            url: this.url,
            method: 'get',
            timeout: 5000,
            onRequest: function() {
                this.fireEvent('request', [this.element]);
            }.bind(this),
            onTimeout: function() {
                this.fireEvent('timeout', [this.element]);
            }.bind(this),
            onComplete: this.buildTweets.bind(this)
        });

    },

    options: {
        twitterUrl: 'https://api.twitter.com/1/statuses/user_timeline.json?&exclude_replies={replies}&contributor_details={contributerDetails}&include_rts={retweets}&screen_name={username}&count={count}',
        showRetweets: true,
        showReplies: true,
        contributerDetails: false,
        tweetCount: 5,
        showUserInfo: true,
        userInfoElement: 'a',
        onComplete: function(element, container) {
            element.grab(container);
        }
    },

    formatUrl: function() {

        var options = this.options;

        return options.twitterUrl.substitute({
            retweets: options.showRetweets,
            replies: options.showReplies,
            count: options.tweetCount,
            contributerDetails: options.contributerDetails,
            username: this.username
        });

    },

    linkify: function(text) {

        // Pinched from - http://goo.gl/HMk15
        return text.replace(/(https?:\/\/\S+)/gi,'<a href="$1">$1</a>')
               .replace(/(^|\s)@(\w+)/g,'$1<a href="http://twitter.com/$2">@$2</a>')
               .replace(/(^|\s)#(\w+)/g,'$1#<a href="http://search.twitter.com/search?q=%23$2">$2</a>');

    },

    getTweets: function() {

        this.request.send();
        return this;

    },

    formatTweetDate: function(dateStr) {

        // http://goo.gl/p3qd4
        dateStr = dateStr.replace(/^\w+ (\w+) (\d+) ([\d:]+) \+0000 (\d+)$/, '$1 $2 $4 $3 UTC');
        return new Date(dateStr).toUTCString();

    },

    formatTweetLink : function(user, id) {

        return 'http://twitter.com/{user}/status/{id}'.substitute({
            user: user,
            id: id
        });

    },

    buildTweets: function(tweets) {

        if (tweets.length == 0) return;

        var list = new Element('ul'),
            container = new Element('div', { 'class': 'tweets' });

        if (this.options.showUserInfo) {

            container.grab(new Element(this.options.userInfoElement, {
                'class': 'twitter-user',
                text: '@' + tweets[0].user.screen_name,
                href: 'http://twitter.com/' + tweets[0].user.screen_name
            }), 'top');

        }

        Object.each(tweets, function(item) {

            var element = new Element('li', {
                'class': 'tweet'
            }),
            tweet = new Element('span', {
                'class': 'tweet-text',
                html: this.linkify(item.text)
            }),
            date = new Element('a', {
                'class': 'tweet-date',
                text: this.formatTweetDate(item.created_at),
                href: this.formatTweetLink(item.user.screen_name, item.id_str)
            });

            element.grab(tweet).grab(date).inject(list);
            list.inject(container);

        }, this);

        this.fireEvent('complete', [this.element, container, list, list.getChildren(), tweets]);

    }

});

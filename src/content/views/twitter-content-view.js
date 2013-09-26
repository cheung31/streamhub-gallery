define([
    'streamhub-sdk/content/views/twitter-content-view',
    'hgn!streamhub-gallery/content/templates/twitter',
    'streamhub-sdk/util'],
function (BaseTwitterContentView, TwitterContentTemplate, util) {
    
    /**
     * A view for rendering twitter content into an element.
     * @param opts {Object} The set of options to configure this view with (See ContentView).
     * @exports streamhub-sdk/content/views/twitter-content-view
     * @constructor
     */

    var TwitterContentView = function (opts) {
        BaseTwitterContentView.call(this, opts);
    };
    util.inherits(TwitterContentView, BaseTwitterContentView); 
    
    TwitterContentView.prototype.template = TwitterContentTemplate;

    return TwitterContentView;
});

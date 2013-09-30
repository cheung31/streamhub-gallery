define([
    'streamhub-sdk/content/views/twitter-content-view',
    'hgn!streamhub-gallery/content/templates/twitter',
    'inherits'],
function (BaseTwitterContentView, TwitterContentTemplate, inherits) {
    
    /**
     * A view for rendering twitter content into an element.
     * @param opts {Object} The set of options to configure this view with (See ContentView).
     * @exports streamhub-sdk/content/views/twitter-content-view
     * @constructor
     */

    var TwitterContentView = function (opts) {
        BaseTwitterContentView.call(this, opts);
    };
    inherits(TwitterContentView, BaseTwitterContentView); 
    
    TwitterContentView.prototype.template = TwitterContentTemplate;

    return TwitterContentView;
});

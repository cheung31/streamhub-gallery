define([
    'streamhub-sdk/content/views/facebook-content-view',
    'hgn!streamhub-gallery/content/templates/facebook',
    'inherits'],
function (BaseFacebookContentView, FacebookContentTemplate, inherits) {

    /**
     * A view for rendering facebook content into an element.
     * @param opts {Object} The set of options to configure this view with (See ContentView).
     * @exports streamhub-sdk/content/views/facebook-content-view
     * @constructor
     */
    var FacebookContentView = function FacebookContentView (opts) {
        BaseContentView.call(this, opts);
    };
    inherits(FacebookContentView, BaseFacebookContentView);
    
    FacebookContentView.prototype.template = FacebookContentTemplate;

    return FacebookContentView;
});

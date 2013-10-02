define([
    'streamhub-sdk/content/views/instagram-content-view',
    'hgn!streamhub-gallery/content/templates/instagram',
    'inherits'],
function (BaseInstagramContentView, InstagramContentTemplate, inherits) {
    
    /**
     * A view for rendering instagram content into an element.
     * @param opts {Object} The set of options to configure this view with (See ContentView).
     * @exports streamhub-sdk/content/views/instagram-content-view
     * @constructor
     */

    var InstagramContentView = function (opts) {
        BaseInstagramContentView.call(this, opts);
    };
    inherits(InstagramContentView, BaseInstagramContentView);
    
    InstagramContentView.prototype.template = InstagramContentTemplate;

    return InstagramContentView;
});

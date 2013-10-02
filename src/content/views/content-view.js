define([
    'streamhub-sdk/content/views/content-view',
    'hgn!streamhub-gallery/content/templates/content',
    'inherits'
], function (BaseContentView, ContentTemplate, inherits) {
    
    /**
     * Defines the base class for all content-views. Handles updates to attachments
     * and loading of images.
     *
     * @param opts {Object} The set of options to configure this view with.
     * @param opts.content {Content} The content object to use when rendering. 
     * @param opts.el {?HTMLElement} The element to render this object in.
     * @fires ContentView#removeContentView.hub
     * @exports streamhub-sdk/content/views/content-view
     * @constructor
     */
    var ContentView = function ContentView (opts) {
        opts = opts || {};
        BaseContentView.call(this, opts);
    };
    inherits(ContentView, BaseContentView);
    
    ContentView.prototype.template = ContentTemplate;

    return ContentView;
});

define([
    'streamhub-sdk/content',
    'streamhub-sdk/content/types/livefyre-content',
    'streamhub-sdk/content/types/livefyre-twitter-content',
    'streamhub-sdk/content/types/livefyre-facebook-content',
    'streamhub-sdk/content/types/livefyre-instagram-content',
    'streamhub-sdk/content/types/twitter-content',
    'streamhub-sdk/content/content-view-factory',
    'streamhub-gallery/content/views/content-view',
    'streamhub-gallery/content/views/tiled-attachment-list-view',
    'streamhub-gallery/content/views/twitter-content-view',
    'streamhub-gallery/content/views/facebook-content-view',
    'streamhub-gallery/content/views/instagram-content-view',
    'streamhub-sdk/content/views/gallery-on-focus-view',
    'inherits'
], function(
    Content,
    LivefyreContent,
    LivefyreTwitterContent,
    LivefyreFacebookContent,
    LivefyreInstagramContent,
    TwitterContent,
    BaseContentViewFactory,
    ContentView,
    TiledAttachmentListView,
    TwitterContentView,
    FacebookContentView,
    InstagramContentView,
    GalleryOnFocusView,
    inherits
) {

    /**
     * A module to create instances of ContentView for a given Content instance.
     * @exports streamhub-sdk/content/content-view-factory
     * @constructor
     */
    var ContentViewFactory = function(opts) {
        opts = opts || {};
        BaseContentViewFactory.call(this, opts);
    };
    inherits(ContentViewFactory, BaseContentViewFactory);

    /**
     * The default registry for Content -> ContentView rendering.
     * Expects entries to always contain a "type" property, and either a view property
     * (the type function itself) or a viewFunction property (a function that returns a
     * type function, useful for conditional view selection.).
     */
    ContentViewFactory.prototype.contentRegistry = [
        { type: LivefyreTwitterContent, view: TwitterContentView },
        { type: LivefyreFacebookContent, view: FacebookContentView },
        { type: LivefyreInstagramContent, view: InstagramContentView },
        { type: TwitterContent, view: TwitterContentView },
        { type: LivefyreContent, view: ContentView },
        { type: Content, view: ContentView }
    ];

    ContentViewFactory.prototype._createAttachmentsView = function (content) {
        var tiledAttachmentListView = new TiledAttachmentListView();
        return new GalleryOnFocusView(tiledAttachmentListView, {
            content: content
        });
    };

    return ContentViewFactory;
});

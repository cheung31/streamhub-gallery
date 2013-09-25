define([
    'streamhub-sdk/content/content-view-factory',
    'hgn!streamhub-sdk/content/templates/twitter',
    'hgn!streamhub-sdk/content/templates/facebook',
    'hgn!streamhub-sdk/content/templates/instagram',
    'hgn!streamhub-sdk/content/templates/content',
    'streamhub-sdk/util'
], function(
    BaseContentViewFactory,
    TwitterContentTemplate,
    FacebookContentTemplate,
    InstagramContentTemplate,
    ContentTemplate,
    util
) {

    /**
     * A module to create instances of ContentView for a given Content instance.
     * @exports streamhub-sdk/content/content-view-factory
     * @constructor
     */
    var ContentViewFactory = function(opts) {
        opts = opts || {};
        BaseContentViewFactory.call(this, opts);
        for (var i=0; i < this.contentRegistry.length; i++) {
            var contentViewMap = this.contentRegistry[i];
            var template = this.contentTemplateRegistry[contentViewMap.view];
            if (!template) {
                continue;
            }
            contentViewMap.view.prototype.template = template;
        }
    };
    util.inherits(ContentViewFactory, BaseContentViewFactory);

    /**
     * The default registry for Content -> ContentView rendering.
     * Expects entries to always contain a "type" property, and either a view property
     * (the type function itself) or a viewFunction property (a function that returns a
     * type function, useful for conditional view selection.).
     */
    ContentViewFactory.prototype.contentTemplateRegistry = {
        TwitterContentView: TwitterContentTemplate,
        FacebookContentView: FacebookContentTemplate,
        InstagramContentView: InstagramContentTemplate,
        ContentView: ContentTemplate
    };

    return ContentViewFactory;
});

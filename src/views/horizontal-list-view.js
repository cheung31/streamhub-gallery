define([
    'streamhub-sdk/views/list-view',
    'streamhub-gallery/content/content-view-factory',
    'text!streamhub-gallery/css/horizontal-list-view.css',
    'streamhub-sdk/debug',
    'inherits'
], function (ListView, HorizontalContentViewFactory, HorizontalListViewCss, debug, inherits) {
    'use strict';

    var log = debug('streamhub-gallery/views/horizontal-list-view');

    var STYLE_EL;

    /**
     * A simple View that displays Content in a horizontal list.
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @exports streamhub-gallery/views/horizontal-list-view
     * @augments streamhub-sdk/views/list-view
     * @constructor
     */
    var HorizontalListView = function (opts) {
        opts = opts || {};
        this._id = 'streamhub-horizontal-list-'+new Date().getTime();
        this._aspectRatio = opts.aspectRatio || 16/9;

        opts.contentViewFactory = new HorizontalContentViewFactory();
        ListView.call(this, opts);

        if (!STYLE_EL) {
            STYLE_EL = $('<style></style>').text(HorizontalListViewCss).prependTo('head');
        }

        var self = this;
        $(window).on('resize', function (e) {
            self._adjustContentSize();
        });
        this._adjustContentSize();
    };
    inherits(HorizontalListView, ListView);

    HorizontalListView.prototype.horizontalListViewClassName = 'streamhub-horizontal-list-view';
    HorizontalListView.prototype.contentContainerClassName = 'content-container';

    /**
     * Set the element for the view to render in.
     * You will probably want to call .render() after this, but not always.
     * @param element {HTMLElement} The element to render this View in
     * @return this
     */
    HorizontalListView.prototype.setElement = function (el) {
        ListView.prototype.setElement.call(this, el);
        this.$el.addClass(this.horizontalListViewClassName).addClass(this._id);
    };

    /**
     * @private
     * Sets appropriate dimensions on each ContentView in the gallery.
     * By default, a ContentViews new dimensions respects the gallery's specified aspect ratio.
     * For content whose intrinsic apsect ratio is 1:1, it will retain a 1:1 aspect ratio.
     * ContentViews with tiled attachments will also retain a 1:1 aspect ratio.
     */
    HorizontalListView.prototype._adjustContentSize = function () {
        if (! this._aspectRatio) {
            return;
        }
        var styleEl = $('style.'+this._id);
        if (styleEl) {
            styleEl.remove();
        }

        styleEl = $('<style class="'+this._id+'"></style>');
        var styles = '';
        var containerHeight = this.$el.height();
        var contentWidth = containerHeight * this._aspectRatio;
        styles = '.'+this.horizontalListViewClassName + ' .'+this.contentContainerClassName + '{ max-width: ' + contentWidth + 'px; }';

        styleEl.html(styles);
        $('head').append(styleEl);
        return styleEl;
    };

    /**
     * Add a piece of Content to the ListView
     *     .createContentView(content)
     *     add newContentView to this.contentViews[]
     *     render the newContentView
     *     insert the newContentView into this.el according to this.comparator
     * @param content {Content} A Content model to add to the ListView
     * @returns the newly created ContentView
     */
    HorizontalListView.prototype.add = function (content) {
        ListView.prototype.add.call(this, content);
    };

    /**
     * @private
     * Insert a contentView into the ListView's .el
     * after being wrapped by a container element.
     * Get insertion index based on this.comparator
     * @param contentView {ContentView} The ContentView's element to insert to the DOM
     */
    HorizontalListView.prototype._insert = function (contentView) {
        var newContentViewIndex,
            $previousEl;

        newContentViewIndex = this.contentViews.indexOf(contentView);

        var $containerEl = $('<div class="' + this.contentContainerClassName + '"></div>');
        contentView.$el.wrap($containerEl);
        var $wrappedEl = contentView.$el.parent();

        if (newContentViewIndex === 0) {
            // Beginning!
            $wrappedEl.prependTo(this.el);
        } else {
            // Find it's previous contentView and insert new contentView after
            $previousEl = this.contentViews[newContentViewIndex - 1].$el;
            $wrappedEl.insertAfter($previousEl.parent('.'+this.contentContainerClassName));
        }
        
        this.$el.css('width', this.contentViews.length * this.contentViews[0].$el.parent().outerWidth(true) + 'px');
    };

    return HorizontalListView;
});

define([
    'streamhub-sdk/views/list-view',
    'streamhub-gallery/content-view-factory',
    'text!streamhub-gallery/css/horizontal-list-view.css',
    'streamhub-sdk/util'
], function (ListView, HorizontalContentViewFactory, HorizontalListViewCss, util) {

    var STYLE_EL;

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
    util.inherits(HorizontalListView, ListView);

    HorizontalListView.prototype.horizontalListViewClassName = 'streamhub-horizontal-list-view';
    HorizontalListView.prototype.contentContainerClassName = 'content-container';

    HorizontalListView.prototype.setElement = function (el) {
        ListView.prototype.setElement.call(this, el);
        this.$el.addClass(this.horizontalListViewClassName).addClass(this._id);
    };

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

    HorizontalListView.prototype.add = function (content) {
        ListView.prototype.add.call(this, content);
    };

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

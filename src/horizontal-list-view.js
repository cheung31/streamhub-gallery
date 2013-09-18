define([
    'streamhub-sdk/views/list-view',
    'streamhub-sdk/util'
], function (ListView, util) {

    var STYLE_EL;
    var CSS = ".streamhub-horizontal-list-view { \
	    position:absolute; \
        height: 100%; \
        overflow-x: scroll; \
        overflow-y: hidden; \
	} \
    .streamhub-horizontal-list-view .content-container { \
        display: inline; \
        float: left; \
        padding: 5px; \
        box-sizing: border-box; \
        -moz-box-sizing: border-box; \
        height: 100%; } \
    .streamhub-horizontal-list-view .content { \
        height: 100%; \
        margin-bottom: 0; }";

    var HorizontalListView = function (opts) {
        opts = opts || {};
        ListView.call(this, opts);

        this._aspectRatio = opts.aspectRatio || 16/9;
        this._id = 'streamhub-horizontal-list-'+new Date().getTime();

        opts.css = (typeof opts.css === 'undefined') ? true : opts.css;
        if (!STYLE_EL && opts.css) {
            STYLE_EL = $('<style></style>').text(CSS).prependTo('head');
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
        this.$el.addClass(this.horizontalListViewClassName);
    };

    HorizontalListView.prototype._adjustContentSize = function () {
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

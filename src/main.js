define([
    'streamhub-gallery/horizontal-list-view',
    'streamhub-sdk/util'
], function (HorizontalListView, util) {

    var STYLE_EL;
    var CSS = ".streamhub-horizontal-list-view.streamhub-gallery-view { \
        position: static; \
        width: 100%; \
        -webkit-perspective: 600px; \
        -moz-perspective: 600px; \
        -ms-perspective: 600px; \
        -o-perspective: 600px; \
        perspective: 600px; } \
    .streamhub-gallery-view .content-container.content-active { \
        z-index: 1; \
        opacity: 1; } \
    .streamhub-gallery-view .content-container { \
        opacity: 0;\
        position: absolute; \
        top: 50%; \
        left: 50%; \
        margin-bottom: 0;  \
        -webkit-transition: -webkit-transform .7s ease, opacity .7s ease, background-color .7s ease; \
        -moz-transition: -moz-transform .7s ease, opacity .7s ease, background-color .7s ease; \
        -ms-transition: -ms-transform .7s ease, opacity .7s ease, background-color .7s ease; \
        -o-transition: -o-transform .7s ease, opacity .7s ease, background-color .7s ease; \
        transition: transform .7s ease, opacity .7s ease, background-color .7s ease; }; "

    var GALLERY_STYLE_EL;
    var GALLERY_CSS = ".content-before { \
        -webkit-transform: translate3d(-9999px, 0, 0); \
        -moz-transform: translate3d(-9999px, 0, 0); \
        -ms-transform: translate3d(-9999px, 0, 0); \
        -o-transform: translate3d(-9999px, 0, 0); \
        transform: translate3d(-9999px, 0, 0); } \
    .content-after { \
        -webkit-transform: translate3d(1920px, 0, 0); \
        -moz-transform: translate3d(1920px, 0, 0); \
        -ms-transform: translate3d(1920px, 0, 0); \
        -o-transform: translate3d(1920px, 0, 0); \
        transform: translate3d(1920px, 0, 0); }";

    var GalleryView = function (opts) {
        opts = opts || {};
        HorizontalListView.call(this, opts);

        this._activeContentView = null;

        opts.css = (typeof opts.css === 'undefined') ? true : opts.css;
        if (!STYLE_EL && opts.css) {
            STYLE_EL = $('<style></style>').text(CSS).prependTo('head');
        }
        if (! GALLERY_STYLE_EL) {
            setTimeout(function () { GALLERY_STYLE_EL = $('<style></style>').text(GALLERY_CSS).appendTo('head'); }, 700);
        }
    };
    util.inherits(GalleryView, HorizontalListView);


    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';

    GalleryView.prototype.setElement = function (el) {
        HorizontalListView.prototype.setElement.call(this, el);
        this.$el.on('click', '.content-container.inactive', function (e) {
            e.preventDefault();
        });
        this.$el.addClass(this.galleryListViewClassName).addClass('classic');
    };

    GalleryView.prototype._insert = function (contentView) {
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

        this.focus();
    };

    GalleryView.prototype.focus = function (opts) {
        if (! this._activeContentView) {
            this._activeContentView = this.contentViews[0];
        }

        opts = opts || {};
        this.$el.find('.content-container.content-active').removeClass('content-active');
        this.$el.find('.content-container.content-before-3').removeClass('content-before-3');
        this.$el.find('.content-container.content-before-2').removeClass('content-before-2');
        this.$el.find('.content-container.content-before-1').removeClass('content-before-1');
        this.$el.find('.content-container.content-after-3').removeClass('content-after-3');
        this.$el.find('.content-container.content-after-2').removeClass('content-after-2');
        this.$el.find('.content-container.content-after-1').removeClass('content-after-1');

        this._activeContentView = opts.contentView ? opts.contentView : this._activeContentView;
        var activeIndex = this.contentViews.indexOf(this._activeContentView);

        var targetContentEl = this.contentViews[activeIndex].$el;
        var targetContainerEl = targetContentEl.parent();
        targetContainerEl.addClass('content-active');
        targetContainerEl.prevAll().addClass('content-before');
        targetContainerEl.nextAll().addClass('content-after');
        var before1 = targetContainerEl.prev().addClass('content-before-1');
        var before2 = before1.prev().addClass('content-before-2');
        var before3 = before2.prev().addClass('content-before-3');
        var after1 = targetContainerEl.next().addClass('content-after-1');
        var after2 = after1.next().addClass('content-after-2');
        var after3 = after2.next().addClass('content-after-3');

        this._adjustContentSize();
    };

    GalleryView.prototype.next = function () {
        var activeIndex = this.contentViews.indexOf(this._activeContentView);
        this.focus({ contentView: this.contentViews[Math.min(activeIndex+1, this.contentViews.length-1)] });
    };

    GalleryView.prototype.prev = function () {
        var activeIndex = this.contentViews.indexOf(this._activeContentView);
        this.focus({ contentView: this.contentViews[activeIndex-1 || 0] });
    };

    GalleryView.prototype._adjustContentSize = function () {
        var styleEl = $('style.'+this._id);
        if (styleEl) {
            styleEl.remove();
        }

        styleEl = $('<style class="'+this._id+'"></style>');
        var styles = '';
        var containerHeight = this.$el.height();
        var contentWidth = containerHeight * this._aspectRatio;
        styles = '.'+this.horizontalListViewClassName + ' .'+this.contentContainerClassName + '{ width: ' + contentWidth + 'px; margin-left: '+ contentWidth/-2 + 'px; margin-top: '+ containerHeight/-2+ 'px; }';

        this._adjustContentSpacing(contentWidth);

        styleEl.html(styles);
        $('head').append(styleEl);
        return styleEl;
    };

    GalleryView.prototype._adjustContentSpacing = function (contentWidth) {
        var transformProperties = [
            'transform',
            '-webkit-transform',
            '-moz-transform',
            '-ms-transform',
            '-o-transform'
        ];

        function getTransformCssObject(value, otherCss) {
            var obj = {};
            otherCss = otherCss || {};
            for (var property in transformProperties) {
                obj[transformProperties[property]] = value;
            }
            return $.extend(otherCss, obj);
        }

        this.$el.find('.content-active').css(
            getTransformCssObject(
                'translate3d(0,0,0)',
                {'opacity': 1}
            )
        );
        this.$el.find('.content-before-1').css(
            getTransformCssObject(
                'translate3d(' + -1 * contentWidth + 'px,0,0)',
                {'opacity': 0.5}
            )
        );
        this.$el.find('.content-before-2').css(
            getTransformCssObject(
                'translate3d(' + -2 * contentWidth + 'px, 0, 0)',
                {'opacity': 0.3}
            )
        );
        this.$el.find('.content-before-3').css(
            getTransformCssObject(
                'translate3d(' + -3 * contentWidth + 'px, 0, 0)',
                {'opacity': 0.1}
            )
        );
        this.$el.find('.content-after-1').css(
            getTransformCssObject(
                'translate3d(' + 1 * contentWidth + 'px,0,0)',
                {'opacity': 0.5}
            )
        );
        this.$el.find('.content-after-2').css(
            getTransformCssObject(
                'translate3d(' + 2 * contentWidth + 'px, 0, 0)',
                {'opacity': 0.3}
            )
        );
        this.$el.find('.content-after-3').css(
            getTransformCssObject(
                'translate3d(' + 3 * contentWidth + 'px, 0, 0)',
                {'opacity': 0.1}
            )
        );
    };

    return GalleryView;
});

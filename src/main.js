define([
    'streamhub-gallery/horizontal-list-view',
    'streamhub-sdk/util'
], function (HorizontalListView, util) {

    var STYLE_EL;
    var CSS = ".streamhub-gallery-view { \
        position: static; \
        width: 100%; \
        overflow: hidden; \
        -webkit-perspective: 600px; \
        -moz-perspective: 600px; \
        -ms-perspective: 600px; \
        -o-perspective: 600px; \
        perspective: 600px; } \
    .streamhub-gallery-view .content-active { \
        z-index: 1; \
        opacity: 1; } \
    .streamhub-gallery-view .content-container { \
        opacity: 0; \
        position: absolute; \
        top: 50%; \
        left: 50%; \
        margin-bottom: 0; \
        -webkit-transition: -webkit-transform 0.7s ease, opacity 0.7s ease, background-color 0.7s ease; \
        -moz-transition: -moz-transform 0.7s ease, opacity 0.7s ease, background-color 0.7s ease; \
        -ms-transition: -ms-transform 0.7s ease, opacity 0.7s ease, background-color 0.7s ease; \
        -o-transition: -o-transform 0.7s ease, opacity 0.7s ease, background-color 0.7s ease; \
        transition: transform 0.7s ease, opacity 0.7s ease, background-color 0.7s ease; }";

    var GALLERY_STYLE_EL;
    var GALLERY_CSS = ".content-before { \
        -webkit-transform: translate(-9999px, 0px); \
        -moz-transform: translate(-9999px, 0px); \
        -ms-transform: translate(-9999px, 0px); \
        -o-transform: translate(-9999px, 0px); \
        transform: translate(-9999px, 0px); } \
    .content-after { \
        -webkit-transform: translate(1920px, 0px); \
        -moz-transform: translate(1920px, 0px); \
        -ms-transform: translate(1920px, 0px); \
        -o-transform: translate(1920px, 0px); \
        transform: translate(1920px, 0px); }";

    var FULLSCREEN_CSS = ".content-before { \
        -webkit-transform: translateX(-980px) rotateY(-72deg) translateX(-1290px); \
        -moz-transform: translateX(-980px) rotateY(-72deg) translateX(-1290px); \
        -ms-transform: translateX(-980px) rotateY(-72deg) translateX(-1290px); \
        -o-transform: translateX(-980px) rotateY(-72deg) translateX(-1290px); \
        transform: translateX(-980px) rotateY(-72deg) translateX(-1290px); } \
    .content-after { \
        -webkit-transform: translateX(980px) rotateY(72deg) translateX(1290px); \
        -moz-transform: translateX(980px) rotateY(72deg) translateX(1290px); \
        -ms-transform: translateX(980px) rotateY(72deg) translateX(1290px); \
        -o-transform: translateX(980px) rotateY(72deg) translateX(1290px); \
        transform: translateX(980px) rotateY(72deg) translateX(1290px); }";

    var GalleryView = function (opts) {
        opts = opts || {};
        this._fullscreen = opts.fullscreen || false;

        HorizontalListView.call(this, opts);

        this._activeContentView = null;

        opts.css = (typeof opts.css === 'undefined') ? true : opts.css;
        if (!STYLE_EL && opts.css) {
            STYLE_EL = $('<style></style>').text(CSS).prependTo('head');
        }
    };
    util.inherits(GalleryView, HorizontalListView);

    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';

    GalleryView.prototype.setElement = function (el) {
        HorizontalListView.prototype.setElement.call(this, el);
        this.$el.on('click', '.content-container.inactive', function (e) {
            e.preventDefault();
        });
        this.$el.addClass(this.galleryListViewClassName);
    };

    GalleryView.prototype._insert = function (contentView) {
        var self = this,
            newContentViewIndex,
            $previousEl;

        contentView.$el.on('click', function (e) {
            self.focus({ contentView: contentView });
        });

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

    GalleryView.prototype.fullscreen = function (off) {
        var contentSize = this._getContentSize();
        off || off === undefined ? this._fullscreenSpacing(contentSize.width): this._slideshowSpacing(contentSize.width);
        this._fullscreen = !!off;
    };

    GalleryView.prototype.focus = function (opts) {
        if (! this._activeContentView) {
            this._activeContentView = this.contentViews[0];
        }

        opts = opts || {};

        var contentContainerEls = this.$el.find('.content-container');
        contentContainerEls.removeClass('content-active')
            .removeClass('content-before-3')
            .removeClass('content-before-2')
            .removeClass('content-before-1')
            .removeClass('content-after-3')
            .removeClass('content-after-2')
            .removeClass('content-after-1')
            .removeClass('content-before')
            .removeClass('content-after')
            .removeAttr('style');

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

    GalleryView.prototype._getContentSize = function () {
        var containerHeight = this.$el.height();
        var contentWidth = Math.min(containerHeight * this._aspectRatio, this.$el.width());
        console.log({ width: contentWidth, height: contentWidth / this._aspectRatio });
        return { width: contentWidth, height: contentWidth / this._aspectRatio };
    };

    GalleryView.prototype._adjustContentSize = function () {
        var styleEl = $('style.'+this._id);
        if (styleEl) {
            styleEl.remove();
        }

        styleEl = $('<style class="'+this._id+'"></style>');
        var styles = '';
        var contentSize = this._getContentSize();
        styles = '.'+this.horizontalListViewClassName + ' .'+this.contentContainerClassName + ' { width: ' + contentSize.width + 'px; height: ' + contentSize.height + 'px; margin-left: '+ contentSize.width/-2 + 'px; margin-top: '+ contentSize.height/-2+ 'px; }';

        this._adjustContentSpacing(contentSize.width);

        styleEl.html(styles);
        $('head').append(styleEl);
        return styleEl;
    };

    function getTransformCssObject(value, otherCss) {
        var transformProperties = [
            'transform',
            '-webkit-transform',
            '-moz-transform',
            '-ms-transform',
            '-o-transform'
        ];
        var obj = {};
        otherCss = otherCss || {};
        for (var property in transformProperties) {
            obj[transformProperties[property]] = value;
        }
        return $.extend(otherCss, obj);
    }

    GalleryView.prototype._adjustContentSpacing = function (contentWidth) {
        this._fullscreen ? this._fullscreenSpacing(contentWidth) : this._slideshowSpacing(contentWidth);
    };

    GalleryView.prototype._slideshowSpacing = function (contentWidth) {
        if (! GALLERY_STYLE_EL) {
            setTimeout(function () { GALLERY_STYLE_EL = $('<style></style>').text(GALLERY_CSS).appendTo('head'); }, 700);
        } else {
            GALLERY_STYLE_EL.remove();
            GALLERY_STYLE_EL = $('<style></style>').text(GALLERY_CSS).appendTo('head');
        }
        this.$el.find('.content-active').css(
            getTransformCssObject(
                'translate(0px,0px)',
                {'opacity': 1}
            )
        );
        this.$el.find('.content-before-1').css(
            getTransformCssObject(
                'translate(' + -1 * contentWidth + 'px,0px)',
                {'opacity': 0.5}
            )
        );
        this.$el.find('.content-before-2').css(
            getTransformCssObject(
                'translate(' + -2 * contentWidth + 'px,0px)',
                {'opacity': 0.3}
            )
        );
        this.$el.find('.content-before-3').css(
            getTransformCssObject(
                'translate(' + -3 * contentWidth + 'px,0px)',
                {'opacity': 0.1}
            )
        );
        this.$el.find('.content-after-1').css(
            getTransformCssObject(
                'translate(' + 1 * contentWidth + 'px,0px)',
                {'opacity': 0.5}
            )
        );
        this.$el.find('.content-after-2').css(
            getTransformCssObject(
                'translate(' + 2 * contentWidth + 'px, 0px)',
                {'opacity': 0.3}
            )
        );
        this.$el.find('.content-after-3').css(
            getTransformCssObject(
                'translate(' + 3 * contentWidth + 'px, 0px)',
                {'opacity': 0.1}
            )
        );
    };

    GalleryView.prototype._fullscreenSpacing = function (contentWidth) {
        if (! GALLERY_STYLE_EL) {
            setTimeout(function () { GALLERY_STYLE_EL = $('<style></style>').text(GALLERY_CSS).appendTo('head'); }, 700);
        } else {
            GALLERY_STYLE_EL.remove();
            GALLERY_STYLE_EL = $('<style></style>').text(FULLSCREEN_CSS).appendTo('head');
        }

        this.$el.find('.content-active').css(
            getTransformCssObject(
                'translate(0px,0px)',
                {'opacity': 1}
            )
        );
        this.$el.find('.content-before-1').css(
            getTransformCssObject(
                'translateX('+ -contentWidth/2 +'px) rotateY(-30deg) translateX('+-contentWidth/2+'px)',
                {'opacity': 0.5}
            )
        );
        this.$el.find('.content-before-2').css(
            getTransformCssObject(
                'translateX(-590px) rotateY(-52deg) translateX(-780px)',
                {'opacity': 0.1}
            )
        );
        this.$el.find('.content-after-1').css(
            getTransformCssObject(
                'translateX('+contentWidth/2+'px) rotateY(30deg) translateX('+contentWidth/2+'px)',
                {'opacity': 0.5}
            )
        );
        this.$el.find('.content-after-2').css(
            getTransformCssObject(
                'translateX(590px) rotateY(52deg) translateX(780px)',
                {'opacity': 0.1}
            )
        );
    };

    return GalleryView;
});

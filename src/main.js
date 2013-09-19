define([
    'streamhub-gallery/horizontal-list-view',
    'text!streamhub-gallery/css/gallery-view.css',
    'hgn!streamhub-gallery/css/theme.css',
    'streamhub-sdk/util'
], function (HorizontalListView, GalleryViewCss, ThemeCssTemplate, util) {

    var STYLE_EL,
        GALLERY_THEME_STYLE_EL = $('<style></style>');

    var GALLERY_CSS = {
        contentBefore: { transform: "translate(-9999px, 0px) scale(0.95)" },
        contentAfter:  { transform: "translate(9999px, 0px) scale(0.95)"}
    };

    var FULLSCREEN_CSS = {
        contentBefore: { transform: "translateX(-980px) rotateY(-72deg) translateX(-1290px)" },
        contentAfter: { transform: "translateX(980px) rotateY(72deg) translateX(1290px)"}
    };

    var GalleryView = function (opts) {
        opts = opts || {};
        opts.modal = false;

        this._fullscreen = opts.fullscreen || false;
        this._activeContentView = null;

        HorizontalListView.call(this, opts);

        if (!STYLE_EL) {
            STYLE_EL = $('<style></style>').text(GalleryViewCss).prependTo('head');
        }
    };
    util.inherits(GalleryView, HorizontalListView);

    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';

    GalleryView.prototype.setElement = function (el) {
        HorizontalListView.prototype.setElement.call(this, el);
        var self = this;

        this.$el.on('focusContent.hub', function (e) {
            var contentEl = $(e.target).hasClass('content') ? e.target : $(e.target).closest('article.content')[0];
            if ($(contentEl).parent().hasClass('content-before') || $(contentEl).parent().hasClass('content-after')) {
                e.stopImmediatePropagation();
            }
        });

        this.$el.on('click', '.content-before, .content-after', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var targetContentView;
            for (var i=0; i < self.contentViews.length; i++) {
                var contentEl = $(e.target).hasClass('content') ? e.target : $(e.target).closest('article.content')[0];
                if (self.contentViews[i].el === contentEl) {
                    targetContentView = self.contentViews[i];
                    break;
                }
            }
            self.focus({ contentView: targetContentView });
        });
        this.$el.addClass(this.galleryListViewClassName);
    };

    GalleryView.prototype._insert = function (contentView) {
        var self = this,
            newContentViewIndex,
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

    GalleryView.prototype.fullscreen = function (off) {
        var contentSize = this._getContentSize();
        off || off === undefined ? this._fullscreenSpacing(contentSize.width): this._slideshowSpacing(contentSize.width);
        this._fullscreen = off === undefined ? true : !!off;
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
        var containerWidth = this.$el.width();
        var contentWidth = Math.min(containerHeight * this._aspectRatio, containerWidth);

        if (contentWidth == containerWidth) {
            contentWidth = contentWidth * 0.8;
        }

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

    GalleryView.prototype._adjustContentSpacing = function (contentWidth) {
        this._fullscreen ? this._fullscreenSpacing(contentWidth) : this._slideshowSpacing(contentWidth);
    };

    GalleryView.prototype._slideshowSpacing = function (contentWidth) {
        GALLERY_CSS.contentBefore1 = {
            transform: 'translate(' + -1 * contentWidth + 'px,0px) scale(0.95)',
            opacity: 0.7
        };
        GALLERY_CSS.contentBefore2 = {
            transform: 'translate(' + -2 * contentWidth + 'px,0px) scale(0.95)',
            opacity: 0.3
        };
        GALLERY_CSS.contentBefore3 = {
            transform: 'translate(' + -3 * contentWidth + 'px,0px) scale(0.95)',
            opacity: 0.1
        };
        GALLERY_CSS.contentAfter1 = {
            transform: 'translate(' + 1 * contentWidth + 'px,0px) scale(0.95)',
            opacity: 0.7
        };
        GALLERY_CSS.contentAfter2 = {
            transform: 'translate(' + 2 * contentWidth + 'px,0px) scale(0.95)',
            opacity: 0.3
        };
        GALLERY_CSS.contentAfter3 = {
            transform: 'translate(' + 3 * contentWidth + 'px,0px) scale(0.95)',
            opacity: 0.1
        };

        var styleInnerHtml = ThemeCssTemplate(GALLERY_CSS);
        styleInnerHtml = styleInnerHtml.replace(new RegExp("\\."+this.galleryListViewClassName, 'g'), '.'+this._id);
        GALLERY_THEME_STYLE_EL.remove();
        GALLERY_THEME_STYLE_EL = $('<style></style>').text(styleInnerHtml).appendTo('head');
    };

    GalleryView.prototype._fullscreenSpacing = function (contentWidth) {
        FULLSCREEN_CSS.contentBefore1 = {
            transform: 'translateX('+ -contentWidth/2 +'px) rotateY(-30deg) translateX('+ -contentWidth/2 +'px)',
            opacity: 0.7
        };
        FULLSCREEN_CSS.contentBefore2 = {
            transform: 'translateX('+ -contentWidth + 'px) rotateY(-52deg) translateX(' + -contentWidth + 'px)',
            opacity: 0.02
        };
        FULLSCREEN_CSS.contentAfter1 = {
            transform: 'translateX('+ contentWidth/2 +'px) rotateY(30deg) translateX('+ contentWidth/2 +'px)',
            opacity: 0.7
        };
        FULLSCREEN_CSS.contentAfter2 = {
            transform: 'translateX('+ contentWidth +'px) rotateY(52deg) translateX('+ contentWidth +'px)',
            opacity: 0.02
        };

        var styleInnerHtml = ThemeCssTemplate(FULLSCREEN_CSS);
        styleInnerHtml = styleInnerHtml.replace(new RegExp("\\."+this.galleryListViewClassName, 'g'), '.'+this._id);
        GALLERY_THEME_STYLE_EL.remove();
        GALLERY_THEME_STYLE_EL = $('<style></style>').text(styleInnerHtml).appendTo('head');
    };

    return GalleryView;
});

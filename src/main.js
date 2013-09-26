define([
    'streamhub-gallery/horizontal-list-view',
    'text!streamhub-gallery/css/gallery-view.css',
    'hgn!streamhub-gallery/css/theme.css',
    'streamhub-sdk/util'
], function (HorizontalListView, GalleryViewCss, ThemeCssTemplate, util) {

    var STYLE_EL,
        GALLERY_THEME_STYLE_EL = $('<style></style>');

    var GALLERY_CSS = {
        contentBefore: {
            transforms: {
                translateX: '-9999px',
                scale: 0.8
            }
        },
        contentAfter: {
            transforms: {
                translateX: '9999px',
                scale: 0.8
            }
        }
    };
    GALLERY_CSS.contentBefore1 = { opacity: 0.7 };
    GALLERY_CSS.contentBefore2 = { opacity: 0.3 };
    GALLERY_CSS.contentBefore3 = { opacity: 0.1 };
    GALLERY_CSS.contentAfter1 = { opacity: 0.7 };
    GALLERY_CSS.contentAfter2 = { opacity: 0.3 };
    GALLERY_CSS.contentAfter3 = { opacity: 0.1 };

    var GalleryView = function (opts) {
        opts = opts || {};
        opts.modal = opts.modal || true;
        opts.aspectRatio = opts.aspectRatio || 16/9;

        this._fullscreen = opts.fullscreen || false;
        this._activeContentView = null;
        HorizontalListView.call(this, opts);

        this._id = this.galleryListViewClassName + '-' + new Date().getTime();

        if (!STYLE_EL) {
            STYLE_EL = $('<style></style>').text(GalleryViewCss).prependTo('head');
        }
    };
    util.inherits(GalleryView, HorizontalListView);

    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';

    GalleryView.prototype.setElement = function (el) {
        this.el = document.createElement('div');
        HorizontalListView.prototype.setElement.call(this, this.el);
        $(this.el).appendTo(el);
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

            var activeIndex = self.contentViews.indexOf(self._activeContentView);
            var targetIndex = self.contentViews.indexOf(targetContentView);
            if (targetIndex > activeIndex) {
                self.next();
            } else if (targetIndex < activeIndex) {
                self.prev();
            }
        });

        this.$el.on('imageLoaded.hub', function (e) {
            self._adjustContentSize();
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
        return;
        var contentSize = this._getContentSize();
        off || off === undefined ? this._fullscreenSpacing(contentSize.width): this._slideshowSpacing(contentSize.width);
        this._fullscreen = off === undefined ? true : !!off;
    };

    GalleryView.prototype.next = function () {
        this.$el.removeClass('animate');
        var originalActiveContentView = this._activeContentView;
        var activeIndex = this.contentViews.indexOf(this._activeContentView);
        var targetContentView = this.contentViews[Math.min(activeIndex+1, this.contentViews.length-1)];
        var newTransforms = $.extend(true, {}, this.focus({
            translate: false,
            contentView: targetContentView
        }));
        this.focus({
            contentView: originalActiveContentView
        });
        this.$el.addClass('animate');
        this.focus({
            translate: newTransforms,
            contentView: targetContentView
        });
    };

    GalleryView.prototype.prev = function () {
        this.$el.removeClass('animate');
        var originalActiveContentView = this._activeContentView;
        var activeIndex = this.contentViews.indexOf(this._activeContentView);
        var targetContentView = this.contentViews[activeIndex-1 || 0];
        var newTransforms = $.extend(true, {}, this.focus({
            translate: false,
            contentView: targetContentView
        }));
        this.focus({
            contentView: originalActiveContentView
        });
        this.$el.addClass('animate');
        this.focus({
            translate: newTransforms,
            contentView: targetContentView
        });
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

        return this._adjustContentSize(opts);
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

    GalleryView.prototype._adjustContentSize = function (opts) {
        var styleEl = $('style.'+this._id);
        if (styleEl) {
            styleEl.remove();
        }

        styleEl = $('<style class="'+this._id+'"></style>');
        var styles = '';
        var contentSize = this._getContentSize();
        styles = '.'+this.horizontalListViewClassName + ' .'+this.contentContainerClassName + ' { width: ' + contentSize.width + 'px; height: ' + contentSize.height + 'px; margin-left: '+ contentSize.width/-2 + 'px; margin-top: '+ contentSize.height/-2+ 'px; }';
        styleEl.html(styles);
        $('head').append(styleEl);

        // Make content with tiled attachments square except when there's a
        // video attachment
        var contentWithImageEls = this.$el.find('.content-with-image');
        for (var i=0; i < contentWithImageEls.length; i++) {
            var contentEl = contentWithImageEls.eq(i).closest('.content-container');
            if (contentEl.find('.content-attachment-video').length) {
                contentEl.find('.content, .content-attachment').css({
                    'padding-bottom': 1/this._aspectRatio * 100 + '%',
                });
            } else {
                contentEl.css({
                    'width': contentSize.height + 'px',
                    'height': contentSize.height + 'px',
                    'margin-left': contentSize.height/-2 + 'px',
                    'margin-top': contentSize.height/-2 + 'px'
                });
            }
        }

        return this._adjustContentSpacing(opts);
    };

    GalleryView.prototype._adjustContentSpacing = function (opts) {
        return this._fullscreen ? this._fullscreenSpacing(opts) : this._slideshowSpacing(opts);
    };

    GalleryView.prototype._slideshowSpacing = function (opts) {
        opts = opts || {};

        if (opts.translate) {
            GALLERY_CSS = opts.translate;
            this._updateStyleEl(opts.translate);
            return;
        }

        var adjacentContentEls = this.$el.find('.content-before, .content-after, .content-active');
        if (!adjacentContentEls.length) {
            return;
        }

        var contentActiveEl = adjacentContentEls.filter('.content-active');
        var activeElSize = contentActiveEl[0].getBoundingClientRect();
        var activeSize = { width: activeElSize.width, height: activeElSize.height }
        var beforeTranslateX = activeSize.width * -1;
        var afterTranslateX = activeSize.width;

        var contentBefore1 = adjacentContentEls.filter('.content-before-1');
        var contentBefore1Width;
        if (contentBefore1.length) {
            contentBefore1Width = contentBefore1[0].getBoundingClientRect().width;
            GALLERY_CSS.contentBefore1.transforms = $.extend({}, GALLERY_CSS.contentBefore.transforms);
            beforeTranslateX = GALLERY_CSS.contentBefore1.transforms.scale ? beforeTranslateX + (activeSize.width - contentBefore1Width)/2  : beforeTranslateX;
            GALLERY_CSS.contentBefore1.transforms.translateX = beforeTranslateX+'px';
        }
        var contentBefore2 = adjacentContentEls.filter('.content-before-2');
        var contentBefore2Width;
        if (contentBefore2.length) {
            contentBefore2Width = contentBefore2[0].getBoundingClientRect().width;
            GALLERY_CSS.contentBefore2.transforms = $.extend({}, GALLERY_CSS.contentBefore.transforms);
            beforeTranslateX = beforeTranslateX - contentBefore1Width - (contentBefore2Width - contentBefore1Width)/2
            GALLERY_CSS.contentBefore2.transforms.translateX = beforeTranslateX+'px';
        }
        var contentBefore3 = adjacentContentEls.filter('.content-before-3');
        var contentBefore3Width;
        if (contentBefore3.length) {
            contentBefore3Width = contentBefore3[0].getBoundingClientRect().width;
            GALLERY_CSS.contentBefore3.transforms = $.extend({}, GALLERY_CSS.contentBefore.transforms);
            beforeTranslateX = beforeTranslateX - contentBefore2Width - (contentBefore3Width - contentBefore2Width)/2
            GALLERY_CSS.contentBefore3.transforms.translateX = beforeTranslateX+'px';
        }
        var contentAfter1 = adjacentContentEls.filter('.content-after-1');
        var contentAfter1Width;
        if (contentAfter1.length) {
            contentAfter1Width = contentAfter1[0].getBoundingClientRect().width;
            GALLERY_CSS.contentAfter1.transforms = $.extend({}, GALLERY_CSS.contentAfter.transforms);
            afterTranslateX = GALLERY_CSS.contentAfter1.transforms.scale ? afterTranslateX - (activeSize.width - contentAfter1Width)/2  : afterTranslateX;
            GALLERY_CSS.contentAfter1.transforms.translateX = afterTranslateX +'px';
        }
        var contentAfter2 = adjacentContentEls.filter('.content-after-2');
        var contentAfter2Width;
        if (contentAfter2.length) {
            contentAfter2Width =  contentAfter2[0].getBoundingClientRect().width;
            GALLERY_CSS.contentAfter2.transforms = $.extend({}, GALLERY_CSS.contentAfter.transforms);
            afterTranslateX = afterTranslateX + contentAfter1Width + (contentAfter2Width - contentAfter1Width)/2
            GALLERY_CSS.contentAfter2.transforms.translateX = afterTranslateX+'px';
        }
        var contentAfter3 = adjacentContentEls.filter('.content-after-3');
        var contentAfter3Width;
        if (contentAfter3.length) {
            contentAfter3Width = contentAfter3[0].getBoundingClientRect().width;
            GALLERY_CSS.contentAfter3.transforms = $.extend({}, GALLERY_CSS.contentAfter.transforms);
            afterTranslateX = afterTranslateX + contentAfter2Width + (contentAfter3Width - contentAfter2Width)/2
            GALLERY_CSS.contentAfter3.transforms.translateX = afterTranslateX+'px';
        }
        this._updateStyleEl(opts.translate);

        return GALLERY_CSS;
    };

    GalleryView.prototype._updateStyleEl = function (translate) {
        translate = translate === undefined ? true : translate;
        for (var style in GALLERY_CSS) {
            var transform = '';
            for (var t in GALLERY_CSS[style].transforms) {
                if (translate || style == 'contentBefore' || style == 'contentAfter' || (!translate && t.indexOf('translate') == -1)) {
                    transform = transform + t + '(' + GALLERY_CSS[style].transforms[t]  + ') ';
                }
            }
            GALLERY_CSS[style].transform = transform;
        }
        var styleInnerHtml = ThemeCssTemplate(GALLERY_CSS);
        var matches = styleInnerHtml.match(new RegExp("(\A|\})\s*(?![^ ~>|]*\.*\{)", 'g'));
        for (var i=0; i < matches.length; i++) {
            var idx = styleInnerHtml.indexOf(matches[i]);
            styleInnerHtml = styleInnerHtml.slice(0, idx) + 
                this._id + styleInnerHtml.slice(idx);
        }

        GALLERY_THEME_STYLE_EL.remove();
        GALLERY_THEME_STYLE_EL = $('<style></style>').text(styleInnerHtml).appendTo('head');
    };

    return GalleryView;
});

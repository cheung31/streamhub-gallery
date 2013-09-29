define([
    'streamhub-gallery/horizontal-list-view',
    'text!streamhub-gallery/css/gallery-view.css',
    'hgn!streamhub-gallery/templates/gallery-view',
    'hgn!streamhub-gallery/css/theme.css',
    'streamhub-sdk/util'
], function (HorizontalListView, GalleryViewCss, GalleryViewTemplate, ThemeCssTemplate, util) {

    var STYLE_EL,
        GALLERY_THEME_STYLE_EL = $('<style></style>');

    var GALLERY_CSS = {
        contentBefore: {
            transforms: {
                translateX: '-9999px',
                scale: 0.45
            }
        },
        contentAfter: {
            transforms: {
                translateX: '9999px',
                scale: 0.45
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

        this._activeContentView = null;
        this._newContentCount = 0;
        HorizontalListView.call(this, opts);

        this._id = this.galleryListViewClassName + '-' + new Date().getTime();

        if (!STYLE_EL) {
            STYLE_EL = $('<style></style>').text(GalleryViewCss).prependTo('head');
        }
    };
    util.inherits(GalleryView, HorizontalListView);

    GalleryView.prototype.template = GalleryViewTemplate;
    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';

    GalleryView.prototype.setElement = function (el) {
        var galleryViewEl = $(this.template());
        this.el = galleryViewEl.filter('.'+this.galleryListViewClassName);
        HorizontalListView.prototype.setElement.call(this, this.el);
        galleryViewEl.appendTo(el);

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
            self.jump(targetContentView);
        });

        $('.streamhub-gallery-view-prev > .streamhub-gallery-view-page-button').on('click', function (e) {
            e.preventDefault();
            self.prev();
        });

        $('.streamhub-gallery-view-next > .streamhub-gallery-view-page-button').on('click', function (e) {
            e.preventDefault();
            self.next();
        });

        $('.streamhub-gallery-view-notification').on('click', function (e) {
            e.preventDefault();
            // Jump to head when the notification is clicked
            self.jump(self.contentViews[0]);
            self._hideNewNotification();
        });

        this.$el.on('imageLoaded.hub', function (e) {
            self._adjustContentSize();
        });
    };

    GalleryView.prototype.add = function (content) {
        var contentView = HorizontalListView.prototype.add.call(this, content);
        // If there is new content and we're not focused at the head, show notification
        if (this.contentViews.indexOf(this._activeContentView) == 0) {
            return;
        }
        this._newContentCount++;
        this._showNewNotification();
        return contentView;
    };

    GalleryView.prototype._showNewNotification = function () {
        var notificationEl = $('.streamhub-gallery-view-notification');
        notificationEl.html(this._newContentCount);
        notificationEl.fadeIn();
    };

    GalleryView.prototype._hideNewNotification = function () {
        var notificationEl = $('.streamhub-gallery-view-notification');
        this._newContentCount = 0;
        notificationEl.fadeOut();
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

    GalleryView.prototype.jump = function (contentView) {
        var contentViewIndex = this.contentViews.indexOf(contentView);
        if (contentViewIndex == 0) {
            newContentCount = 0;
        }
        this.$el.removeClass('animate');
        var originalActiveContentView = this._activeContentView;
        // Apply transforms exclusive of translations to calculate spacing
        var newTransforms = $.extend(true, {}, this.focus({
            translate: false,
            contentView: contentView
        }));
        // Revert to original state of spacing
        this.focus({
            contentView: originalActiveContentView
        });
        // Apply calculated transforms to original state
        var self = this;
        setTimeout(function () {
            self.$el.addClass('animate');
            self.focus({
                translate: newTransforms,
                contentView: contentView
            });
        },1);
    };

    GalleryView.prototype.next = function () {
        var activeIndex = this.contentViews.indexOf(this._activeContentView);
        var targetContentView = this.contentViews[Math.min(activeIndex+1, this.contentViews.length-1)];
        this.jump(targetContentView);
    };

    GalleryView.prototype.prev = function () {
        var activeIndex = this.contentViews.indexOf(this._activeContentView);
        var targetContentView = this.contentViews[activeIndex-1 || 0];
        this.jump(targetContentView);
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
        var containerWidth = this.$el.width();
        var contentHeight = this.$el.height();
        var contentWidth = Math.min(contentHeight * this._aspectRatio, containerWidth);

        if (contentWidth == containerWidth) {
            contentHeight = contentHeight * 0.8;
            contentWidth = contentHeight * this._aspectRatio;
        }

        return { width: contentWidth, height: contentHeight };
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
        return this._slideshowSpacing(opts);
    };

    GalleryView.prototype._slideshowSpacing = function (opts) {
        opts = opts || {};
        var visibleAdjacentContent = 3;

        if (opts.translate) {
            GALLERY_CSS = opts.translate;
            this._updateStyleEl(opts.translate);
            return;
        }

        var adjacentContentEls = this.$el.find('.content-before, .content-after, .content-active');
        if (!adjacentContentEls.length) {
            return;
        }

        var beforeTranslateX = 0;
        var afterTranslateX = 0;
        for (var i=0; i < visibleAdjacentContent; i++) {
            var adjacentIndex = i+1;

            // Before
            var contentBefore = adjacentContentEls.filter('.content-before-'+adjacentIndex);
            var contentBeforeWidth;
            if (contentBefore.length) {
                GALLERY_CSS['contentBefore'+adjacentIndex].transforms = $.extend({}, GALLERY_CSS.contentBefore.transforms);
                contentBeforeWidth = contentBefore[0].getBoundingClientRect().width;
                var previousEl = contentBefore.next();
                var previousWidth = previousEl[0].getBoundingClientRect().width;
                beforeTranslateX = beforeTranslateX - previousWidth - (contentBeforeWidth - previousWidth)/2;
                GALLERY_CSS['contentBefore'+adjacentIndex].transforms.translateX = beforeTranslateX+'px';
            }

            // After
            var contentAfter = adjacentContentEls.filter('.content-after-'+adjacentIndex);
            var contentAfterWidth;
            if (contentAfter.length) {
                GALLERY_CSS['contentAfter'+adjacentIndex].transforms = $.extend({}, GALLERY_CSS.contentAfter.transforms);
                contentAfterWidth = contentAfter[0].getBoundingClientRect().width;
                var previousEl = contentAfter.prev();
                var previousWidth = previousEl[0].getBoundingClientRect().width;
                afterTranslateX = afterTranslateX + previousWidth + (contentAfterWidth - previousWidth)/2
                GALLERY_CSS['contentAfter'+adjacentIndex].transforms.translateX = afterTranslateX+'px';
            }
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

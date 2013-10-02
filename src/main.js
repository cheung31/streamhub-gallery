define([
    'streamhub-sdk/jquery',
    'streamhub-gallery/views/horizontal-list-view',
    'text!streamhub-gallery/css/gallery-view.css',
    'hgn!streamhub-gallery/templates/gallery-view',
    'hgn!streamhub-gallery/css/theme.css',
    'streamhub-sdk/debug',
    'inherits'
], function ($, HorizontalListView, GalleryViewCss, GalleryViewTemplate, themeCssTemplate, debug, inherits) {
    'use strict';

    var log = debug('streamhub-sdk/views/list-view');

    var STYLE_EL,
        GALLERY_THEME_STYLE_EL = $('<style></style>');

    var GALLERY_CSS = {
        contentBefore: {
            transforms: {
                translateX: '-9999px'
            }
        },
        contentAfter: {
            transforms: {
                translateX: '9999px'
            }
        }
    };
    GALLERY_CSS.contentBefore1 = { opacity: 0.7 };
    GALLERY_CSS.contentBefore2 = { opacity: 0.3 };
    GALLERY_CSS.contentBefore3 = { opacity: 0.1 };
    GALLERY_CSS.contentAfter1 = { opacity: 0.7 };
    GALLERY_CSS.contentAfter2 = { opacity: 0.3 };
    GALLERY_CSS.contentAfter3 = { opacity: 0.1 };

    /**
     * A simple View that displays Content in a list (`<ul>` by default).
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.aspectRatio {Number} The element in which to render the streamed content
     * @param opts.thumbnailScale {Number} The scale value of non-focused ContentViews
     * @exports streamhub-gallery
     * @augments streamhub-gallery/views/horizontal-list-view
     * @constructor
     */
    var GalleryView = function (opts) {
        opts = opts || {};
        opts.aspectRatio = opts.aspectRatio || 16/9;

        HorizontalListView.call(this, opts);
        this.$galleryEl = this.$el.find('.'+this.galleryListViewClassName);

        this._activeContentView = null;
        this._newContentCount = 0;
        this._newQueue = this._createMoreStream(opts);
        this._animating = false;
        this._thumbnailScale = opts.thumbnailScale || 0.6;
        GALLERY_CSS.contentAfter.transforms.scale = this._thumbnailScale;
        GALLERY_CSS.contentBefore.transforms.scale = this._thumbnailScale;

        var self = this;
        this._newQueue.on('readable', function () {
            var content;
            while (content = self._newQueue.read()) {
                self.add(content);
            }
        });

        this._id = this.galleryListViewClassName + '-' + new Date().getTime();

        if (!STYLE_EL) {
            STYLE_EL = $('<style></style>').text(GalleryViewCss).prependTo('head');
        }
    };
    inherits(GalleryView, HorizontalListView);

    GalleryView.prototype.template = GalleryViewTemplate;
    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';

    /**
     * @private
     * Called automatically by the Writable base class when .write() is called
     * @param content {Content} Content to display in the ListView
     * @param requestMore {function} A function to call when done writing, so
     *     that _write will be called again with more data
     */
    GalleryView.prototype._write = function (content, requestMore) {
        this._newQueue.write(content);

        // If there is new content and we're not focused at the head, show notification
        if (this.views.indexOf(this._activeContentView) !== 0) {
            this._newContentCount++;
            this._showNewNotification();
        }
        requestMore();
    };

    /**
     * Set the element for the view to render in.
     * You will probably want to call .render() after this, but not always.
     * @param element {HTMLElement} The element to render this View in
     * @return this
     */
    GalleryView.prototype.setElement = function (el) {
        var self = this;
        $(el).on('focusContent.hub', function (e) {
            var contentEl = $(e.target).hasClass('content') ? e.target : $(e.target).closest('article.content')[0];
            if ($(contentEl).parent().hasClass('content-before') || $(contentEl).parent().hasClass('content-after')) {
                e.stopImmediatePropagation();
            }
        });

        $(el).on('click', '.content-before, .content-after', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var targetContentView;
            for (var i=0; i < self.views.length; i++) {
                var contentEl = $(e.target).hasClass('content') ? e.target : $(e.target).closest('article.content')[0];
                if (self.views[i].el === contentEl) {
                    targetContentView = self.views[i];
                    break;
                }
            }
            self.jump(targetContentView);
        });

        $(el).on('imageLoaded.hub', function (e) {
            if (! this._animating) {
                self._adjustContentSize();
            }
        });

        $(el).on('jumpToHead.hub', function (e) {
            self._hideNewNotification();
        });

        $(el).on('click', '.streamhub-gallery-view-notification', function (e) {
            e.preventDefault();
            // Jump to head when the notification is clicked
            self.jump(self.views[0]);
        });

        HorizontalListView.prototype.setElement.call(this, el);
    };

    /**
     * Add a piece of Content to the ListView
     *     .createContentView(content)
     *     add newContentView to this.views[]
     *     render the newContentView
     *     insert the newContentView into this.el according to this.comparator
     * @param content {Content} A Content model to add to the ListView
     * @returns the newly created ContentView
     */
    GalleryView.prototype.add = function (content) {
        var contentView = this.getContentView(content);
        if (contentView) {
            return contentView;
        }

        if (! contentView) {
            contentView = HorizontalListView.prototype.add.call(this, content);
        }

        return contentView;
    };

    /**
     * @private
     * Display the new content notification
     */
    GalleryView.prototype._showNewNotification = function () {
        if (! this._newContentCount) {
            return;
        }
        var notificationEl = this.$el.find('.streamhub-gallery-view-notification');
        notificationEl.find('.streamhub-gallery-view-notification-count').html(
            this._newContentCount < 100 ? this._newContentCount : '99+'
        );
        notificationEl.fadeIn();
    };


    /**
     * @private
     * Hide the new content notification
     */
    GalleryView.prototype._hideNewNotification = function () {
        var notificationEl = $('.streamhub-gallery-view-notification');
        this._newContentCount = 0;
        notificationEl.fadeOut();
    };

    /**
     * @private
     * Insert a contentView into the ListView's .el
     * after being wrapped by a container element.
     * Get insertion index based on this.comparator
     * @param contentView {ContentView} The ContentView's element to insert to the DOM
     */
    GalleryView.prototype._insert = function (contentView) {
        var newContentViewIndex,
            $previousEl;

        newContentViewIndex = this.views.indexOf(contentView);

        var $containerEl = $('<div class="' + this.contentContainerClassName + '"></div>');
        contentView.$el.wrap($containerEl);
        var $wrappedEl = contentView.$el.parent();

        if (newContentViewIndex === 0) {
            // Beginning!
            $wrappedEl.prependTo(this.$galleryEl);
        } else {
            // Find it's previous contentView and insert new contentView after
            $previousEl = this.views[newContentViewIndex - 1].$el;
            $wrappedEl.insertAfter($previousEl.parent('.'+this.contentContainerClassName));
        }

        this.focus();
    };

    /**
     * Focus the gallery view to the specified ContentView
     * @param contentView {ContentView} The ContentView to display as the active content
     */
    GalleryView.prototype.jump = function (contentView) {
        var contentViewIndex = this.views.indexOf(contentView);
        if (contentViewIndex === 0) {
            this.newContentCount = 0;
            this.$el.trigger('jumpToHead.hub');
        } else if (contentViewIndex < this._newContentCount) {
            this._newContentCount -= this._newContentCount - contentViewIndex;
            this._showNewNotification();
        } else if (contentViewIndex >= this.views.length - 3) {
            this.showMore(3);
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
            self._animating = false;
        }, 250);
    };

    /**
     * Focus the gallery view to the ContentView following the currently active ContentView
     */
    GalleryView.prototype.next = function () {
        var activeIndex = this.views.indexOf(this._activeContentView);
        var targetContentView = this.views[Math.min(activeIndex+1, this.views.length-1)];
        this.jump(targetContentView);
    };

    /**
     * Focus the gallery view  to the ContentView preceding the currently active ContentView
     */
    GalleryView.prototype.prev = function () {
        var activeIndex = this.views.indexOf(this._activeContentView);
        var targetContentView = this.views[activeIndex-1 || 0];
        this.jump(targetContentView);
    };

    /**
     * Displays the specified ContentView to be active, or defaults to the first ContentView in the gallery
     * @param opts {Object} A set of options to change the focus of the gallery view with
     * @param opts.contentView {ContentView} The ContentView to be active
     */
    GalleryView.prototype.focus = function (opts) {
        if (! this._activeContentView) {
            this._activeContentView = this.views[0];
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
        var activeIndex = this.views.indexOf(this._activeContentView);

        var targetContentEl = this.views[activeIndex].$el;
        var targetContainerEl = targetContentEl.parent();
        targetContainerEl.addClass('content-active');
        targetContainerEl.prevAll().addClass('content-before');
        targetContainerEl.nextAll().addClass('content-after');
        var before1 = targetContainerEl.prev().addClass('content-before-1');
        var before2 = before1.prev().addClass('content-before-2');
        before2.prev().addClass('content-before-3');
        var after1 = targetContainerEl.next().addClass('content-after-1');
        var after2 = after1.next().addClass('content-after-2');
        after2.next().addClass('content-after-3');

        return this._adjustContentSize(opts);
    };

    /**
     * @private
     * Calculates an appropriate size of a ContentView that respects 
     * the specified aspect ratio
     */
    GalleryView.prototype._getContentSize = function () {
        var containerWidth = this.$el.width();
        var contentHeight = this.$el.height();
        var contentWidth = Math.min(contentHeight * this._aspectRatio, containerWidth);

        if (contentWidth/containerWidth <= 0.9) {
            contentHeight = contentHeight * 0.95;
            contentWidth = contentHeight * this._aspectRatio;
        } else if (contentWidth/containerWidth <= 0.95) {
            contentHeight = contentHeight * 0.8;
            contentWidth = contentHeight * this._aspectRatio;
        } else {
            contentHeight = contentHeight * 0.5;
            contentWidth = contentHeight * this._aspectRatio;
        }

        return { width: contentWidth, height: contentHeight };
    };

    /**
     * @private
     * Sets appropriate dimensions on each ContentView in the gallery.
     * By default, a ContentViews new dimensions respects the gallery's specified aspect ratio.
     * For content whose intrinsic apsect ratio is 1:1, it will retain a 1:1 aspect ratio.
     * ContentViews with tiled attachments will also retain a 1:1 aspect ratio.
     */
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
                    'padding-bottom': 1/this._aspectRatio * 100 + '%'
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

        return this._relayout(opts);
    };

    /**
     * @private
     * Triggers a resizing/respacing of ContentViews
     */
    GalleryView.prototype._relayout = function (opts) {
        this._animating = true;
        return this._slideshowSpacing(opts);
    };

    /**
     * @private
     * Applies correct spacing for all ContentViews
     */
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
            var previousEl;
            var previousWidth;
            if (contentBefore.length) {
                GALLERY_CSS['contentBefore'+adjacentIndex].transforms = $.extend({}, GALLERY_CSS.contentBefore.transforms);
                contentBeforeWidth = contentBefore[0].getBoundingClientRect().width;
                previousEl = contentBefore.next();
                previousWidth = previousEl[0].getBoundingClientRect().width;
                beforeTranslateX = beforeTranslateX - previousWidth - (contentBeforeWidth - previousWidth)/2;
                GALLERY_CSS['contentBefore'+adjacentIndex].transforms.translateX = beforeTranslateX+'px';
            }

            // After
            var contentAfter = adjacentContentEls.filter('.content-after-'+adjacentIndex);
            var contentAfterWidth;
            if (contentAfter.length) {
                GALLERY_CSS['contentAfter'+adjacentIndex].transforms = $.extend({}, GALLERY_CSS.contentAfter.transforms);
                contentAfterWidth = contentAfter[0].getBoundingClientRect().width;
                previousEl = contentAfter.prev();
                previousWidth = previousEl[0].getBoundingClientRect().width;
                afterTranslateX = afterTranslateX + previousWidth + (contentAfterWidth - previousWidth)/2;
                GALLERY_CSS['contentAfter'+adjacentIndex].transforms.translateX = afterTranslateX+'px';
            }
        }

        this._updateStyleEl(opts.translate);

        return GALLERY_CSS;
    };

    /**
     * @private
     * Replaces a style element that determines the spacing, and animations when 
     * the gallery changes focus
     */
    GalleryView.prototype._updateStyleEl = function (translate) {
        translate = translate === undefined ? true : translate;
        for (var style in GALLERY_CSS) {
            if (GALLERY_CSS.hasOwnProperty(style)) {
                var transform = '';
                for (var t in GALLERY_CSS[style].transforms) {
                    if (translate || style === 'contentBefore' || style === 'contentAfter' || (!translate && t.indexOf('translate') === -1)) {
                        transform = transform + t + '(' + GALLERY_CSS[style].transforms[t]  + ') ';
                    }
                }
                GALLERY_CSS[style].transform = transform;
            }
        }
        var styleInnerHtml = themeCssTemplate(GALLERY_CSS);
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

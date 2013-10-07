define([
    'streamhub-sdk/jquery',
    'streamhub-gallery/animators/animator',
    'streamhub-gallery/views/horizontal-list-view',
    'text!streamhub-gallery/css/gallery-view.css',
    'hgn!streamhub-gallery/templates/gallery-view',
    'streamhub-sdk/debug',
    'inherits'
], function ($, Animator, HorizontalListView, GalleryViewCss, GalleryViewTemplate, debug, inherits) {
    'use strict';

    var log = debug('streamhub-sdk/views/list-view');

    var STYLE_EL;

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

        this._animator = new Animator(this);

        HorizontalListView.call(this, opts);
        this.$galleryEl = this.$el.find('.'+this.galleryListViewClassName);

        this._activeContentView = null;
        this._newContentCount = 0;
        this._newQueue = this._createMoreStream(opts);
        this._jumping = false;

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

    GalleryView.prototype.switchAnimator = function (animator) {
        this._animator.destroy();
        animator.setView(this);
        this._animator = animator;
        this.jumpTo();
    };

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
            self.jumpTo(targetContentView);
        });

        $(el).on('imageLoaded.hub', function (e) {
            self._adjustSquareContentSize();
            if (!this._jumping) {
                self._animator.animate();
            }
        });

        $(el).on('jumpToHead.hub', function (e) {
            self._hideNewNotification();
        });

        $(el).on('click', '.streamhub-gallery-view-notification', function (e) {
            e.preventDefault();
            // Jump to head when the notification is clicked
            self.jumpTo(self.views[0]);
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

    GalleryView.prototype.remove = function (content) {
        var contentView = this.getContentView(content);
        if (this._activeContentView === contentView) {
            this._activeContentView = null;
        }
        return HorizontalListView.prototype.remove.call(this, content);
    };

    /**
     * @private
     * Display the new content notification
     */
    GalleryView.prototype._showNewNotification = function () {
        if (this._newContentCount < 1) {
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

        this.$el.removeClass('animate');
        this._focus();
        this._animator.animate();
    };

    /**
     * Focus the gallery view to the specified ContentView
     * @param contentView {ContentView} The ContentView to display as the active content
     */
    GalleryView.prototype.jumpTo = function (contentView) {
        if (this._jumping) {
            return;
        }
        this._jumping = true;

        var contentViewIndex = this.views.indexOf(contentView);
        if (contentViewIndex === 0) {
            this.newContentCount = 0;
            this.$el.trigger('jumpToHead.hub');
        } else if (contentViewIndex < this._newContentCount) {
            this._newContentCount -= this._newContentCount - contentViewIndex;
            this._showNewNotification();
        } else if (contentViewIndex >= this.views.length - 3) {
            this.showMore(5);
        }

        var originalActiveContentView = this._activeContentView;

        this.$el.removeClass('animate');
        this._focus(contentView);
        var newTransforms = this._animator.animate({ translate: false, seek: true });

        this.$el.removeClass('animate');
        this._focus(originalActiveContentView);
        this._animator.animate({ seek: true });

        this.$el.addClass('animate');
        this._focus(contentView);
        this._animator.animate({ transforms: newTransforms });

        this._jumping = false;
    };

    /**
     * Focus the gallery view to the ContentView following the currently active ContentView
     */
    GalleryView.prototype.next = function () {
        var activeIndex = this.views.indexOf(this._activeContentView);
        var targetContentView = this.views[Math.min(activeIndex+1, this.views.length-1)];
        this.jumpTo(targetContentView);
    };

    /**
     * Focus the gallery view  to the ContentView preceding the currently active ContentView
     */
    GalleryView.prototype.prev = function () {
        var activeIndex = this.views.indexOf(this._activeContentView);
        var targetContentView = this.views[activeIndex-1 || 0];
        this.jumpTo(targetContentView);
    };

    /**
     * Displays the specified ContentView to be active, or defaults to the first ContentView in the gallery
     * @param opts {Object} A set of options to change the focus of the gallery view with
     * @param opts.contentView {ContentView} The ContentView to be active
     */
    GalleryView.prototype._focus = function (contentView) {
        if (! this.views.length) {
            return;
        }

        if (! this._activeContentView) {
            this._activeContentView = this.views[0];
        }

        // Shift active and adjacent
        var contentContainerEls = this.$el.find('.content-container');
        contentContainerEls.removeClass('content-active')
            .removeClass('content-before-3')
            .removeClass('content-before-2')
            .removeClass('content-before-1')
            .removeClass('content-after-3')
            .removeClass('content-after-2')
            .removeClass('content-after-1')
            .removeClass('content-before')
            .removeClass('content-after');

        this._activeContentView = contentView ? contentView : this._activeContentView;
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

        this._adjustContentSize();
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

    GalleryView.prototype._handleResize = function (e) {
        this._adjustContentSize();
        this._animator.animate();
    };

    /**
     * @private
     * Sets appropriate dimensions on each ContentView in the gallery.
     * By default, a ContentViews new dimensions respects the gallery's specified aspect ratio.
     * For content whose intrinsic apsect ratio is 1:1, it will retain a 1:1 aspect ratio.
     * ContentViews with tiled attachments will also retain a 1:1 aspect ratio.
     */
    GalleryView.prototype._adjustContentSize = function () {
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

        this._adjustSquareContentSize();
    };

    GalleryView.prototype._adjustSquareContentSize = function () {
        // Make content with tiled attachments square except when there's a
        // video attachment
        var contentSize = this._getContentSize();
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
    };

    return GalleryView;
});

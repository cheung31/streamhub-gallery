define([
    'streamhub-sdk/jquery',
    'hammerjs',
    'streamhub-gallery/animators/animator',
    'streamhub-gallery/views/horizontal-list-view',
    'text!streamhub-gallery/css/gallery-view.css',
    'hgn!streamhub-gallery/templates/gallery-view',
    'streamhub-sdk/debug',
    'inherits'
], function ($, Hammer, Animator, HorizontalListView, GalleryViewCss, GalleryViewTemplate, debug, inherits) {
    'use strict';

    var log = debug('streamhub-sdk/views/list-view');

    var STYLE_EL;

    /**
     * A simple View that displays Content in a list (`<ul>` by default).
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.aspectRatio {Number} The element in which to render the streamed content
     * @param opts.numVisible {Number} The number of adjacent content items visible
     * @param opts.animator {Animator} An instance of Animator that manages animating adjacent content
     * @exports streamhub-gallery
     * @augments streamhub-gallery/views/horizontal-list-view
     * @constructor
     */
    var GalleryView = function (opts) {
        opts = opts || {};
        opts.aspectRatio = opts.aspectRatio || 16/9;
        this._numVisible = opts.numVisible || 3;
        opts.more = opts.more || this._createMoreStream({ initial: this._numVisible * 2 })

        this._id = this.galleryListViewClassName + '-' + new Date().getTime();
        this._activeContentView = null;
        this._newContentCount = 0;
        this._newQueue = this._createMoreStream(opts);
        this._jumping = false; // Whether a jumpTo is being performed
        this._forward = true; // Direction of paging
        this._isFocused = false; // Whether the gallery view is focused
        this._animator = opts.animator || new Animator(this);

        HorizontalListView.call(this, opts);
        this.$galleryEl = this.$el.find('.'+this.galleryListViewClassName);

        var self = this;
        this._newQueue.on('readable', function () {
            var content;
            while (content = self._newQueue.read()) {
                self.add(content);
            }
        });

        if (!STYLE_EL) {
            STYLE_EL = $('<style></style>').text(GalleryViewCss).prependTo('head');
        }
    };
    inherits(GalleryView, HorizontalListView);

    GalleryView.prototype.template = GalleryViewTemplate;
    GalleryView.prototype.galleryListViewClassName = 'streamhub-gallery-view';


    /**
     * Switch the Animator instance that the GalleryView uses the animate 
     * jumping between content
     * @param animator {Animator} The animator instance to use for animating jumping
     */
    GalleryView.prototype.switchAnimator = function (animator) {
        this._animator.destroy();
        animator.setView(this);
        this._animator = animator;
        this.jumpTo(this._activeContentView);
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
            var imageContentEl = $(e.target).closest('.content');
            var tiledAttachmentsEl = imageContentEl.find('.content-attachments-tiled');
            if (tiledAttachmentsEl.length === 1) {
                imageContentEl.fadeIn();

                self._adjustSquareContentSize();
                if (!self._jumping) {
                    self._animator.animate();
                }
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

        $(el).on('webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd', function (e) {
            var activeIndex = self.views.indexOf(self._activeContentView);
            if (self.views.length-1 - activeIndex < self._numVisible) {
                self.showMore(self._numVisible * 2);
            }
        });

        $(el).on('removeContentView.hub', function(e, content) {
            $(e.target).closest('.content-container').remove();
            self.remove(content);
        });

        $('body').on('mouseover', '.'+this.galleryListViewClassName, function (e) {
            self._isFocused = true;
        });
        $('body').on('mouseout', '.'+this.galleryListViewClassName, function (e) {
            self._isFocused = false;
        });

        self._bindKeyDown();

        // Swipe
        Hammer(el, { drag_block_vertical: true }).on('dragleft swipeleft', function (e) {
            self.next();
        });

        Hammer(el, { drag_block_vertical: true }).on('dragright swiperight', function (e) {
            self.prev();
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

        if (contentView.attachmentsView.tileableCount() > 0) {
            contentView.$el.hide();
        }

        return contentView;
    };

    /**
     * Remove a piece of Content from the ListView
     * If content to remove is associated to the GalleryView's active content view
     * unset the reference
     * @param content {Content} A Content model to add to the ListView
     * @returns the newly created ContentView
     */
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
     * If the inserted contentView is visible, invoke the animation flow
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
        var activeContentViewIndex = this.views.indexOf(this._activeContentView);
        // Only animate newly inserted items if it will be visible
        if (newContentViewIndex >= Math.max(0, activeContentViewIndex-this._numVisible) && newContentViewIndex <= activeContentViewIndex+this._numVisible) {
            this._animator.animate();
        }
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
        } 

        var activeIndex = this.views.indexOf(this._activeContentView);
        if (contentViewIndex < activeIndex) {
            this._forward = false;
        } else if (contentViewIndex > activeIndex) {
            this._forward = true;
        }

        var originalActiveContentView = this._activeContentView;

        // Seek to the target content view. This allows the 
        // spacing between adjacent content views to be computed.
        // The spacing is stored in an Object represented in CSS transform
        // functions by the animator
        this.$el.removeClass('animate');
        this._focus(contentView);
        var newTransforms = this._animator.animate({ translate: false, seek: true });

        // Revert to the originally active content view via seek.
        // Using the previously computed transforms, we can now
        // animate to the target content view.
        this.$el.removeClass('animate');
        this._focus(originalActiveContentView);
        this._animator.animate({ seek: true });

        // Animate to the target content view with previously computed transforms.
        this.$el.addClass('animate');
        this._focus(contentView);
        this._animator.animate({ transforms: newTransforms });

        var self = this;
        setTimeout(function () {
            self._jumping = false;
            self._bindKeyDown();
        }, 500);
    };

    /**
     * @private
     * Binds an event handler to the keydown event
     * Event handler handles left/right arrow keys, and jumps to
     * previous/next content respectively.
     */
    GalleryView.prototype._bindKeyDown = function () {
        var self = this;
        $(window).one('keydown', function (e) {
            if (self._isFocused) {
                if (e.keyCode == 37) {
                    self.prev();
                } else if (e.keyCode == 39) {
                    self.next();
                }
            }
        });
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
     * @private
     * Sets the specified ContentView to be active, or defaults to the first ContentView in the gallery
     * Updates class names for visible content relative to the active ContentView
     * @param contentView {ContentView} The ContentView to be active
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
            .removeClass('content-before')
            .removeClass('content-after');
        for (var i=0; i < this._numVisible; i++) {
            var adjacentIndex = i+1;
            contentContainerEls.removeClass('content-before-'+adjacentIndex);
            contentContainerEls.removeClass('content-after-'+adjacentIndex);
        }

        this._activeContentView = contentView ? contentView : this._activeContentView;
        var activeIndex = this.views.indexOf(this._activeContentView);

        var targetContentEl = this.views[activeIndex].$el;
        var targetContainerEl = targetContentEl.parent();
        targetContainerEl.addClass('content-active');
        targetContainerEl.prevAll().addClass('content-before');
        targetContainerEl.nextAll().addClass('content-after');

        var beforeEl = targetContainerEl,
            afterEl = targetContainerEl;
        for (var i=0; i < this._numVisible; i++) {
            var adjacentIndex = i+1;
            beforeEl = beforeEl.prev();
            beforeEl.addClass('content-before-'+adjacentIndex);
            afterEl = afterEl.next();
            afterEl.addClass('content-after-'+adjacentIndex);
        }

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


    /**
     * @private
     * Finds content that is intrinsically 1:1 ratio. For the most part, these
     * content will be associated with ContentViews that have tiled attachments
     */
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

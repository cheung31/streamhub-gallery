define([
    'streamhub-sdk/content/views/tiled-attachment-list-view',
    'hgn!streamhub-sdk/content/templates/tiled-attachment-list',
    'inherits'],
function (BaseTiledAttachmentListView, TiledAttachmentListTemplate, inherits) {
    'use strict';

    
    /**
     * A simple View that displays Content in a list (`<ul>` by default).
     *
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.content {Content} The content instance with which to display its attachments
     * @fires TiledAttachmentListView#focusContent.hub
     * @exports streamhub-sdk/views/tiled-attachment-list-view
     * @constructor
     */
    var TiledAttachmentListView = function (opts) {
        BaseTiledAttachmentListView.apply(this, arguments);
    };
    inherits(TiledAttachmentListView, BaseTiledAttachmentListView);

    /**
     * Retiles all attachments of the content 
     */
    TiledAttachmentListView.prototype.retile = function () {
        if ( ! this.el) {
            return;
        }
        var tiledAttachmentsEl = this.$el.find(this.tiledAttachmentsSelector);

        // Add classes to make thumbnails tile
        var attachmentsCount = this.tileableCount(this.oembedViews);
        tiledAttachmentsEl
            .removeClass('content-attachments-1')
            .removeClass('content-attachments-2')
            .removeClass('content-attachments-3')
            .removeClass('content-attachments-4');
        if (attachmentsCount && attachmentsCount <= 4) {
            // Only tile for <= 4 photo or video attachments
            tiledAttachmentsEl.addClass('content-attachments-' + attachmentsCount);
        }
        tiledAttachmentsEl.find(this.contentAttachmentSelector).addClass(this.squareTileClassName);
        if (attachmentsCount === 3) {
            tiledAttachmentsEl.find(this.contentAttachmentSelector + ':first')
                .removeClass(this.squareTileClassName)
                .addClass(this.horizontalTileClassName);
        } else if (attachmentsCount === 2 || attachmentsCount > 4) {
debugger;
            tiledAttachmentsEl.find(this.contentAttachmentSelector)
                .removeClass(this.squareTileClassName)
                .addClass(this.horizontalTileClassName);
        } else {
            tiledAttachmentsEl.find(this.contentAttachmentSelector)
                .removeClass(this.horizontalTileClassName)
                .addClass(this.squareTileClassName);
        }
    };

    return TiledAttachmentListView;
});

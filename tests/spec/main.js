define([
    'streamhub-gallery',
    'streamhub-sdk/content',
    'jasmine',
    'jasmine-jquery'
], function (GalleryView, Content) {

    describe('A GalleryView', function () {

        // construction behavior
        describe('can be constructed', function() {
            it ("with no options", function () {
                var view = new GalleryView();
                expect(view).toBeDefined();
            });

            it("accepts the opts.modal option", function () {
                var view = new GalleryView({ modal: true });
                expect(view).toBeDefined();
            });

            it("renders itself", function () {
                spyOn(GalleryView.prototype, 'render');
                var view = new GalleryView({ modal: true });
                expect(GalleryView.prototype.render).toHaveBeenCalled();
            });
        });

        // setElement
        describe('can set the HTML element in which to be rendered with the #setElement method', function () {

            var view,
                myEl;

            beforeEach(function () {
                view = new GalleryView();
                myEl = document.createElement('div');
                myEl.setAttribute('id', 'mycooldiv');
                view.setElement(myEl);
            });

            it('.el is the element that we are setting', function () {
                expect(view.el).toBe(myEl);
            });

            it('has an event listener on the #focusContent.hub event', function () {
                expect($(view.el)).toHandle('focusContent.hub');
            });

            it('has an event listener on the #click event', function () {
                expect($(view.el)).toHandle('click');
            });
        });

        // render
        describe('renders the view', function () {
            var view;
            view = new GalleryView();

            it('appends a child element with class "streamhub-gallery-view"', function () {
                expect($(view.el).find('.streamhub-gallery-view')).toHaveClass('streamhub-gallery-view');
            });

            it('appends a child element with class "streamhub-gallery-view-notification"', function () {
                expect($(view.el).find('.streamhub-gallery-view-notification')).toHaveClass('streamhub-gallery-view-notification');
            });
        });

        // add
        describe('can have content items added to it', function () {

            var view,
                myEl,
                content = new Content({ body: "this is some dude's comment" });

            beforeEach(function () {
                view = new GalleryView();
            });

            it('sets the _activeContentView when the first content item is added to the Gallery View', function () {
                view.add(content);
                expect(view._activeContentView).toBeDefined();
            });
        });

        // focus a content item
        describe('can focus a content item', function () {

            var view,
                myEl,
                content = new Content({ body: "this is some dude's comment" });

            beforeEach(function () {
                view = new GalleryView();
                view.add(content);
            });

            it('adds the "content-active" class name to the focused content view\'s parent element', function () {
                view.focus();
                expect($(view._activeContentView.el).parent()).toHaveClass('content-active');
            });

            it('adds "content-before" classes to previous siblings.', function () {
                var content1 = new Content();
                view.add(content1);
                var content2 = new Content();
                view.add(content2);
                var content3 = new Content();
                view.add(content3);

                view.focus({ contentView: view.contentViews[view.contentViews.length-1] });
                expect($(view.contentViews[0].el).parent()).toHaveClass('content-before');
                expect($(view.contentViews[1].el).parent()).toHaveClass('content-before');
                expect($(view.contentViews[2].el).parent()).toHaveClass('content-before');
            });

            it('adds "content-after" classes to next siblings.', function () {
                var content1 = new Content();
                view.add(content1);
                var content2 = new Content();
                view.add(content2);
                var content3 = new Content();
                view.add(content3);

                view.focus({ contentView: view.contentViews[0] });
                expect($(view.contentViews[1].el).parent()).toHaveClass('content-after');
                expect($(view.contentViews[2].el).parent()).toHaveClass('content-after');
                expect($(view.contentViews[3].el).parent()).toHaveClass('content-after');
            });

            it('calls the ._adjustContentSize method', function () {
                spyOn(view, '_adjustContentSize');
                view.focus();
                expect(view._adjustContentSize).toHaveBeenCalled();
            });
        });

    });
 
});

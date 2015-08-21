define('km/resizable', ['jquery', 'km/dragdrop'], function ($, DragDrop) {

    var Resizable = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            zoom:true,
            scale: false,
            border: {
                left: true,
                top: true,
                right: true,
                bottom: true
            }
        }, options);
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //缩放参数
        this.params = { left: 0, top: 0, width: 0, height: 0, ratio: 1 };
        this.moving = false;
        this.init();
    };

    Resizable.prototype.init = function () {
        var html = [];
        html.push('<div class="k-resizable-handle k-resizable-handle-left" role="resizable"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-top" role="resizable"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-right" role="resizable"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-bottom" role="resizable"></div>');
        html.push('<div class="k-resizable-handle-minbar" role="resizable"></div>');
        this.$elm.addClass('k-resizable-container').append(html.join(''));
        this.$leftHandle = this.$elm.find('.k-resizable-handle-left');
        this.$topHandle = this.$elm.find('.k-resizable-handle-top');
        this.$rightHandle = this.$elm.find('.k-resizable-handle-right');
        this.$bottomHandle = this.$elm.find('.k-resizable-handle-bottom');
        this.$minbar = this.$elm.find('.k-resizable-handle-minbar');
        this.$doc = $(document);

        if (this.options.border.left) {
            this.$leftHandle.show();
        }

        if (this.options.border.top) {
            this.$topHandle.show();
        }

        if (this.options.border.right) {
            this.$rightHandle.show();
        }

        if (this.options.border.bottom) {
            this.$bottomHandle.show();
        }

        if (this.options.zoom) {
            this.$minbar.show();
        }

        this.watch();
    };

    Resizable.prototype.watch = function () {
        var self = this;

        this.$elm.on('mousedown.resizable', '[role=resizable]', function (e) {
            var $el = $(this);
            self.params.top = self.$elm.position().top;
            self.params.left = self.$elm.position().left;
            self.params.width = self.$elm.width();
            self.params.height = self.$elm.height();
            self.params.ratio = self.params.width >= self.params.height ? self.params.width / self.params.height : self.params.height / self.params.width;
            e.stopPropagation();
            e.preventDefault();
            document.onselectstart = function () { return false };
            self.start(e,$el);
        });

        
    };

    Resizable.prototype.start = function (e, $handle) {
        var self = this;

        this.$doc.on('mousemove', function (e) {
            self.move(e)
        }).on('mouseup', function () {
            self.$doc.off();
        });


        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - this.$elm.position().left;
        this.offset.y = mouseCoord.y - this.$elm.position().top;


        this.moving = true;


        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if ($handle[0].setCapture) {
            $handle[0].setCapture();
        }

        return false;
    };

    Resizable.prototype.move = function (e) {
        
        var mouseCoord = this.getMouseCoord(e);
        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };

        console.log(mouseCoord)

    };

    Resizable.prototype.stop = function () {
        this.moving = false;
    };

    Resizable.prototype.getMouseCoord = function (e) {
        return {
            x: e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft,
            y: e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop
        };
    };

    return Resizable;

});
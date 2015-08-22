define('km/resizable', ['jquery'], function ($) {

    var Resizable = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            minBar: false,
            scale: false,
            minWidth: 100,
            minHeight: 100,
            border: {
                left: true,
                top: true,
                right: true,
                bottom: true
            }
        }, options);

        //原来坐标
        this.originalCoord = { x: 0, y: 0 };
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //缩放参数
        this.resizeParams = { left: 0, top: 0, width: 0, height: 0, ratio: 1, type: 'bottom' };
        this.moving = false;
        this.minWidth = this.options.minWidth;
        this.minHeight = this.options.minHeight;
        this._event = {
            move:$.noop
        };
        this.init();
    };

    Resizable.prototype.init = function () {
        var html = [];
        html.push('<div class="k-resizable-handle k-resizable-handle-left" role="resizable" data-type="left"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-top" role="resizable" data-type="top"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-right" role="resizable" data-type="right"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-bottom" role="resizable" data-type="bottom"></div>');
        html.push('<div class="k-resizable-handle-minbar" role="resizable" data-type="bottomRight"></div>');
        this.$elm.addClass('k-resizable-container').append(html.join(''));
        this.$leftHandle = this.$elm.find('.k-resizable-handle-left');
        this.$topHandle = this.$elm.find('.k-resizable-handle-top');
        this.$rightHandle = this.$elm.find('.k-resizable-handle-right');
        this.$bottomHandle = this.$elm.find('.k-resizable-handle-bottom');
        this.$minbar = this.$elm.find('.k-resizable-handle-minbar');
        this.$doc = $(document);
        this.$win = $(window);

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

        if (this.options.minBar) {
            this.$minbar.show();
        }

        this.watch();
    };

    Resizable.prototype.watch = function () {
        var self = this;

        this.$elm.on('mousedown.resizable', '[role=resizable]', function (e) {
            var $el = $(this);
            self.resizeParams.top = parseInt(self.$elm.offset().top);
            self.resizeParams.left = self.$elm.offset().left;
            self.resizeParams.width = parseInt(self.$elm.outerWidth(true));
            self.resizeParams.height = parseInt(self.$elm.outerHeight(true));
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width;
            self.resizeParams.type = $el.attr('data-type');
            e.stopPropagation();
            e.preventDefault();
            document.onselectstart = function () { return false };
            self.start(e, $el);
        });


    };

    Resizable.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
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
        this.offset.x = mouseCoord.x - this.$elm.offset().left;
        this.offset.y = mouseCoord.y - this.$elm.offset().top;

        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;


        this.moving = true;


        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if ($handle[0].setCapture) {
            $handle[0].setCapture();
        }

        return false;
    };

    Resizable.prototype.move = function (e) {

        var mouseCoord = this.getMouseCoord(e),
            moveCoord = {
                x: parseInt(mouseCoord.x - this.offset.x),
                y: parseInt(mouseCoord.y - this.offset.y)
            },
            css = {},
            resizeParams = this.resizeParams,
            $range = this.options.$range,
            rw, rh;

        if ($range) {
            rw = $range.width();
            rh = $range.height();
        } else {
            rw = this.$win.width() + this.$doc.scrollLeft();
            rh = this.$win.height() + this.$doc.scrollTop();
        }

        switch (this.resizeParams.type) {
            case 'left':
                css.top=resizeParams.top;
                css.height=resizeParams.height;
                if (moveCoord.x <= 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                } else {
                    css.left = moveCoord.x;
                    css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                    css.left = resizeParams.left + (resizeParams.width - css.width);
                }
                break;
            case 'top':
                css.top = moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);

                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                    css.top = resizeParams.top + (resizeParams.height - css.height);
                }

                if (css.top <= 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                }

                break;
            case 'right':
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height;
                css.top = resizeParams.top;
                if ((css.width + resizeParams.left) >= rw) {
                    css.width = rw ;
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                }
                break;
            case 'bottom':
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);
                css.width = resizeParams.width;
                css.left = resizeParams.left;
                css.top = resizeParams.top;
                if (css.height >= rh) {
                    css.height = rh;
                }

                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                }
                break;
            case 'bottomRight':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if (css.top + css.height >= rh) {
                    css.height = rh - css.top;
                    css.width = this.getScaleWidth(css.height);
                }
                break;
        }

        this.$elm.css(css);

        this._event.move.call(this,css);
    };

    Resizable.prototype.stop = function () {
        this.moving = false;
    };

    Resizable.prototype.getMouseCoord = function (e) {
        return {
            x: parseInt(e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft),
            y: parseInt(e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop)
        };
    };

    Resizable.prototype.getScaleWidth = function (height, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return height * ratio;
        } else {
            return height / ratio;
        }
    };

    Resizable.prototype.getScaleHeight = function (width, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return width / ratio;
        } else {
            return width * ratio;
        }
    };

    return Resizable;

});
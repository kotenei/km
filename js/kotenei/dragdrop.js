/**
 * 拖放模块
 * @date :2014-09-10
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/dragdrop', ['jquery'], function ($) {

    /**
     * 拖放模块
     * @constructor
     * @alias kotenei/dragdrop
     * @param {Object} options - 参数设置
     */
    var DragDrop = function (options) {

        this.options = $.extend({}, {
            $layer: null,
            $handle: null,
            $range: null,
            direction: '',// h:水平  v:垂直
            resizable: false,
            callback: {
                start: $.noop,
                move: $.noop,
                stop: $.noop
            }
        }, options);

        this.$layer = options.$layer;
        this.$handle = options.$handle;
        this.$range = options.$range;
        this.$window = $(window);
        this.$document = $(document);

        this.lw = this.$layer.outerWidth();
        this.lh = this.$layer.outerHeight();
        this.ratio = (this.lw >= this.lh ? this.lw / this.lh : this.lh / this.lw).toFixed(2);


        //是否设置大小
        this.isResize = false;

        //是否移动中
        this.moving = false;
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //原来坐标
        this.originalCoord = { x: 0, y: 0 };
        //调整尺寸参数
        this.resizeParams = { left: 0, top: 0, width: 0, height: 0, type: 'bottomRight' };

        this.init();
    }

    /**
     * 初始化
     * @return {Void} 
     */
    DragDrop.prototype.init = function () {
        if (!this.$layer) { return; }
        if (this.$range) { this.$range.css("position", "relative"); }
        this.$handle = this.$handle || this.$layer;
        this.$layer.css({ cursor: "move", position: 'absolute' });

        if (this.options.resizable) {
            this.$layer.append('<span class="k-resizable k-resizable-topLeft" data-type="topLeft"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-topCenter" data-type="topCenter"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-topRight" data-type="topRight"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-leftCenter" data-type="leftCenter"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-rightCenter" data-type="rightCenter"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomLeft" data-type="bottomLeft"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomCenter" data-type="bottomCenter"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomRight" data-type="bottomRight"></span>');
        }

        this.eventBind();
    };

    /**
     * 绑定事件
     * @return {Void} 
     */
    DragDrop.prototype.eventBind = function () {
        var self = this;

        this.$handle.on('mousedown', function (e) {
            e.stopPropagation();
            e.preventDefault();
            self.start(e);
            //禁止文档选择事件
            document.onselectstart = function () { return false };
        }).on('mousedown', '.k-resizable', function () {
            self.isResize = true;
            self.resizeParams.type = $(this).attr("data-type");
            self.resizeParams.left = parseInt(self.$layer.position().left);
            self.resizeParams.top = parseInt(self.$layer.position().top);
            self.resizeParams.width = parseInt(self.$layer.outerWidth());
            self.resizeParams.height = parseInt(self.$layer.outerHeight());
        })
    };

    /**
     * 开始拖动
     * @param  {Object} e - 事件
     * @return {Boolean}  
     */
    DragDrop.prototype.start = function (e) {
        var self = this;

        //给文档绑定事件
        this.$document.on('mousemove', function (e) {
            if (self.isMoving) {
                if (self.isResize) {
                    self.resize(e);
                }
                else {
                    self.move(e);
                }
            }
        }).on('mouseup', function (e) {
            self.stop(e);
            $(this).off();
        });


        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - this.$layer.position().left;
        this.offset.y = mouseCoord.y - this.$layer.position().top;
        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;

        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if (this.$handle[0].setCapture) {
            this.$handle[0].setCapture();
        }

        this.isMoving = true;

        //开始拖动回调函数
        if ($.isFunction(this.options.callback.start)) {
            this.options.callback.start(e, this.$layer);
        }

        return false;

    };

    /**
     * 移动中
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.move = function (e) {
        var self = this;
        var mouseCoord = this.getMouseCoord(e);
        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };
        var $range = this.$range;
        var rightBoundary, bottomBoundary;

        if ($range) {
            //元素范围内移动
            rightBoundary = $range.width() - this.$layer.outerWidth(true);
            bottomBoundary = $range.height() - this.$layer.outerHeight(true);

            if (moveCoord.x < 0) { moveCoord.x = 0; }
            if (moveCoord.y < 0) { moveCoord.y = 0; }
            if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
            if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
        } else {
            //窗体内移动
            rightBoundary = this.$window.width() - this.$layer.outerWidth() + this.$document.scrollLeft();
            bottomBoundary = this.$window.height() - this.$layer.outerHeight() + this.$document.scrollTop();
            if (moveCoord.x < 0) { moveCoord.x = 0; }
            if (moveCoord.y < 0) { moveCoord.y = 0; }
            if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
            if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
        }
        this.setPosition(moveCoord);

        if ($.isFunction(this.options.callback.move)) {
            this.options.callback.move(moveCoord);
        }

    };

    /**
     * 调整大小
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.resize = function (e) {
        var org
        var mouseCoord = this.getMouseCoord(e);
        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };
        var $layer = this.$layer;
        var resizeParams = this.resizeParams;
        var css = { left: 0, top: 0, width: 0, height: 0 };


        if (moveCoord.x<=0) {
            moveCoord.x = 0;
        }

        if (moveCoord.y<=0) {
            moveCoord.y=0;
        }

        switch (this.resizeParams.type) {
            case "topLeft":
                css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);
                css.width = css.width < this.lw ? this.lw : css.width;
                css.height = css.height < this.lh ? this.lh : css.height;
                css = this.scale(css);
                css.top = resizeParams.top - (css.height - resizeParams.height);
                css.left = resizeParams.left - (css.width - resizeParams.width);
                break;
            case "topRight":
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);
                css.width = css.width < this.lw ? this.lw : css.width;
                css.height = css.height < this.lh ? this.lh : css.height;
                css = this.scale(css);
                css.top = resizeParams.top - (css.height - resizeParams.height);
                break;
            case "leftCenter":
                css.top = resizeParams.top;
                css.left = moveCoord.x;
                css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height;
                if (css.width <= this.lw) {
                    css.width = this.lw;
                    css.left = resizeParams.left + (resizeParams.width - css.width);
                }
                break;
            case "rightCenter":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height;
                if (css.width <= this.lw) {
                    css.width = this.lw;
                }
                break;
            case "topCenter":
                css.top = moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);
                if (css.height <= this.lh) {
                    css.height = this.lh;
                    css.top = resizeParams.top + (resizeParams.height - css.height);
                }
                break;
            case "bottomCenter":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);
                if (css.height <= this.lh) {
                    css.height = this.lh;
                }
                break;
            case "bottomLeft":
                css.top = resizeParams.top;
                css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);
                css.width = css.width < this.lw ? this.lw : css.width;
                css.height = css.height < this.lh ? this.lh : css.height;
                css = this.scale(css);
                css.left = resizeParams.left - (css.width - resizeParams.width);
                break;
            case "bottomRight":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);
                css.width = css.width < this.lw ? this.lw : css.width;
                css.height = css.height < this.lh ? this.lh : css.height;
                css = this.scale(css);
                break;
            default:
                break;
        }

        

        this.$layer.css(css);
    };


    /**
     * 设置比例
     * @param  {Object} css - css参数
     * @return {Void}   
     */
    DragDrop.prototype.scale = function (css) {
        var ratio;
        if (this.lw >= this.lh) {
            css.height = css.width / this.ratio;
        } else {
            css.height = css.width * this.ratio;
        }
        return css;
    }

    /**
     * 停止拖动
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.stop = function (e) {
        this.isMoving = false;
        this.isResize = false;

        if (this.$handle[0].releaseCapture) {
            this.$handle[0].releaseCapture();
        }

        if ($.isFunction(this.options.callback.stop)) {
            this.options.callback.stop(e, this.$layer);
        }
    };

    /**
     * 获取鼠标坐标
     * @param  {Object} e -事件
     * @return {Object}  
     */
    DragDrop.prototype.getMouseCoord = function (e) {
        return {
            x: e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft,
            y: e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop
        };
    };

    /**
     * 设置拖动层位置
     * @param {Object} moveCoord - 鼠标坐标
     */
    DragDrop.prototype.setPosition = function (moveCoord) {
        if (this.options.direction === 'h') {
            this.$layer.css('left', moveCoord.x);
        } else if (this.options.direction === 'v') {
            this.$layer.css('top', moveCoord.y);
        } else {
            this.$layer.css({
                left: moveCoord.x,
                top: moveCoord.y
            });
        }
    }

    return DragDrop;

});

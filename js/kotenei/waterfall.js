/**
 * 瀑布流模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/waterfall', ['jquery', 'kotenei/infiniteScroll', 'kotenei/popTips'], function ($, InfiniteScroll, popTips) {

    var Waterfall = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            width: 200,
            nodeTag: 'li',
            resize: false,
            url: null,
            callback: $.noop
        }, options);

        this.$window = $(window);
        this.$document = $(document);
        this.node_w = this.options.width + this.options.margin;
        this.loading = false;
        this.notMore = false;
        this.init();
    };

    Waterfall.prototype.init = function () {
        var self = this;
        this.infiniteScroll = new InfiniteScroll({
            $watchElement: self.$element,
            callback: function () {
                self.remote();
            }
        });

        if (this.options.resize) {
            this.$window.on('resize.waterfall', $.proxy(this.arrangement, this));
        }

        this.arrangement();
    };

    Waterfall.prototype.arrangement = function () {
        this.nodes = this.$element.children(this.options.nodeTag);
        this.arrHeight = [];
        var n = this.$document.width() / this.node_w | 0;
        var len = 0;

        for (var i = 0, node_h, $node; i < this.nodes.length; i++) {
            $node = this.nodes.eq(i);
            node_h = $node.outerHeight();
            //n表示一行有多少个节点，i<n表示第一行开始
            if (i < n) {
                this.arrHeight[i] = node_h;         //记录每个节点的高度
                $node.css({
                    top: 0,                         //第一行每个节点的TOP值都为0
                    left: i * this.node_w           //第一行每个节点的left都为当前节点下标与区域宽度的乘积
                });
            } else {
                this.set($node, node_h);
            }
        }
    };

    Waterfall.prototype.set = function ($node, node_h) {
        var min_h = Math.min.apply(null, this.arrHeight);
        var index = this.getMinHeightIndex(min_h);
        index = index = -1 ? 0 : index;
        this.arrHeight[index] += (node_h + this.options.margin);  //更新最小值的那个高度，形成新的高度值、
        $node.css({
            top: min_h + this.options.margin,
            left: index * this.node_w
        });
    };

    Waterfall.prototype.getMinHeightIndex = function (min_h) {
        if (Array.indexOf) {
            return this.arrHeight.indexOf(min_h);
        } else {
            for (var i = 0; i < this.arrHeight; i++) {
                if (this.arrHeight[i] === min_h) {
                    return i;
                }
            }
        }
    };

    Waterfall.prototype.remote = function () {
        if (this.notMore) { return false; }
        if (this.loading) { return; }
        var self = this;
        this.loading = true;
        setTimeout(function () {
            self.options.loaded.call(self, self.$element, arr);
            self.loading = false;
        }, 500);

        //$.get(this.options.url, {
        //    rnd: Math.random()
        //}).done(function (ret) {
        //    if (!ret || ret.length === 0) {
        //        self.notMore = true;
        //        return false;
        //    }
        //}).fail(function () {
        //    popTips.error('网络错误！');
        //}).always(function () {
        //    self.loading = false;
        //});
    };

    Waterfall.prototype.stop = function () {
        this.infiniteScroll.destory();
    };

    Waterfall.prototype.imgLoad = function ($img, src, callback) {
        var img = new Image();
        var self = this;
        img.onload = function () {
            $img.attr('src', src);
            callback(self.zoom(img.width, img.height));
        }
        img.onerror = function () {
            callback({ width: self.options.width, height: 300 });
        }
        img.src = src;
    };

    Waterfall.prototype.zoom = function (width, height) {
        var ratio;
        if (width > height || width == height) {
            ratio = width / height;
            height = this.options.width / ratio;
        } else {
            ratio = height / width;
            height = this.options.width * ratio;
        }
        return {
            width: this.options.width,
            height: height
        };
    }

    return Waterfall;

});

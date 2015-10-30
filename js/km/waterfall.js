/**
 * 瀑布流模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('km/waterfall', ['jquery', 'km/infiniteScroll', 'km/popTips'], function ($, InfiniteScroll, popTips) {

    var identity = 1;

    /**
     * 瀑布流模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Waterfall = function ($element, options) {
        this.identity = identity++;
        this.$element = $element;
        this.options = $.extend(true, {
            $scrollElement: $(window),
            scrollDistance: 0,
            width: 200,
            left: 10,
            margin: 20,
            nodeTag: 'li',
            resize: true,
            url: null,
            loaded: $.noop,
            mobilePhone: false,
            pageSize: 20
        }, options);

        this.$panel = this.options.$scrollElement;
        this.$document = $(document);
        this.loading = false;
        this.noMore = false;
        this.page = 1;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Waterfall.prototype.init = function () {
        var self = this;

        if (this.options.mobilePhone) {
            this.options.width = (this.$panel.width() - this.options.margin) / 2;
        }

        this.arrangementInit();

        this.infiniteScroll = new InfiniteScroll({
            $watchElement: this.$element,
            $scrollElement: this.options.$scrollElement,
            scrollDistance: this.options.scrollDistance,
            callback: function () {

                if (self.options.url) {
                    self.remote();
                    return;
                }
                if (self.options.data && self.options.data.length > 0) {
                    self.options.loaded.call(self, self.$element, self.options.data);
                }
            }
        });

        if (this.options.resize) {

            this.$panel.on('resize.waterfall.' + this.identity, function () {
                
                self.arrangementInit();
            });
        }
    };

    /**
     * 排列初始化
     * @return {Void}
     */
    Waterfall.prototype.arrangementInit = function () {
        this.arrHeight = [];
        this.nodes = this.$element.children(this.options.nodeTag);

        var winWidth = this.$panel.width();

        if (this.nodes.length === 0) { return; }

        if (this.options.mobilePhone) {
            this.options.width = (winWidth - this.options.margin) / 2;
        }

        var n = parseInt(winWidth / this.options.width);
        var width = n * this.options.width + (n - 1) * this.options.left;

        if (width > winWidth) {
            n = n - 1;
            width = n * this.options.width + (n - 1) * this.options.left;
        }

        if (width < this.options.width) {
            return;
        }

        this.$element.width(width);

        if (this.options.mobilePhone) {
            this.nodes.width(this.options.width);
        }

        var len = 0;
        for (var i = 0, node_h, $node; i < this.nodes.length; i++) {
            $node = this.nodes.eq(i);
            node_h = $node.outerHeight();

            //n表示一行有多少个节点，i<n表示第一行开始
            if (i < n) {
                this.arrHeight[i] = node_h;         //记录每个节点的高度
                $node.css({
                    top: 0,                         //第一行每个节点的TOP值都为0
                    left: i * (this.options.width + this.options.left)           //第一行每个节点的left都为当前节点下标与区域宽度的乘积
                });
            } else {
                this.set($node, node_h);
            }
        }

        this.adpHeight();
    };

    /**
     * 排列
     * @param  {JQuery} $items - dom
     * @return {Void}
     */
    Waterfall.prototype.arrangement = function ($items) {
        var self = this;
        if (this.arrHeight.length === 0) {
            this.arrangementInit();
            return;
        }

        if (!$items || $items.length === 0) {
            return;
        }

        $items.each(function () {
            var $this = $(this),
                node_h = $this.outerHeight();
            self.set($this, node_h);
        });
        this.adpHeight();
    };


    /**
     * 设置节点排列
     * @param {JQuery} $node  - dom
     * @param {Number} node_h - 高度
     */
    Waterfall.prototype.set = function ($node, node_h) {

        var min_h = this.getMinHeight();

        var index = this.getMinHeightIndex(min_h);
        index = index == -1 ? 0 : index;

        this.arrHeight[index] += (node_h + this.options.left);  //更新最小值的那个高度，形成新的高度值、
        $node.css({
            top: min_h + this.options.left,
            left: index * (this.options.width + this.options.left)
        });
    };

    /**
     * 获取最小高度的索引
     * @param  {Number} min_h - 最小高度
     * @return {Number}      
     */
    Waterfall.prototype.getMinHeightIndex = function (min_h) {

        if (Array.indexOf) {
            var index = this.arrHeight.indexOf(min_h);
            return index;
        } else {
            for (var i = 0; i < this.arrHeight.length; i++) {
                if (this.arrHeight[i] === min_h) {
                    return i;
                }
            }
            return -1;
        }
    };

    /**
     * 远程取数据
     * @return {Void} 
     */
    Waterfall.prototype.remote = function () {
        if (this.noMore) { return; }
        if (this.loading) { return; }
        var self = this;
        this.loading = true;
        $.get(this.options.url, {
            rnd: Math.random(),
            page: this.page++,
            pageSize: this.options.pageSize
        }).done(function (ret) {
            if (!ret || ret.length === 0) {
                self.noMore = true;
                return false;
            }
            self.options.loaded.call(self, self.$element, ret);
            self.loading = false;
        }).fail(function () {
            popTips.error('网络错误！');
            self.loading = false;
        })
    };


    /**
     * 销毁
     * @return {Void} 
     */
    Waterfall.prototype.destory = function () {
        this.infiniteScroll.destory();
    };

    /**
     * 图片加载
     * @param  {JQuery}   $img - dom
     * @param  {String}   src - 图片路径
     * @param  {Function} callback [description]
     * @return {Void}
     **/
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

    /**
     * 获取缩放图片尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height- 高度
     * @return {Object}     
     */
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
    };

    /**
     * 获取最小高度
     * @return {Number}
     */
    Waterfall.prototype.getMinHeight = function () {
        return Math.min.apply(null, this.arrHeight);
    }

    /**
     * 获取最大高度
     * @return {Number} 
     */
    Waterfall.prototype.getMaxHeight = function () {
        return Math.max.apply(null, this.arrHeight);
    };

    /**
     * 设置容器高度
     * @return {Void}
     */
    Waterfall.prototype.adpHeight = function () {
        this.$element.height(this.getMaxHeight());
    }

    return Waterfall;

});

/*
 * 分页模块
 * @date:2014-09-14
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/pager', ['jquery', 'kotenei/event'], function ($, event) {

    /**
     * 分页模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var Pager = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            curPage: 1,
            totalCount: 0,
            pageSize: 20,
            className: 'k-pagination',
        }, options);
        this.canBuild = true;
        this.curPage = this.options.curPage;
        this.totalCount = this.options.totalCount;
        this.pageSize = this.options.pageSize;
        this.template = '<div class="pager-box"></div>';
        this.event = event;
        this.init();

    }

    /**
     * 初始化
     * @return {Void} 
     */
    Pager.prototype.init = function () {
        var self = this;
        this.$pager = $(this.template).appendTo(this.$element);
        this.build();
        this.$pager.on('click', 'li', function () {
            var $this = $(this),
                page = $this.attr('data-page');
            if ($this.hasClass("disabled") || $this.hasClass("active")) { return; }
            self.curPage = parseInt(page);

            self.event.trigger('click.pager', [page]);

            if (self.canBuild) {
                self.build();
            }

        });
    };

    /**
     * 事件绑定
     * @return {Void} 
     */
    Pager.prototype.on = function (name, callback) {
        var self = this;
        this.event.on(name + '.pager', function (args) {
            callback.apply(self, args);
        });
    }

    /**
     * 创建分页HTML
     * @return {String} 
     */
    Pager.prototype.build = function () {
        var info = this.getInfo(),
            html = [], className;

        html.push('<ul class="' + this.options.className + '">');

        className = this.curPage > 1 ? '' : 'disabled';
        html.push('<li class="' + className + '" data-page="' + info.pre + '" ><a href="javascript:void(0);">«</a></li>');

        for (var i = info.start; i <= info.end; i++) {
            className = (i === this.curPage) ? 'active' : '';
            html.push('<li class="' + className + '" data-page="' + i + '" ><a href="javascript:void(0);">' + i + '</a></li>');
        }

        className = this.curPage !== info.allPage ? '' : 'disabled';
        html.push('<li class="' + className + '" data-page="' + info.next + '" ><a href="javascript:void(0);">»</a></li>');

        html.push('</ul>');

        this.$pager.html(html.join(''));

        if (this.totalCount == 0) {
            this.$pager.hide();
        } else {
            this.$pager.show();
        }
    };

    /**
     * 获取分页相关信息（起始页、结束页、总页等）
     * @return {Object}
     */
    Pager.prototype.getInfo = function () {
        var start, end, pre, next, allPage;
        //确定总页数
        allPage = parseInt(this.totalCount / this.pageSize);
        allPage = ((this.totalCount % this.pageSize) !== 0 ? allPage + 1 : allPage);
        allPage = (allPage === 0 ? 1 : allPage);


        //确定起始和结束页码
        start = (this.curPage + 2) > allPage ? (allPage - 4) : (this.curPage - 2);
        end = this.curPage < 4 ? 5 : this.curPage + 2;

        //修正起始和结束页的溢出
        if (start < 1) { start = 1; }
        if (end > allPage) { end = allPage; }


        //确定前一页和下一页的数字
        pre = (this.curPage - 1) < 1 ? 1 : (this.curPage - 1);
        next = (this.curPage + 1) > allPage ? allPage : (this.curPage + 1);


        return {
            start: start, end: end, pre: pre, next: next, allPage: allPage
        }
    };

    return Pager;
});

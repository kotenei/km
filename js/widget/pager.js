/*
 * 分页模块
 * @date:2014-09-14
 * @email:kotenei@qq.com
 */
define('widget/pager', ['jquery'], function ($) {
    var Pager = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            className: 'pagination',
            onclick: $.noop
        }, options);
        this.curPage = 1;
        this.totalCount = 0;
        this.pageSize = 10;
        this.template = '<div class="pager-box"></div>';
    }

    Pager.prototype.init = function () {
        if (this.totalCount === 0) { return; }
        var self = this;
        this.$pager = $(this.template).append(this.build()).appendTo(this.$element);
        this.$pager.on('click', 'li', function () {
            var $this = $(this),
                page = $this.attr('data-page');
            if ($this.hasClass("disabled") || $this.hasClass("active")) { return; }
            self.curPage = parseInt(page);
            self.$pager.html(self.build());
            self.options.onclick(self.curPage);
        });
    };

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
        return html.join('');
    };

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

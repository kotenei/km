define('km/panel', ['jquery', 'km/resizable'], function ($, Resizable) {

    var Panel = function ($elm, options) {
        this.$panel = $elm;
        this.options = $.extend(true, {
            width: 400,
            height: 'auto',
            resizable:false
        }, options);
        this.init();
    };

    //初始化
    Panel.prototype.init = function () {
        this.$panel.css({
            width: this.options.width,
            height: this.options.height
        });
        this.$header = this.$panel.find('.k-panel-head');
        this.$title = this.$header.find('.k-panel-title');
        this.$body = this.$panel.find('.k-panel-body');

        if (this.options.resizable) {
            this.resizable = new Resizable(this.$panel, {

            });
        }

        this.watch();
    };



    //事件绑定
    Panel.prototype.watch = function () {
        var self = this;
        this.$panel.on('click', '[role=collapse]', function () {
            self.collapse($(this));
        }).on('click', '[role=expand]', function () {
            self.expand($(this));
        });
    };

    //展开
    Panel.prototype.expand = function ($el) {
        $el.attr('role', 'collapse');
        if ($el.hasClass('fa-angle-double-down')) {
            $el.removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
            this.$body.slideDown();
            return;
        }
    };

    //折叠
    Panel.prototype.collapse = function ($el) {
        $el.attr('role', 'expand');
        if ($el.hasClass('fa-angle-double-up')) {
            $el.removeClass('fa-angle-double-up').addClass('fa-angle-double-down');
            this.$body.slideUp();
            return;
        }
    };

    return Panel;
});
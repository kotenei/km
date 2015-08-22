define('km/panel', ['jquery', 'km/resizable'], function ($, Resizable) {

    var Panel = function ($elm, options) {
        this.$panel = $elm;
        this.options = $.extend(true, {
            width: 400,
            height: 'auto',
            resizable: false,
            border: {
                left: false,
                top: false,
                right: false,
                bottom: false
            }
        }, options);
        this.init();
    };

    //初始化
    Panel.prototype.init = function () {
        var self = this;
        this.$panel.css({
            width: this.options.width,
            height: this.options.height
        });
        this.$header = this.$panel.find('.k-panel-head');
        this.$title = this.$header.find('.k-panel-title');
        this.$body = this.$panel.find('.k-panel-body');
        this.$body.css('height', this.$panel.height() - this.$title.height());

        this.headHeight=this.$header.outerHeight(true);

        if (this.options.resizable) {
            this.resizable = new Resizable(this.$panel, {
                border: self.options.border,
                minWidth: self.options.minWidth,
                minHeight:self.options.minHeight
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

        if (this.resizable) {
            this.resizable.on('move', function (css) {
                self.setHeight(css.height);
            });
        }

    };

    Panel.prototype.setHeight = function (height) {
        var h = this.$title.height();
        h = height - h;

        this.$body.css('height', h);
    };

    //展开
    Panel.prototype.expand = function ($el) {
        $el.attr('role', 'collapse');
        if ($el.hasClass('fa-angle-double-down')) {
            $el.removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
            
            this.$panel.stop().animate({
                height: this.orgHeight
            });
            this.$body.stop().show().animate({
                height: this.orgHeight-this.headHeight
            })
            return;
        }
    };

    //折叠
    Panel.prototype.collapse = function ($el) {
        var h, self = this;

        this.orgHeight = this.$panel.outerHeight();

        $el.attr('role', 'expand');
        if ($el.hasClass('fa-angle-double-up')) {
            $el.removeClass('fa-angle-double-up').addClass('fa-angle-double-down');
            
            this.$panel.stop().animate({
                height: this.headHeight
            });
            this.$body.stop().animate({
                height:0
            }, function () {
                self.$body.hide();
            });
            return;
        }
    };

    return Panel;
});
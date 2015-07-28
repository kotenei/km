/*
 * 下拉树模块
 * @date:2015-07-28
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/dropDownTree', ['jquery', 'kotenei/tree'], function ($, Tree) {

    var DropDownTree = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend({}, {
            data: [],
            width: null,
            height: 300,
            zIndex: 999,
            appendTo: $(document.body),
            isTree: true,
            multiple: false,
            callback: {
                onCheck: $.noop,
                onSelect: $.noop
            }
        }, options);
        this.$treePanel = $('<div class="k-dropDownTree-panel"></div>');
        this.init();
    };

    DropDownTree.prototype.init = function () {
        this.elmWidth = this.$elm.outerWidth();

        this.$treePanel.css({
            width: this.options.width || this.elmWidth,
            height: this.options.height,
            zIndex: this.options.zIndex
        }).appendTo(this.options.appendTo);

        if (!this.options.isTree) {
            this.options.view = {
                showLine: false,
                showIcon: false
            }
        }

        if (this.options.multiple) {
            this.options.check = {
                enabel: true,
                chkType: 'checkbox',
                chkBoxType: { Y: "", N: "" }
            };
        }

        this.tree = new Tree(this.$treePanel, this.options);

        this.watch();
    };

    DropDownTree.prototype.watch = function () {
        var self = this;

        this.$elm.on('click', function () {
            self.show();
            return false;
        });

        $(document).on('click.dropDownTree', function (e) {
            var $target = $(e.target);
            if ($target.hasClass('k-dropDownTree-panel') ||
                $target.parents('.k-dropDownTree-panel').length > 0 ||
                $target == self.$elm) {
                return;
            }
            self.hide();
        });
    };

    DropDownTree.prototype.show = function () {
        var self = this;
        this.$treePanel.fadeIn().css({
            left: self.$elm.offset().left,
            top: self.$elm.offset().top + self.$elm.outerHeight()
        });
        this.tm = setTimeout(function () {
            self.$treePanel.css({
                left: self.$elm.offset().left,
                top: self.$elm.offset().top + self.$elm.outerHeight()
            });
            clearTimeout(self.tm);
        }, 50);
    };

    DropDownTree.prototype.hide = function () {
        this.$treePanel.fadeOut();
    };

    return DropDownTree;

});

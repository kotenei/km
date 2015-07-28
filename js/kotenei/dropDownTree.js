/*
 * 下拉树模块
 * @date:2015-07-28
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/dropDownTree', ['jquery', 'kotenei/tree'], function ($, Tree) {

    var DropDownTree = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            data: [],
            url: null,
            width: null,
            height: 220,
            zIndex: 999,
            appendTo: $(document.body),
            isTree: true,
            multiple: false,
            callback: {
                select: $.noop,
                check: $.noop
            }
        }, options);
        this.$treePanel = $('<div class="k-dropDownTree"></div>');
        this.init();
    };

    DropDownTree.prototype.init = function () {

        var self = this;

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

            this.$treePanel.addClass('k-dropDownTree-list');
        }

        if (this.options.multiple) {
            this.options.check = {
                enable: true,
                chkType: 'checkbox',
                chkBoxType: { Y: "", N: "" }
            };
        }

        this.options.callback.onCheck = function (nodes) {
            self.check(nodes);
        };

        this.options.callback.onSelect = function (node) {
            self.select(node);
        };

        if (this.options.url) {
            $.get(this.options.url, { rand: Math.random() }, function (data) {
                self.options.data = data;
                self.tree = new Tree(self.$treePanel, self.options);
                self.watch();
            });
        } else {
            this.tree = new Tree(this.$treePanel, this.options);
            this.watch();
        }

    };

    DropDownTree.prototype.watch = function () {
        var self = this;

        this.$elm.on('click', function () {
            self.show();
            return false;
        });

        $(document).on('click.dropDownTree', function (e) {
            var $target = $(e.target);

            if ($target.hasClass('k-dropDownTree') ||
                $target.parents('.k-dropDownTree').length > 0 ||
                $target == self.$elm) {
                return;
            }
            self.hide();
        });
    };

    DropDownTree.prototype.select = function (node) {
        if (this.options.multiple) {
            this.tree.$tree.find('a.selected').removeClass('selected');
            return;
        }
        this.$elm.val(node.value || node.text);

        this.options.callback.select(node);
    };

    DropDownTree.prototype.check = function (node) {

        var nodes = this.tree.getCheckedNodes();
        var values = [];

        for (var i = 0; i < nodes.length; i++) {
            values.push(nodes[i].value || nodes[i].text);
        }

        this.$elm.val(values.join(','));
        this.options.callback.check(nodes);
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
                top: self.$elm.offset().top + self.$elm.outerHeight() + 2
            });
            clearTimeout(self.tm);
        }, 50);
    };

    DropDownTree.prototype.hide = function () {
        this.$treePanel.fadeOut();
    };

    DropDownTree.Global = function ($elms) {
        $elms = $elms || $('input[data-module=dropdowntree]');
        $elms.each(function () {
            var $elm = $(this),
                url = $elm.attr('data-url'),
                width = $elm.attr('data-width'),
                height = $elm.attr('data-height'),
                zIndex = $elm.attr('data-zIndex'),
                appendTo = $elm.attr('data-appendTo'),
                isTree = $elm.attr('data-isTree') || true,
                multiple = $elm.attr('multiple') || false,
                data;

            data = $elm.data('dropDownTree');

            if (!data) {
                data = new DropDownTree($elm, {
                    url: url,
                    width: width,
                    height: height,
                    zIndex: zIndex,
                    appendTo: $(appendTo || document.body),
                    isTree: isTree,
                    multiple: multiple
                });
                $elm.data('dropDownTree', data);
            }

        });
    };

    return DropDownTree;

});

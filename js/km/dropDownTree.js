/*
 * 下拉树模块
 * @date:2015-07-28
 * @author:kotenei(kotenei@qq.com)
 */
define('km/dropDownTree', ['jquery', 'km/tree'], function ($, Tree) {

    var identity = 1;

    /**
     * 下拉树类
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var DropDownTree = function ($elm, options) {
        this.identity = identity++;
        this.$elm = $elm;
        this.options = $.extend(true, {
            data: [],
            url: null,
            width: null,
            height: 200,
            zIndex: 999,
            appendTo: $(document.body),
            isTree: true,
            multiple: false,
            inputGroup: '.k-input-group',
            bindElement: null,
            callback: {
                select: $.noop,
                check: $.noop,
                hide: $.noop
            }
        }, options);
        this.tm = null;
        this.$treePanel = $('<div class="k-dropDownTree k-pop-panel"></div>');
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    DropDownTree.prototype.init = function () {

        var self = this;

        if ((!this.options.url || this.options.url.length == 0) &&
            (!this.options.data || this.options.data.length == 0)) {
            return;
        }

        this.$bindElement = $(this.options.bindElement);

        this.$inputGroup = this.$elm.parent(this.options.inputGroup);

        this.$elm.attr('readonly', 'readonly');
        this.$elm.attr('data-moduleId', this.identity);

        this.elmWidth = this.$elm.outerWidth();

        this.$treePanel.css({
            width: this.options.width || this.$inputGroup.outerWidth() || this.elmWidth,
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
            $.get(this.options.url, {
                value: this.$bindElement && this.$bindElement.length > 0 ? this.$bindElement.val() : this.$elm.val(),
                rand: Math.random()
            }, function (data) {

                if (typeof data === 'string') {
                    data = eval('(0,' + data + ')');
                }

                self.options.data = data;
                self.tree = new Tree(self.$treePanel, self.options);
                self.watch();
            });
        } else {
            this.tree = new Tree(this.$treePanel, this.options);
            this.watch();
        }

    };

    /**
     * 事件监控
     * @return {Void}
     */
    DropDownTree.prototype.watch = function () {
        var self = this;

        this.$elm.on('click.dropDownTree', function (e) {
            self.show();
            return false;
        });

        this.$inputGroup.on('click.dropDownTree', 'button', function (e) {
            self.show();
            return false;
        });

        $(document).on('click.dropDownTree.' + this.identity, function (e) {

            //if (self && self.$elm.parent().length == 0) {
            //    $(window).off('resize.dropDownTree.' + self.identity);
            //    $(document).off('click.dropDownTree.' + self.identity);
            //    self = null;
            //    return;
            //}

            var $target = $(e.target);
            if ($target.hasClass('k-dropDownTree') ||
                $target.parents('.k-dropDownTree').length > 0) {
                return;
            }
            self.hide();
        });

        $(window).on('resize.dropDownTree.' + this.identity, function () {

            if (self.tm) {
                clearTimeout(self.tm);
            }

            self.tm = setTimeout(function () {

                //if (self && self.$elm.parent().length == 0) {
                //    $(window).off('resize.dropDownTree.' + self.identity);
                //    $(document).off('click.dropDownTree.' + self.identity);
                //    self = null;
                //    return;
                //}

                self.setPosition();

            }, 300);

        });
    };

    /**
     * 单选操作
     * @return {Void}
     */
    DropDownTree.prototype.select = function (node) {
        if (this.options.multiple) {
            this.tree.$tree.find('a.selected').removeClass('selected');
            return;
        }

        if (this.$bindElement) {
            this.$bindElement.val(node.value || node.nodeId || node.text);
        }

        this.$elm.val(node.text).attr('title', node.text).focus().blur();

        this.options.callback.select(node);

        this.hide();
    };


    /**
     * 复选操作
     * @return {Void}
     */
    DropDownTree.prototype.check = function (node) {

        var nodes = this.tree.getCheckedNodes();
        var arrValue = [],
            arrText = [];

        for (var i = 0; i < nodes.length; i++) {
            arrText.push(nodes[i].text);
            arrValue.push(nodes[i].value || nodes[i].nodeId || nodes[i].text);
        }

        if (this.$bindElement) {
            this.$bindElement.val(arrValue.join(','));
        }

        this.$elm.val(arrText.join(',')).attr('title', arrText.join(',')).focus().blur();
        this.options.callback.check(nodes);
    };

    /**
     * 设置位置
     * @return {Void}
     */
    DropDownTree.prototype.setPosition = function () {
        this.$treePanel.css({
            left: this.$elm.offset().left,
            top: this.$elm.offset().top + this.$elm.outerHeight() + 2,
            width: this.options.width || this.$inputGroup.outerWidth() || this.elmWidth
        });
    };

    /**
     * 显示
     * @return {Void}
     */
    DropDownTree.prototype.show = function () {

        if (this.$treePanel[0].style.display == 'block') {
            return;
        }
        $('div.k-pop-panel,ul.k-pop-panel').hide();
        this.$treePanel.show();
        this.setPosition();
    };

    /**
     * 隐藏
     * @return {Void}
     */
    DropDownTree.prototype.hide = function () {
        if (this.$treePanel[0].style.display == 'block') {
            this.options.callback.hide();
        }
        this.$treePanel.hide();
    };

    /**
     * 销毁
     * @param {int} moduleId - 模板编号
     * @return {Void}
     */
    DropDownTree.Destory = function (moduleId) {
        moduleId = moduleId || "";
        var key = moduleId ? 'resize.dropDownTree.' + moduleId : 'resize.dropDownTree';
        $(window).off(key);
    }


    /**
     * 全局调用
     * @return {Void}
     */
    DropDownTree.Global = function ($elms) {
        $elms = $elms || $('input[data-module=dropdowntree]');

        $elms.each(function () {
            var $elm = $(this),
                options = $elm.attr('data-options'),
                url = $elm.attr('data-url'),
                width = $elm.attr('data-width'),
                height = $elm.attr('data-height'),
                zIndex = $elm.attr('data-zIndex'),
                appendTo = $elm.attr('data-appendTo'),
                isTree = $elm.attr('data-isTree') || true,
                multiple = $elm.attr('data-multiple') || false,
                array = $elm.attr('data-data'),
                callback = $elm.attr('data-callback'),
                bindElm = $elm.attr('data-bindelement') || null,
                data;

            data = $.data($elm[0], 'dropDownTree');


            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        data: eval(array),
                        url: url,
                        width: width && width.length > 0 ? parseInt(width) : null,
                        height: height && height.length > 0 ? parseInt(height) : 200,
                        zIndex: zIndex && zIndex.length > 0 ? parseInt(zIndex) : 999,
                        appendTo: $(appendTo || document.body),
                        isTree: isTree && isTree == 'false' ? false : true,
                        multiple: multiple && multiple == 'true' ? true : false,
                        $bindElement: $(bindElm),
                        callback: callback && callback.length > 0 ? eval('(0,' + callback + ')') : {}
                    };
                }

                data = new DropDownTree($elm, options);

                $.data($elm[0], 'dropDownTree', data);
            }

        });
    };


    return DropDownTree;

});

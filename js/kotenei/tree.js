/*
 * 树型模块
 * @date:2014-10-22
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/tree', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    /**
     * 默认参数
     */
    var DEFAULTS = {
        nodes: [],
        check: {
            enable: false,                          // 是否启用
            chkType: 'checkbox',                    // 单选框还是复选框，默认复选
            chkBoxType: { Y: "ps", N: "ps" }        // Y：选中时对父与子级的关联关系，N：取消选中时对父与子级的关联关系，p:父级,s:子级
        },
        callback: {
            beforeCheck: null,
            beforeClick: null,
            beforeRename: null,
            beforeExpand: null,
            beforeRemove: null,

            onCheck: null,
            onClick: null,
            onRename: null,
            onExpand: null,
            onRemove: null
        }
    };

    var Tree = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, DEFAULTS, options);
    };

    Tree.prototype.init = function () { };

    Tree.prototype.eventBind = function () { };

    Tree.prototype.method = {
        add: function () { },
        edit: function () { },
        remove: function () { }
    };

    return Tree;
});

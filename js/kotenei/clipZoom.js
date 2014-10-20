/**
 * 图片剪裁模块
 * @date :2014-10-19
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/clipZoom', ['jquery', 'kotenei/dragdrop'], function ($,DragDrop) {

    var ClipZoom = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            scale:true,    
            selectorWidth: 120,
            selectorHeight:100
        }, options);
    };

    //初始化
    ClipZoom.prototype.init = function () {

    }

    //裁剪
    ClipZoom.prototype.clip = function () { };

    //居中
    ClipZoom.prototype.center = function () { };

    //重置
    ClipZoom.prototype.reset = function () { };

    //缩放
    ClipZoom.prototype.zoom = function () { };

    //设置预览
    ClipZoom.prototype.setPreview = function () { };

    //图片加载
    ClipZoom.prototype.imgLoad = function () { };

    return ClipZoom;

});

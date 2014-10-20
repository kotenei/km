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
        
        this.$selector = $element.find('.selector');
        this.$clipZoomBox = $element.find('.k-clipZoom-Box');
        this.init();
    };

    //初始化
    ClipZoom.prototype.init = function () {
        var self = this;

        this.selectorDnd = new DragDrop({
            $layer: this.$selector,
            $range:this.$clipZoomBox,
            resizable:true
        });

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

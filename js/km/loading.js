/**
 * loading模块
 * @date :2014-09-23
 * @author kotenei (kotenei@qq.com)
 */
define('km/loading', ['jquery', 'spin'], function ($, Spinner) {

    var global;


    var Loading = function (options) {
        this.options = $.extend(true, {
            lines: 12, // 花瓣数目
            length: 10, // 花瓣长度
            width: 4, // 花瓣宽度
            radius: 14, // 花瓣距中心半径
            corners: 1, // 花瓣圆滑度 (0-1)
            rotate: 0, // 花瓣旋转角度
            direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针
            color: 'white', // 花瓣颜色
            speed: 1, // 花瓣旋转速度
            trail: 60, // 花瓣旋转时的拖影(百分比)
            shadow: false, // 花瓣是否显示阴影
            hwaccel: false, // 是否启用硬件加速及高速旋转            
            className: 'k-spinner', // css 样式名称
            zIndex: 2e9, // spinner的z轴 (默认是2000000000)
            top: '50%', // spinner 相对父容器Top定位 单位 px
            left: '50%'// spinner 相对父容器Left定位 单位 px
        }, options);
        this.tpl = '<div class="k-loading"></div>';
        this.init();
    }

    var isShow = false;

    Loading.prototype.init = function () {
        this.$loading = $(this.tpl).appendTo(document.body).hide();
        //this.options.top = this.$loading.outerHeight() / 2 + "px";
        //this.options.left = this.$loading.outerWidth() / 2 + "px";
        this.spinner = new Spinner(this.options);
    };

    Loading.prototype.show = function (isImg,isFull) {
        if (isShow) { return; }
        isShow = true;

        if (isFull) {
            this.$loading.addClass('k-loading-full');
        } else {
            this.$loading.removeClass('k-loading-full');
        }

        isImg = typeof isImg == 'undefined' ? true : isImg;

        if (isImg) {
            this.$loading.addClass('k-loading-img');
            this.$loading.show();
        }else{
            this.spinner.spin(this.$loading.get(0));
            this.$loading.removeClass('k-loading-img');
            this.$loading.fadeIn('fast');
        }
        

    };

    Loading.prototype.hide = function () {
        var self = this;
        this.$loading.stop().hide();
        this.spinner.stop();
        isShow = false;
    };

    Loading.show = function (isPic, isFull) {
        if (!global) {
            global = new Loading();
        }
        global.show(isPic,isFull);
    };

    Loading.hide = function () {
        if (!global) { return; }
        global.hide();
    };

    return Loading;

});

/*
 * 遮罩模块
 * @date:2016-05-09
 * @author:kotenei(kotenei@qq.com)
 */
define('km/mask', ['jquery'], function ($) {
    
    var $mask=$('<div class="k-mask"></div>').appendTo(document.body);
    
    var exports={
        show:function (content) {
            $mask.html(content).fadeIn();
        },
        hide:function () {
            if($mask) {
                $mask.fadeOut();
            }
        }
    };
    return exports;
});
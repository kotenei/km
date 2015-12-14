/*
 * validate扩展  使用tooltips显示错误
 * @date:2014-09-06
 * @author:kotenei(kotenei@qq.com)
 */
define('km/validateTooltips', ['jquery', 'km/validate', 'km/tooltips', 'km/util'], function ($, Validate, Tooltips, util) {


    /**
     * Tooltips表单验证
     * @param {JQuery} $form - dom
     * @param {Object} options - 参数
     */
    var ValidateTooltips = function ($form, options) {
        Validate.call(this, $form, options);
    };

    ValidateTooltips.prototype = util.createProto(Validate.prototype);


    /**
	 * 获取元素错误提示定位
	 * @param  {object} element - dom
	 * @return {Object}       
	 */
    ValidateTooltips.prototype.getTipsPlacement = function (element) {
        var name = element.name, placement = "right";
        if (!this.tipsPlacement) {
            this.tipsPlacement = this.options.tipsPlacement || {};
        }
        if (!this.tipsPlacement[name]) {
            this.tipsPlacement[name] = { position: 'right', target: element };
        } else {
            placement = this.tipsPlacement[name];
        }

        return placement;
    };

    /**
	 * 显示tips错误
	 * @param  {JQuery} $element - dom
	 * @param  {String} message - 错误信息
	 * @return {Void}        
	 */
    ValidateTooltips.prototype.showError = function ($element, message) {

        var $target;

        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var placement = this.getTipsPlacement($element[0]);


        if (placement.target) {
            $target = $(placement.target);
            $.data($element[0], '$target', $target);
        } else {
            $target = $element
        }


        var tooltips = Tooltips.Get($target);
        if (!tooltips) {
            tooltips = new Tooltips($target, {
                content: message,
                tipClass: 'danger',
                trigger: 'manual',
                placement: placement.position,
                container: this.options.container || document.body,
                scrollContainer: this.options.scrollContainer
            });
            Tooltips.Set($target, tooltips);
        } else {
            tooltips.setContent(message);
        }

        if (placement.checkParents) {

            var $parents = $target.parents(placement.checkParents+":eq(0)");

            if ($parents.length > 0 && $parents[0].style.display != 'none') {
                tooltips.show();
                $target.addClass(this.options.errorClass);
            }

        } else {
            tooltips.show();
            $target.addClass(this.options.errorClass);
        }
        
    };

    /**
	 * 隐藏tips错误
	 * @param  {JQuery} $element -dom
	 * @return {Void}  
	 */
    ValidateTooltips.prototype.hideError = function ($element, isRemoveClass) {
        if (typeof isRemoveClass === 'undefined') {
            isRemoveClass = true;
        }
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }

        var $target = $.data($element[0], '$target');
        if ($target) {
            $element = $target;
        }

        var tooltips = Tooltips.Get($element);
        if (tooltips) {
            tooltips.hide();
        }
        if (isRemoveClass) {
            $element.removeClass(this.options.errorClass);
        }
    };

    return ValidateTooltips;
});
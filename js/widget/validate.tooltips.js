/*
 * validate扩展  使用tooltips显示错误
 * @date:2014-09-06
 * @email:kotenei@qq.com
 */
define('widget/validate.tooltips', ['jquery', 'widget/validate', 'widget/tooltips'], function ($, Validate, Tooltips) {

	//获取元素错误提示定位
	Validate.prototype.getTipsPlacement = function (element) {
		var name = element.name, placement = "right";
		if (!this.tipsPlacement) {
			this.tipsPlacement = this.options.tipsPlacement || {};
		}
		if (!this.tipsPlacement[name]) {
			this.tipsPlacement[name] = placement;
		} else {
			placement = this.tipsPlacement[name]
		}
		return placement;
	};

	//显示tips错误
	Validate.prototype.showError = function ($element, message) {
		if (this.checkable($element[0])) {
			$element = this.validFields.data[$element[0].name];
		}
		var placement = this.getTipsPlacement($element[0]);
		var tooltips = Tooltips.Get($element);
		if (!tooltips) {
			tooltips = new Tooltips($element, {
				content: message,
				tipClass: 'danger',
				trigger: 'manual',
                placement:placement
			});
			Tooltips.Set($element, tooltips);
		} else {
			tooltips.setContent(message);
		}
		tooltips.show();
		$element.addClass(this.options.errorClass);
	};

	//隐藏tips错误
	Validate.prototype.hideError = function ($element) {
		if (this.checkable($element[0])) {
			$element = this.validFields.data[$element[0].name];
		}
		var tooltips = Tooltips.Get($element);
		if (tooltips) {
			tooltips.hide();
		}
		$element.removeClass(this.options.errorClass);
		
	};

	return Validate;
});
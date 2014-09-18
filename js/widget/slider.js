/*
 * 滑块模块
 * @date:2014-09-15
 * @email:kotenei@qq.com
 */
define('widget/slider', ['jquery', 'widget/dragdrop'], function ($, DragDrop) {

    var Slider = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            min: 1,
            max: 10,
            step: 1,
            value: 1,
            $bindElement: $([]),
            callback: {
                slide: $.noop
            }
        }, options);
        this.template = '<div class="slider"><div class="slider-selection"></div><div class="slider-handle"></div></div>';
        this.min = this.options.min;
        this.max = this.options.max;
        this.step = this.options.step;
        this.diff = this.max - this.min;
        this.init();
    };

    Slider.prototype.init = function () {
        var self = this;
        this.$slider = $(this.template).appendTo(this.$element);
        this.$sliderSelection = this.$slider.find("div.slider-selection");
        this.$sliderHandle = this.$slider.find("div.slider-handle");
        this.handleWidth = this.$sliderHandle.width();
        this.sliderWidth = this.$slider.outerWidth();
        this.$bindElement = this.options.$bindElement;
        this.dragdrop = new DragDrop({
            $range: this.$slider,
            $layer: this.$slider.find(".slider-handle"),
            direction: 'h',
            callback: {
                move: function (moveCoord) {
                    var val = self.getMoveValue(moveCoord);
                    self.setValue(val);
                    self.options.callback.slide(val);
                }
            }
        });

        this.eventBind();
        this.setValue(this.options.value);
    };

    Slider.prototype.eventBind = function () {
        if (!this.allowElement()) { return; }

        var type = this.$bindElement[0].type;
        var self = this;

        if (type.indexOf('select') !==-1) {
            this.$bindElement.on('change', function () {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                self.setValue(val);
            });
        } else {
            this.$bindElement.on('keyup', function (e) {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                if (e.keyCode === 13) {
                    self.setValue(val);
                }
            });
        }
    };

    Slider.prototype.allowElement = function () {
        if (this.$bindElement.length === 0) { return false; }
        var type = this.$bindElement[0].type;
        if (type !== 'text'
            && type !== "textarea"
            && type.indexOf("select") === -1) {
            return false;
        }
        return true;
    };

    Slider.prototype.getFilterValue = function (value) {
        if (!value) { value = this.min; }
        if (isNaN(value)) { value = this.min; }
        if (value < this.min) { value = this.min; }
        if (value > this.max) { value = this.max; }
        return value;
    };

    Slider.prototype.setValue = function (value) {
        if (value > this.max) { value = this.max; }
        if (value < this.min) { value = this.min; }
        var percent = (value - this.min) / this.diff * 100;
        this.setPercent(percent);
        this.setElementValue(value)
    };

    Slider.prototype.setElementValue = function (value) {
        if (!this.allowElement()) { return; }
        var type = this.$bindElement[0].type;
        if (type.indexOf('select') != -1) {
            this.$bindElement.find("option[value='" + value + "']").prop("selected", true);
        } else {
            this.$bindElement.val(value);
        }
    };

    Slider.prototype.getMoveValue = function (moveCoord) {
        var percent = (moveCoord.x / (this.sliderWidth - this.handleWidth) * 100);
        var val = Math.round((percent / 100 * this.diff) / this.step) * this.step + this.min;
        val = val > this.max ? this.max : val;
        return val;
    };

    Slider.prototype.setPercent = function (percent) {
        this.$sliderSelection.width(percent + "%");
        this.$sliderHandle.css("left", percent + "%");
    };

    return Slider;

});

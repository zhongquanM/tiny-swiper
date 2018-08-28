/**
 * Create by Checkson on 2018/8/27
 * version 1.0.0
 */
;(function ($) {

	function TinySwiper (el, options) {
		this.options = options;
		this.$el = $(el);
		this.timer = null;
	 	this.init();
	}

	TinySwiper.DEFAULTS = {
		autoplay: false,
		speed: 3000,
		initialIndex: 0,
		clickable: true,
		slides: '.slide-item',
		slidesLen: 5,
		slidesProps: {
			width: 0,
			height: 0
		},
		navigation: {
			prev: '.slide-prev',
			next: '.slide-next'
		},
		pagination: {
			el: '.slide-pagination-item',
			activeClass: 'active'
		},
		slideStart: function () {},
		slideEnd: function () {},
		click: function (order, index) {}
	};

	TinySwiper.prototype.init = function () {
		this.initSlides();
		this.initAutoPlay();
		this.initClickable();
		this.initNavigation();
		this.initPagination();
	};

	TinySwiper.prototype.initSlides = function () {

		var _this = this;
		var options = this.options;

		this.$slides = [];
		$(options.slides).each(function (idx) {
			var $this = $(this);
			$this.data('order', idx);
			_this.$slides.push($this)
		});

		this.$pages = options.pagination.el ? $(options.pagination.el) : undefined;

		this.visualLen = Math.min(options.slidesLen, this.$slides.length);
		this.firstVisit = true;
		this.animationFinishNum = 0;

		var scale = parseInt(this.visualLen) * 2;

		this.slidesOptions = [];
		this.centerIndex = Math.floor(this.visualLen / 2);

		var cw = this.$el.width(),
		 		ch = this.$el.height();
 		var sw = options.slidesProps.width,
 				sh = options.slidesProps.height;
		var unitW = sw / (scale * 1.0),
				unitH = sh / (scale * 1.0);
		var disW = Math.floor((cw - sw) / (2 * this.centerIndex)),
				disH = Math.floor((ch - sh) / (2 * this.centerIndex));

		for(var i = 0; i < this.visualLen; i++) {

			var dis = Math.abs(this.centerIndex - i);

			var width = Math.floor((unitW * (scale - dis))),
					height = Math.floor((unitH * (scale - dis))),
					top = Math.floor(dis * unitH / 2 + disH * 2),
					left = i <= this.centerIndex ?
									Math.floor(i * disW) : 
									Math.floor(cw - (this.centerIndex - dis) * disW - width),
					zIndex = this.centerIndex - dis + 1;

			this.slidesOptions.push({
				width: width,
				height: height,
				top: top,
				left: left,
				zIndex: zIndex
			});
		}

		this.resetPostion();
		this.setUp();

	};

	TinySwiper.prototype.initAutoPlay = function () {

		var _this = this;
		var options = this.options;

		if (options.autoplay) {
			clearInterval(this.timer);
			this.timer = setInterval(function () {
				_this.doNext();
			}, options.speed);
			this.$el.on('mouseover', function () {
				clearInterval(_this.timer);
			}).on('mouseout', function () {
				_this.timer = setInterval(function () {
					_this.doNext();
				}, options.speed);
			});
		}

	};

	TinySwiper.prototype.initClickable = function () {

		var _this = this;
		var options = this.options;

		if (options.clickable) {
			for (var k = 0, len = this.$slides.length; k < len; k++) {
				this.$slides[k].on('click', function () {
					var index = $(this).index();
					_this.doChange(index);
					options.click.call(this, parseInt($(this).data('order')), index);
				});
			}	
		}
	};

	TinySwiper.prototype.initNavigation = function () {

		var _this = this;
		var options = this.options,
				prev = options.navigation.prev,
				next = options.navigation.next;

		prev && $(prev).on('click', function () {
			_this.doPrev();
		});
			
		next && $(next).on('click', function () {
			_this.doNext();
		});

	};

	TinySwiper.prototype.initPagination = function () {

		var _this = this;
		var options = this.options;

		if (this.$pages) {
			this.$pages.each(function (idx) {
				$(this).on('click', function () {
					var index = -1;
					for (var i = 0, len = _this.$slides.length; i < len; i++) {
						if (idx === parseInt(_this.$slides[i].data('order'))) {
							index = i;
							break;
						}
					}
					_this.doChange(index);
				});
			});
		}
	
	};

	TinySwiper.prototype.resetPostion = function () {

		var _this = this;
		var options = this.options;

		var	total = this.$slides.length,
				initialIndex = (parseInt(options.initialIndex) || 0) % total;

		if (initialIndex < 0) {
			initialIndex = initialIndex + total;
		}

		var dis = Math.abs(initialIndex - this.centerIndex),
				flag = initialIndex > this.centerIndex;

		for (var i = 0; i < dis; i++) {
			if (flag) {
				this.$slides.push(this.$slides.shift());
			} else {
				this.$slides.unshift(this.$slides.pop());
			}
		}

	};

	TinySwiper.prototype.doPrev = function () {
		this.$slides.unshift(this.$slides.pop());
		this.setUp();
	};

	TinySwiper.prototype.doNext = function () {
		this.$slides.push(this.$slides.shift());
		this.setUp();
	};

	TinySwiper.prototype.doChange = function (index) {
		if (index > this.centerIndex) {
			for (var i = 0; i < index - this.centerIndex; i++) {
				this.$slides.push(this.$slides.shift());
			}
			this.setUp();
		} else if (index >= 0 && index < this.centerIndex) {
			for (var i = 0; i < this.centerIndex - index; i++) {
				this.$slides.unshift(this.$slides.pop());
			}
			this.setUp();
		}
	}

	TinySwiper.prototype.setUp = function () {

		var _this = this;
		var options = this.options;

		for (var j = 0, len = this.$slides.length; j < len; j++){
			this.$el.append(this.$slides[j]);
		}

		if (!this.firstVisit) {
			options.slideStart.call(null);
		}

		this.animationFinishNum = 0;

		for (var i = 0, len = this.$slides.length; i < len; i++) {

			if (i < this.visualLen) {
				this.$slides[i].css('display', 'block');
				this.doMove(this.$slides[i], this.slidesOptions[i], function () {
					this.animationFinishNum++;
					if (this.animationFinishNum === this.visualLen) {
						var activeClass = options.pagination.activeClass;
						if (activeClass) {
							var tempIndex = parseInt(_this.$slides[_this.centerIndex].data('order'));
							_this.$pages.eq(tempIndex).addClass(activeClass).siblings().removeClass(activeClass);
						}
						if (!this.firstVisit) {
							options.slideEnd.call(null);
						} else {
							this.firstVisit = false;
						}
					} 
				});
			} else {
					this.$slides[i]
							.css('display', 'none')
							.css('width', 0)
							.css('height', 0)
							.css('top', this.slidesOptions[this.centerIndex].top)
							.css('left', this.slidesOptions[this.centerIndex].left)
			}
		}
	};

	TinySwiper.prototype.doMove = function ($el, attrs, callback) {
		var _this = this;
		var options = this.options;
		clearInterval($el.timer);
		$el.timer = setInterval (function () {
			var isStop = true;
			for (var item in attrs) {
				var cur = parseFloat($el.css(item)) || 0;
				var speed = (attrs[item] - cur) / 5;
				speed = speed > 0 ? Math.ceil(speed) : Math.floor(speed);

				if (cur !== attrs[item]) {
					isStop = false;
					$el.css(item, cur + speed);
				}

			}
			if (isStop) {
				clearInterval($el.timer);
				callback && callback.apply(_this, arguments);
			}
		}, 30);
	};

	$.fn.tinySwiper = function (settings) {

		this.each(function () {

			var $this = $(this),
					data = $this.data('tiny.swiper'),
					options = $.extend({}, TinySwiper.DEFAULTS, typeof settings === 'object' && settings);

			if (!data) {
				$this.data('tiny.swiper', (data = new TinySwiper(this, options)));
			}

		});

		return this;
	};

	$.fn.tinySwiper.Construtor = TinySwiper;
	$.fn.tinySwiper.defaults = TinySwiper.DEFAULTS;

})(jQuery);
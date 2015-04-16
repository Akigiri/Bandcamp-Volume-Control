// ==UserScript==
// @name           Bandcamp Volume Control
// @description    Adds volume control to bandcamp.com
// @version        1.0.0
// @author         Akigiri
// @homepage       https://github.com/Akigiri/Bandcamp-Volume-Control
// @namespace      https://github.com/Akigiri
// @include        http://*.bandcamp.com/*
// @include        https://*.bandcamp.com/*
// @run-at         document-end
// ==/UserScript==

function Meter(options) {
	if (typeof options !== 'object') options = {};

	var _this  = this;
	var value  = options.value  || 0;
	var angle  = options.angle  || 270;
	var width  = options.width  || 10;
	var radius = options.radius || 30;
	var offset = {
		top   : options.offsetTop   || 50,
		left  : options.offsetLeft  || 50,
		angle : options.offsetAngle || 135
	};
	var color = {
		arc  : options.colorArc  || '#DDD',
		fill : options.colorFill || '#000',
		text : options.colorText || '#000'
	}
	var font = options.font || '16px Arial';

	var callback = function() {}
	var clicked  = false;
	var canvas   = document.createElement('canvas');
	var context  = canvas.getContext('2d');

	canvas.width  = options.canvasWidth  || 100;
	canvas.height = options.canvasHeight || 100;
	
	canvas.addEventListener('mousemove', eventHandler);
	canvas.addEventListener('mousedown', function(ev) {
		ev.preventDefault();
		clicked = true;
		eventHandler(ev);
	});
	document.addEventListener('mouseup', function() {
		clicked = false;
	});

	function eventHandler(ev) {
		if (clicked) {
			// relative cursor position to the center of canvas
			var bounding = canvas.getBoundingClientRect();
			var left = -canvas.width/2 + ev.clientX - bounding.left;
			var top  = canvas.height/2 - ev.clientY + bounding.top;

			var _angle = Math.atan(-top/left) * 180 / Math.PI;

			if (left < 0) _angle += 180;
			if (left >= 0 && top > 0) _angle += 360;
			
			// adjust measured position for meter properties
			_angle -= offset.angle;

			if (_angle < 0) _angle += 360;

			_angle = _angle * 360 / angle;

			if (0 <= _angle && _angle <= 360) {
				var newValue = _angle/360;

				_this.update(newValue);
				callback(newValue);
			}
		}
	}

	this.appendTo = function(parentElement) {
		parentElement.appendChild(canvas);

		return this;
	}

	this.clear = function() {
		context.clearRect(0, 0, canvas.width, canvas.height);

		return this;
	}

	this.draw = function() {
		const deg2rad = Math.PI / 180;

		var start   = offset.angle * deg2rad;
		var end     = start + angle * deg2rad;
		var current = start + value * angle * deg2rad;

		context.beginPath();
		context.arc(offset.left, offset.top, radius, start, current);
		context.lineWidth   = width;
		context.strokeStyle = color.fill;
		context.stroke();

		context.beginPath();
		context.arc(offset.left, offset.top, radius, current, end);
		context.lineWidth   = width;
		context.strokeStyle = color.arc;
		context.stroke();

		context.font         = font;
		context.textAlign    = 'center';
		context.textBaseline = 'middle';
		context.fillStyle    = color.text;
		context.fillText(Math.floor(value*100), offset.left, offset.top);

		return this;
	}

	this.update = function(newValue) {
		if (typeof newValue === 'number' || newValue > 0) value = newValue;

		return this.clear().draw();
	}

	this.onChange = function(cb) {
		if (typeof cb === 'function') callback = cb;

		return this;
	}
};

function Cookie(options) {
	var prefix = options.prefix || '';
	var domain = options.domain || '';
	var path   = options.path   || '/';
	var name   = options.name   || '';

	this.set = function(value) {
		document.cookie = prefix + name + '=' + value
						+ ';domain=' + domain
						+ ';path=' + path;
	}

	this.get = function() {
		var cookieName = prefix + name + '=';
		var cookies = document.cookie.split(';');

		for (cookie of cookies) {
			cookie = cookie.trim();
			if (cookie.indexOf(cookieName) == 0)
				return cookie.substring(cookieName.length);
		}
	}
}

function VolumeControl(parentElement) {
	var wrap, head, tail;

	wrap = document.createElement('div');
	head = document.createElement('div');
	tail = document.createElement('div');

	wrap.className = 'bvc-wrap';
	head.className = 'bvc-head';
	tail.className = 'bvc-tail';

	head.innerHTML = '<svg viewBox="0 0 75 75"><g><polygon points="39.389,13.769 22.235,28.606 6,28.606 6,47.699 21.989,47.699 39.389,62.75 39.389,13.769" style="stroke-width:5;stroke-linejoin:round;"/><path d="M 48.128,49.03 C 50.057,45.934 51.19,42.291 51.19,38.377 C 51.19,34.399 50.026,30.703 48.043,27.577" style="fill:none;stroke-width:5;stroke-linecap:round"/><path d="M 55.082,20.537 C 58.777,25.523 60.966,31.694 60.966,38.377 C 60.966,44.998 58.815,51.115 55.178,56.076" style="fill:none;stroke-width:5;stroke-linecap:round"/><path d="M 61.71,62.611 C 66.977,55.945 70.128,47.531 70.128,38.378 C 70.128,29.161 66.936,20.696 61.609,14.01" style="fill:none;stroke-width:5;stroke-linecap:round"/></g></svg>'; // http://commons.wikimedia.org/wiki/File:Speaker_Icon.svg
	
	wrap.appendChild(head);
	wrap.appendChild(tail);
	parentElement.appendChild(wrap);

	this.wrap = wrap;
	this.head = head;
	this.tail = tail;

	return this;
}

function changeVolume(value) {
	var players = document.getElementsByTagName('audio');

	volume = value;

	for (var i = 0, l = players.length; i < l; i++) {
		players[i].volume = volume;
	}
}

var volumeControl = new VolumeControl(document.getElementsByTagName('body')[0]);

var volumeCookie = new Cookie({
	prefix : 'BandcampVolumeControl_',
	domain : '.bandcamp.com',
	path   : '/',
	name   : 'volume'
});

var meter = new Meter({
	angle        : 270,
	width        : 4,
	radius       : 15,
	offsetTop    : 20,
	offsetLeft   : 20,
	offsetAngle  : 135,
	canvasWidth  : 40,
	canvasHeight : 40,
	colorArc     : '#ddd',
	colorFill    : '#71b2c3',
	colorText    : '#629aa9',
	font         : '10px Arial'});

var volume = 0.7;

meter
	.update(volume)
	.appendTo(volumeControl.tail)
	.onChange(function(value) {
		changeVolume(value);
		volumeCookie.set(value);
	});

setInterval(function() {
	var value = volumeCookie.get();

	value = parseFloat(value);

	if (isNaN(value)) {
		volumeCookie.set(volume);
	} else if (value != volume) {
		changeVolume(value);
		meter.update(value);
	}
},100);

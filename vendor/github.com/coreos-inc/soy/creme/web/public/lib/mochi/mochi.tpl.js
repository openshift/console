angular.module('mochi.ui.templates', []);
angular.module('mochi.ui.svg', []);

angular.module('mochi.ui.templates').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-templates/ui/facet-menu/menu.tpl.html',
    '<div class="cos-facet-menu">\n' +
    '  <div ng-show="!!title" class="cos-facet-menu__title" ng-bind="title"></div>\n' +
    '  <ul class="cos-facet-menu__option-list" ng-transclude></ul>\n' +
    '</div>\n' +
    '');
}]);

angular.module('mochi.ui.templates').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-templates/ui/facet-menu/option.tpl.html',
    '<li class="cos-facet-menu-option" ng-class="{\'cos-facet-option--active\': isActive}">\n' +
    '  <a href="#" ng-transclude></a>\n' +
    '</li>\n' +
    '');
}]);

angular.module('mochi.ui.templates').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-templates/ui/loader/loader.tpl.html',
    '<div class="cos-loader">\n' +
    '  <div class="cos-loader-dot__one"></div>\n' +
    '  <div class="cos-loader-dot__two"></div>\n' +
    '  <div class="cos-loader-dot__three"></div>\n' +
    '</div>\n' +
    '');
}]);

angular.module('mochi.ui.templates').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-templates/ui/modal/modal.backdrop.tpl.html',
    '<div class="modal-backdrop"\n' +
    '     modal-animation-class="fade"\n' +
    '     modal-in-class="in"\n' +
    '     ng-style="{\'z-index\': 1040 + (index && 1 || 0) + index*10}"\n' +
    '></div>\n' +
    '');
}]);

angular.module('mochi.ui.templates').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-templates/ui/modal/modal.window.tpl.html',
    '<div modal-render="{{$isRendered}}" tabindex="-1" role="dialog" class="modal"\n' +
    '    modal-animation-class="fade"\n' +
    '    modal-in-class="in"\n' +
    '	ng-style="{\'z-index\': 1050 + index*10, display: \'block\'}" ng-click="close($event)">\n' +
    '    <div class="modal-dialog" ng-class="size ? \'modal-\' + size : \'\'"><div class="modal-content" modal-transclude></div></div>\n' +
    '</div>\n' +
    '');
}]);

angular.module('mochi.ui.templates').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-templates/ui/navbar/navbar.tpl.html',
    '<div class="cos-navbar">\n' +
    '  <div class="cos-navbar__header">\n' +
    '    <a href="/" class="cos-navbar__logo-link">\n' +
    '      <img ng-if="logoSrc" class="cos-navbar__logo" ng-src="{{logoSrc}}"/>\n' +
    '    </a>\n' +
    '  </div>\n' +
    '  <button class="cos-toggle-btn pull-right" ng-click="toggle()">\n' +
    '    <span class="cos-toggle-btn__bar"></span>\n' +
    '    <span class="cos-toggle-btn__bar"></span>\n' +
    '    <span class="cos-toggle-btn__bar"></span>\n' +
    '  </button>\n' +
    '  <div ng-transclude class="cos-navbar__collapse" ng-class="{\'cos-navbar__collapse--open\': isOpen}"></div>\n' +
    '</div>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/tectonic-error.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 viewBox="0 0 212 230" style="enable-background:new 0 0 212 230;" xml:space="preserve">\n' +
    '<style type="text/css">\n' +
    '	.st0{enable-background:new    ;}\n' +
    '	.st1{clip-path:url(#XMLID_88_);}\n' +
    '	.st2{clip-path:url(#XMLID_89_);}\n' +
    '	.st3{opacity:0.4;clip-path:url(#XMLID_90_);enable-background:new    ;}\n' +
    '	.st4{clip-path:url(#XMLID_91_);}\n' +
    '	.st5{clip-path:url(#XMLID_92_);enable-background:new    ;}\n' +
    '	.st6{clip-path:url(#XMLID_93_);}\n' +
    '	.st7{clip-path:url(#XMLID_94_);}\n' +
    '	.st8{clip-path:url(#XMLID_95_);fill:#F2F2F2;}\n' +
    '	.st9{clip-path:url(#XMLID_96_);fill:none;stroke:#9B9B9B;stroke-miterlimit:10;stroke-dasharray:4,4;}\n' +
    '	.st10{clip-path:url(#XMLID_97_);}\n' +
    '	.st11{clip-path:url(#XMLID_98_);fill:#F2F2F2;}\n' +
    '	.st12{clip-path:url(#XMLID_99_);fill:none;stroke:#9B9B9B;stroke-miterlimit:10;stroke-dasharray:4,4;}\n' +
    '	.st13{clip-path:url(#XMLID_100_);}\n' +
    '	.st14{clip-path:url(#XMLID_101_);fill:#F2F2F2;}\n' +
    '	.st15{clip-path:url(#XMLID_102_);fill:none;stroke:#9B9B9B;stroke-miterlimit:10;stroke-dasharray:4,4;}\n' +
    '</style>\n' +
    '<g id="XMLID_1_" class="st0">\n' +
    '	<g id="XMLID_2_">\n' +
    '		<defs>\n' +
    '			<rect id="XMLID_47_" x="1" y="1" width="210" height="228"/>\n' +
    '		</defs>\n' +
    '		<clipPath id="XMLID_88_">\n' +
    '			<use xlink:href="#XMLID_47_"  style="overflow:visible;"/>\n' +
    '		</clipPath>\n' +
    '		<g id="XMLID_3_" class="st1">\n' +
    '			<defs>\n' +
    '				<rect id="XMLID_46_" x="-444" y="-200" width="1100" height="1000"/>\n' +
    '			</defs>\n' +
    '			<clipPath id="XMLID_89_">\n' +
    '				<use xlink:href="#XMLID_46_"  style="overflow:visible;"/>\n' +
    '			</clipPath>\n' +
    '			<g id="XMLID_4_" class="st2">\n' +
    '				<defs>\n' +
    '					<rect id="XMLID_45_" x="1" y="1" width="210" height="228"/>\n' +
    '				</defs>\n' +
    '				<clipPath id="XMLID_90_">\n' +
    '					<use xlink:href="#XMLID_45_"  style="overflow:visible;"/>\n' +
    '				</clipPath>\n' +
    '				<g id="XMLID_5_" class="st3">\n' +
    '					<g id="XMLID_6_">\n' +
    '						<defs>\n' +
    '							<rect id="XMLID_44_" x="1" y="1" width="210" height="228"/>\n' +
    '						</defs>\n' +
    '						<clipPath id="XMLID_91_">\n' +
    '							<use xlink:href="#XMLID_44_"  style="overflow:visible;"/>\n' +
    '						</clipPath>\n' +
    '						<g id="XMLID_7_" class="st4">\n' +
    '							<defs>\n' +
    '								<rect id="XMLID_43_" x="1" y="1" width="210" height="228"/>\n' +
    '							</defs>\n' +
    '							<clipPath id="XMLID_92_">\n' +
    '								<use xlink:href="#XMLID_43_"  style="overflow:visible;"/>\n' +
    '							</clipPath>\n' +
    '							<g id="XMLID_8_" class="st5">\n' +
    '								<g id="XMLID_9_">\n' +
    '									<defs>\n' +
    '										<rect id="XMLID_42_" x="1" y="1" width="210" height="228"/>\n' +
    '									</defs>\n' +
    '									<clipPath id="XMLID_93_">\n' +
    '										<use xlink:href="#XMLID_42_"  style="overflow:visible;"/>\n' +
    '									</clipPath>\n' +
    '									<g id="XMLID_10_" class="st6">\n' +
    '										<defs>\n' +
    '											<polyline id="XMLID_14_" points="106,65.4 68.9,82 73.8,84.8 106,70.4 143.4,87.1 139.2,128 110.6,148.9 110.6,154.6 \n' +
    '												143.5,130.6 148.3,84.3 106,65.4 											"/>\n' +
    '										</defs>\n' +
    '										<clipPath id="XMLID_94_">\n' +
    '											<use xlink:href="#XMLID_14_"  style="overflow:visible;"/>\n' +
    '										</clipPath>\n' +
    '										<g id="XMLID_11_" class="st7">\n' +
    '											<defs>\n' +
    '												<rect id="XMLID_13_" x="1" y="1" width="210" height="228"/>\n' +
    '											</defs>\n' +
    '											<clipPath id="XMLID_95_">\n' +
    '												<use xlink:href="#XMLID_13_"  style="overflow:visible;"/>\n' +
    '											</clipPath>\n' +
    '											<rect id="XMLID_12_" x="63.9" y="60.4" class="st8" width="89.5" height="99.2"/>\n' +
    '										</g>\n' +
    '									</g>\n' +
    '									<g id="XMLID_15_" class="st6">\n' +
    '										<defs>\n' +
    '											<rect id="XMLID_17_" x="1" y="1" width="210" height="228"/>\n' +
    '										</defs>\n' +
    '										<clipPath id="XMLID_96_">\n' +
    '											<use xlink:href="#XMLID_17_"  style="overflow:visible;"/>\n' +
    '										</clipPath>\n' +
    '										<polyline id="XMLID_16_" class="st9" points="106,65.4 68.9,82 73.8,84.8 106,70.4 143.4,87.1 139.2,128 110.6,148.9 \n' +
    '											110.6,154.6 143.5,130.6 148.3,84.3 106,65.4 										"/>\n' +
    '									</g>\n' +
    '									<g id="XMLID_18_" class="st6">\n' +
    '										<defs>\n' +
    '											<path id="XMLID_22_" d="M106,2.5L2.4,48.8L14.3,162l91.7,66.9l91.7-66.9l11.9-113.2L106,2.5 M106,7.5l98.7,44.1\n' +
    '												l-11.3,107.9L106,223.3l-87.4-63.8L7.3,51.6L106,7.5"/>\n' +
    '										</defs>\n' +
    '										<clipPath id="XMLID_97_">\n' +
    '											<use xlink:href="#XMLID_22_"  style="overflow:visible;"/>\n' +
    '										</clipPath>\n' +
    '										<g id="XMLID_19_" class="st10">\n' +
    '											<defs>\n' +
    '												<rect id="XMLID_21_" x="1" y="1" width="210" height="228"/>\n' +
    '											</defs>\n' +
    '											<clipPath id="XMLID_98_">\n' +
    '												<use xlink:href="#XMLID_21_"  style="overflow:visible;"/>\n' +
    '											</clipPath>\n' +
    '											<rect id="XMLID_20_" x="-2.6" y="-2.5" class="st11" width="217.1" height="236.5"/>\n' +
    '										</g>\n' +
    '									</g>\n' +
    '									<g id="XMLID_25_" class="st6">\n' +
    '										<defs>\n' +
    '											<rect id="XMLID_29_" x="1" y="1" width="210" height="228"/>\n' +
    '										</defs>\n' +
    '										<clipPath id="XMLID_99_">\n' +
    '											<use xlink:href="#XMLID_29_"  style="overflow:visible;"/>\n' +
    '										</clipPath>\n' +
    '										<path id="XMLID_26_" class="st12" d="M106,2.5L2.4,48.8L14.3,162l91.7,66.9l91.7-66.9l11.9-113.2L106,2.5 M106,7.5\n' +
    '											l98.7,44.1l-11.3,107.9L106,223.3l-87.4-63.8L7.3,51.6L106,7.5"/>\n' +
    '									</g>\n' +
    '									<g id="XMLID_30_" class="st6">\n' +
    '										<defs>\n' +
    '											<path id="XMLID_34_" d="M106,33.8L32.9,66.4l73.1,42.4v84.7l64.7-47.2l8.4-79.9L106,33.8 M106,38.8l68.2,30.5l-7.8,74.5\n' +
    '												l-55.8,40.7v-78.4L43,67L106,38.8"/>\n' +
    '										</defs>\n' +
    '										<clipPath id="XMLID_100_">\n' +
    '											<use xlink:href="#XMLID_34_"  style="overflow:visible;"/>\n' +
    '										</clipPath>\n' +
    '										<g id="XMLID_31_" class="st13">\n' +
    '											<defs>\n' +
    '												<rect id="XMLID_33_" x="1" y="1" width="210" height="228"/>\n' +
    '											</defs>\n' +
    '											<clipPath id="XMLID_101_">\n' +
    '												<use xlink:href="#XMLID_33_"  style="overflow:visible;"/>\n' +
    '											</clipPath>\n' +
    '											<rect id="XMLID_32_" x="27.9" y="28.8" class="st14" width="156.1" height="169.8"/>\n' +
    '										</g>\n' +
    '									</g>\n' +
    '									<g id="XMLID_37_" class="st6">\n' +
    '										<defs>\n' +
    '											<rect id="XMLID_41_" x="1" y="1" width="210" height="228"/>\n' +
    '										</defs>\n' +
    '										<clipPath id="XMLID_102_">\n' +
    '											<use xlink:href="#XMLID_41_"  style="overflow:visible;"/>\n' +
    '										</clipPath>\n' +
    '										<path id="XMLID_38_" class="st15" d="M106,33.8L32.9,66.4l73.1,42.4v84.7l64.7-47.2l8.4-79.9L106,33.8 M106,38.8\n' +
    '											l68.2,30.5l-7.8,74.5l-55.8,40.7v-78.4L43,67L106,38.8"/>\n' +
    '									</g>\n' +
    '								</g>\n' +
    '							</g>\n' +
    '						</g>\n' +
    '					</g>\n' +
    '				</g>\n' +
    '			</g>\n' +
    '		</g>\n' +
    '	</g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-add.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '  preserveAspectRatio="xMinYMin" viewBox="0 0 72.556 61" enable-background="new 0 0 72.556 61" xml:space="preserve">\n' +
    '  <path d="M34.521,8v11.088v23v10.737c0,2.209,1.791,4,4,4c2.209,0,4-1.791,4-4V42.067V19.109V8c0-2.209-1.791-4-4-4\n' +
    '  C36.312,4,34.521,5.791,34.521,8z"/>\n' +
    '  <path d="M16.109,34.412h11.088h23h10.737c2.209,0,4-1.791,4-4c0-2.209-1.791-4-4-4H50.175H27.217H16.109c-2.209,0-4,1.791-4,4\n' +
    '  C12.109,32.621,13.9,34.412,16.109,34.412z"/>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-back.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '  preserveAspectRatio="xMinYMin" viewBox="0 0 73.356 61" enable-background="new 0 0 73.356 61" xml:space="preserve">\n' +
    '  <path d="M5.27,33.226l22.428,22.428c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L17.77,34.413h48.514\n' +
    '  c2.209,0,4-1.791,4-4s-1.791-4-4-4H17.749l15.604-15.582c1.563-1.561,1.565-4.094,0.004-5.657C32.576,4.391,31.552,4,30.527,4\n' +
    '  c-1.023,0-2.046,0.39-2.827,1.169L5.272,27.567c-0.751,0.75-1.173,1.768-1.173,2.829C4.098,31.458,4.52,32.476,5.27,33.226z"/>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-builds.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="43.2px" height="33.353px" viewBox="0 0 43.2 33.353" enable-background="new 0 0 43.2 33.353" xml:space="preserve">\n' +
    '<rect x="0.835" y="1.015" fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" width="41.529" height="7.1"/>\n' +
    '<rect x="0.835" y="13.11" fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" width="41.529" height="7.1"/>\n' +
    '<rect x="0.835" y="25.205" fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" width="41.529" height="7.1"/>\n' +
    '<rect x="2.513" y="2.828" fill="#7BC142" width="21.287" height="3.572"/>\n' +
    '<rect x="2.513" y="14.874" fill="#7BC142" width="9.395" height="3.572"/>\n' +
    '<rect x="2.513" y="26.969" fill="#7BC142" width="32.438" height="3.572"/>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-delete.svg',
    '<svg version="1.1" fill="#f00" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"\n' +
    '  x="0px" y="0px" preserveAspectRatio="xMinYMin" viewBox="0 0 76.143 61" enable-background="new 0 0 76.143 61" xml:space="preserve">\n' +
    '  <path d="M49.41,13.505l-6.035,6.035L27.112,35.803l-6.035,6.035c-1.562,1.562-1.562,4.095,0,5.657c1.562,1.562,4.095,1.562,5.657,0\n' +
    '  l6.05-6.05l16.234-16.234l6.05-6.05c1.562-1.562,1.562-4.095,0-5.657C53.505,11.943,50.972,11.943,49.41,13.505z"/>\n' +
    '  <path d="M21.077,19.162l6.035,6.035L43.375,41.46l6.035,6.035c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657\n' +
    '  l-6.05-6.05L32.783,19.555l-6.05-6.05c-1.562-1.562-4.095-1.562-5.657,0C19.515,15.067,19.515,17.6,21.077,19.162z"/>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-history.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="41.555px" height="39.784px" viewBox="0 0 41.555 39.784" enable-background="new 0 0 41.555 39.784" xml:space="preserve">\n' +
    '<path fill="none" stroke="#231F20" stroke-miterlimit="10" d="M6.082,30.16"/>\n' +
    '<path fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" d="M6.082,30.16c3.317,4.8,8.858,7.945,15.134,7.945\n' +
    '	c10.153,0,18.383-8.23,18.383-18.383S31.369,1.339,21.216,1.339c-6.693,0-12.551,3.577-15.765,8.923"/>\n' +
    '<polygon fill="#231F20" points="1.484,7.562 9.631,12.791 1.989,16.222 "/>\n' +
    '<polyline fill="none" stroke="#231F20" stroke-width="2.5" stroke-miterlimit="10" points="22.582,9.403 22.582,22.607 \n' +
    '	13.636,22.607 "/>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-info.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="39.243px" height="39.123px" viewBox="0 0 39.243 39.123" enable-background="new 0 0 39.243 39.123" xml:space="preserve">\n' +
    '<circle fill="#FFFFFF" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" cx="19.685" cy="19.518" r="18.383"/>\n' +
    '<g>\n' +
    '	<path fill="#231F20" d="M16.307,25.816v-1.352c0-0.183,0.066-0.341,0.2-0.475s0.292-0.201,0.476-0.201h0.676v-4.054h-0.676\n' +
    '		c-0.184,0-0.342-0.067-0.476-0.201c-0.134-0.133-0.2-0.292-0.2-0.475v-1.351c0-0.183,0.066-0.341,0.2-0.475\n' +
    '		s0.292-0.201,0.476-0.201h4.054c0.184,0,0.342,0.067,0.476,0.201s0.2,0.292,0.2,0.475v6.081h0.676c0.183,0,0.341,0.067,0.475,0.201\n' +
    '		s0.201,0.292,0.201,0.475v1.352c0,0.183-0.067,0.342-0.201,0.475c-0.134,0.134-0.292,0.201-0.475,0.201h-5.405\n' +
    '		c-0.184,0-0.342-0.067-0.476-0.201C16.373,26.157,16.307,25.998,16.307,25.816z M17.658,14.329v-2.027\n' +
    '		c0-0.183,0.066-0.341,0.2-0.475s0.292-0.201,0.476-0.201h2.702c0.184,0,0.342,0.067,0.476,0.201s0.2,0.292,0.2,0.475v2.027\n' +
    '		c0,0.183-0.066,0.341-0.2,0.475s-0.292,0.201-0.476,0.201h-2.702c-0.184,0-0.342-0.067-0.476-0.201S17.658,14.512,17.658,14.329z"\n' +
    '		/>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-layers.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="43.532px" height="43.878px" viewBox="0 0 43.532 43.878" enable-background="new 0 0 43.532 43.878" xml:space="preserve">\n' +
    '<g>\n' +
    '	<path fill="#FFFFFF" d="M23.396,42.146c-0.863,0.484-2.276,0.484-3.14,0L1.801,31.791c-0.863-0.484-0.863-1.277,0-1.762\n' +
    '		l18.455-10.355c0.863-0.484,2.276-0.484,3.14,0l18.455,10.355c0.863,0.484,0.863,1.277,0,1.762L23.396,42.146z"/>\n' +
    '	<path fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" d="M23.396,42.146c-0.863,0.484-2.276,0.484-3.14,0\n' +
    '		L1.801,31.791c-0.863-0.484-0.863-1.277,0-1.762l18.455-10.355c0.863-0.484,2.276-0.484,3.14,0l18.455,10.355\n' +
    '		c0.863,0.484,0.863,1.277,0,1.762L23.396,42.146z"/>\n' +
    '</g>\n' +
    '<g>\n' +
    '	<path fill="#FFFFFF" d="M23.396,33.089c-0.863,0.484-2.276,0.484-3.14,0L1.801,22.733c-0.863-0.484-0.863-1.277,0-1.762\n' +
    '		l18.455-10.355c0.863-0.484,2.276-0.484,3.14,0l18.455,10.355c0.863,0.484,0.863,1.277,0,1.762L23.396,33.089z"/>\n' +
    '	<path fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" d="M23.396,33.089c-0.863,0.484-2.276,0.484-3.14,0\n' +
    '		L1.801,22.733c-0.863-0.484-0.863-1.277,0-1.762l18.455-10.355c0.863-0.484,2.276-0.484,3.14,0l18.455,10.355\n' +
    '		c0.863,0.484,0.863,1.277,0,1.762L23.396,33.089z"/>\n' +
    '</g>\n' +
    '<g>\n' +
    '	<path fill="#FFFFFF" d="M23.396,24.031c-0.863,0.484-2.276,0.484-3.14,0L1.801,13.676c-0.863-0.484-0.863-1.277,0-1.762\n' +
    '		L20.257,1.559c0.863-0.484,2.276-0.484,3.14,0l18.455,10.355c0.863,0.484,0.863,1.277,0,1.762L23.396,24.031z"/>\n' +
    '	<path fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" d="M23.396,24.031c-0.863,0.484-2.276,0.484-3.14,0\n' +
    '		L1.801,13.676c-0.863-0.484-0.863-1.277,0-1.762L20.257,1.559c0.863-0.484,2.276-0.484,3.14,0l18.455,10.355\n' +
    '		c0.863,0.484,0.863,1.277,0,1.762L23.396,24.031z"/>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-list.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="41.435px" height="33.534px" viewBox="0 0 41.435 33.534" enable-background="new 0 0 41.435 33.534" xml:space="preserve">\n' +
    '<line fill="none" stroke="#231F20" stroke-width="2" stroke-miterlimit="10" x1="12.846" y1="9.133" x2="32.401" y2="9.133"/>\n' +
    '<line fill="none" stroke="#231F20" stroke-width="2" stroke-miterlimit="10" x1="12.846" y1="24.048" x2="32.401" y2="24.048"/>\n' +
    '<line fill="none" stroke="#231F20" stroke-width="2" stroke-miterlimit="10" x1="12.846" y1="16.591" x2="32.401" y2="16.591"/>\n' +
    '<rect x="6.934" y="7.95" fill="#231F20" width="2.365" height="2.365"/>\n' +
    '<rect x="6.934" y="15.408" fill="#231F20" width="2.365" height="2.365"/>\n' +
    '<rect x="6.934" y="22.866" fill="#231F20" width="2.365" height="2.365"/>\n' +
    '<rect x="1.725" y="1.581" fill="none" stroke="#231F20" stroke-miterlimit="10" width="38.19" height="30.307"/>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-reboot.svg',
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 preserveAspectRatio="xMinYMin" viewBox="0 0 65.947 65.41" enable-background="new 0 0 65.947 65.41" xml:space="preserve">\n' +
    '<g>\n' +
    '	<path d="M22.014,15.949c2.428-1.575,5.211-2.632,8.205-3.03c0,0,1.846-0.106,2.797-0.097C44.113,12.932,53.022,22,52.954,33.088\n' +
    '		l11.226-1.075C63.884,19.558,56.337,8.875,45.553,4.081c-0.043-0.025-0.07-0.061-0.115-0.08c-3.756-1.645-7.896-2.578-12.25-2.621\n' +
    '		c-0.014,0-0.025,0.002-0.039,0.002c-0.006,0-0.012-0.002-0.02-0.002c-0.691-0.006-1.371,0.021-2.051,0.066\n' +
    '		c-0.475,0.026-0.941,0.073-1.414,0.12c-0.072,0.008-0.148,0.011-0.221,0.02v0.006c-5.494,0.601-10.578,2.603-14.848,5.678\n' +
    '		l-3.068-4.523L7.038,21.636l18.849-2.034L22.014,15.949z"/>\n' +
    '	<path d="M44.204,48.517c-2.428,1.575-5.211,2.632-8.205,3.03c0,0-1.846,0.106-2.797,0.097c-11.098-0.11-20.007-9.178-19.938-20.266\n' +
    '		L2.038,32.454c0.296,12.454,7.843,23.138,18.627,27.932c0.043,0.025,0.07,0.06,0.115,0.08c3.756,1.644,7.896,2.578,12.25,2.621\n' +
    '		c0.014,0,0.025-0.002,0.039-0.002c0.006,0,0.012,0.002,0.02,0.002c0.691,0.006,1.371-0.021,2.051-0.065\n' +
    '		c0.475-0.026,0.941-0.073,1.414-0.12c0.072-0.008,0.148-0.011,0.221-0.02v-0.006c5.494-0.601,10.578-2.604,14.848-5.678\n' +
    '		l3.068,4.523L59.18,42.83l-18.849,2.034L44.204,48.517z"/>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-receipt.svg',
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
    '<svg width="25px" height="29px" viewBox="0 0 25 29" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">\n' +
    '    <!-- Generator: Sketch 3.3.2 (12043) - http://www.bohemiancoding.com/sketch -->\n' +
    '    <title>Imported Layers Copy</title>\n' +
    '    <desc>Created with Sketch.</desc>\n' +
    '    <defs></defs>\n' +
    '    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">\n' +
    '        <g id="03d---Confirmation-CC" sketch:type="MSArtboardGroup" transform="translate(-748.000000, -185.000000)">\n' +
    '            <g id="Imported-Layers-Copy" sketch:type="MSLayerGroup" transform="translate(749.000000, 186.000000)">\n' +
    '                <path d="M4.01940541,22.3864595 L7.70189189,26.0689459 L11.3843784,22.3864595 L15.0668649,26.0689459 L18.7493514,22.3864595 L22.4821892,26.1189865 L22.4831216,26.1189865 L22.4831216,6.63052703 L15.7478514,0.144216216 L0.285635135,0.144216216 L0.285635135,26.1189865 L0.286567568,26.1189865 L4.01940541,22.3864595 L4.01940541,22.3864595 Z" id="Fill-1" fill="#FFFFFF" sketch:type="MSShapeGroup"></path>\n' +
    '                <path d="M4.01940541,22.3864595 L7.70189189,26.0689459 L11.3843784,22.3864595 L15.0668649,26.0689459 L18.7493514,22.3864595 L22.4821892,26.1189865 L22.4831216,26.1189865 L22.4831216,6.63052703 L15.7478514,0.144216216 L0.285635135,0.144216216 L0.285635135,26.1189865 L0.286567568,26.1189865 L4.01940541,22.3864595 L4.01940541,22.3864595 Z" id="Stroke-2" stroke="#2EC98E" stroke-width="2" sketch:type="MSShapeGroup"></path>\n' +
    '                <path d="M15.6076757,0.222851351 L15.6076757,6.90341892 L22.5036351,6.90341892" id="Stroke-3" stroke="#2EC98E" stroke-width="2" sketch:type="MSShapeGroup"></path>\n' +
    '                <path d="M3.72972973,11.3654189 L19.4775811,11.3654189 M3.72972973,17.0638243 L19.4775811,17.0638243" id="Stroke-5" stroke="#2EC98E" stroke-width="2" sketch:type="MSShapeGroup"></path>\n' +
    '            </g>\n' +
    '        </g>\n' +
    '    </g>\n' +
    '</svg>');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-right-arrow.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="6px" height="10px" viewBox="0 0 6 10" enable-background="new 0 0 6 10" xml:space="preserve">\n' +
    '<g>\n' +
    '	<polygon fill="#333333" points="0,0 0,10 6,5 	"/>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-settings.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="39.303px" height="39.904px" viewBox="0 0 39.303 39.904" enable-background="new 0 0 39.303 39.904" xml:space="preserve">\n' +
    '<line fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" x1="4.974" y1="0.58" x2="4.974" y2="39.175"/>\n' +
    '<line fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" x1="19.723" y1="0.58" x2="19.723" y2="39.175"/>\n' +
    '<line fill="none" stroke="#231F20" stroke-width="1.5" stroke-miterlimit="10" x1="34.473" y1="0.58" x2="34.473" y2="39.175"/>\n' +
    '<circle fill="#FFFFFF" stroke="#231F20" stroke-miterlimit="10" cx="4.974" cy="16.057" r="3.92"/>\n' +
    '<circle fill="#FFFFFF" stroke="#231F20" stroke-miterlimit="10" cx="19.723" cy="27.749" r="3.92"/>\n' +
    '<circle fill="#FFFFFF" stroke="#231F20" stroke-miterlimit="10" cx="34.473" cy="11.363" r="3.92"/>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/icon/icon-tags.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="43.69px" height="41.827px" viewBox="0 0 43.69 41.827" enable-background="new 0 0 43.69 41.827" xml:space="preserve">\n' +
    '<path fill="#FFFFFF" d="M2.264,19.546c0.286,0.69,0.63,1.233,1.021,1.615l18.38,18.397c0.626,0.628,1.602,0.642,2.293-0.015\n' +
    '	l9.043-9.062c0.315-0.316,0.463-0.676,0.463-1.131c0-0.443-0.156-0.824-0.477-1.163l-7.691-7.683\n' +
    '	c-5.528-0.004-14.08-0.009-14.08-0.009c-0.929,0-1.879-0.208-2.87-0.618c-1.012-0.419-1.844-0.953-2.477-1.585l-4.037-4.037v3.42\n' +
    '	C1.833,18.225,1.978,18.855,2.264,19.546z"/>\n' +
    '<path fill="#231F20" d="M34.063,27.141l-6.642-6.635c-0.331,0-0.684,0-1.062-0.001l7.174,7.166c0.455,0.48,0.682,1.04,0.682,1.679\n' +
    '	c0,0.652-0.227,1.205-0.682,1.661l-9.059,9.076c-0.48,0.455-1.04,0.682-1.679,0.682c-0.652,0-1.205-0.227-1.66-0.682L2.762,21.697\n' +
    '	c-0.468-0.456-0.864-1.076-1.19-1.865c-0.326-0.787-0.488-1.505-0.488-2.158v-4.17l-0.64-0.64c-0.042-0.042-0.071-0.091-0.11-0.134\n' +
    '	v4.944c0,0.748,0.184,1.571,0.545,2.445c0.365,0.879,0.822,1.59,1.353,2.107l18.373,18.39c0.599,0.599,1.335,0.902,2.19,0.902\n' +
    '	c0.835,0,1.573-0.299,2.211-0.902l9.059-9.077c0.598-0.6,0.9-1.337,0.9-2.19C34.964,28.517,34.666,27.779,34.063,27.141z"/>\n' +
    '<path fill="#231F20" d="M32.988,28.187c0.32,0.339,0.477,0.72,0.477,1.163c0,0.455-0.147,0.814-0.463,1.131l-9.043,9.062\n' +
    '	c-0.691,0.656-1.667,0.643-2.293,0.015L3.285,21.16c-0.391-0.381-0.735-0.925-1.021-1.615c-0.286-0.691-0.431-1.32-0.431-1.871\n' +
    '	v-3.42l-0.75-0.75v4.17c0,0.652,0.163,1.371,0.488,2.158c0.327,0.788,0.722,1.408,1.19,1.865l18.373,18.39\n' +
    '	c0.455,0.455,1.008,0.682,1.66,0.682c0.639,0,1.199-0.227,1.679-0.682l9.059-9.076c0.455-0.456,0.682-1.009,0.682-1.661\n' +
    '	c0-0.639-0.227-1.199-0.682-1.679l-7.174-7.166c-0.338,0-0.694,0-1.062-0.001L32.988,28.187z"/>\n' +
    '<path fill="#FFFFFF" d="M6.987,11.93c-0.455,0-0.818,0.15-1.141,0.473c-0.321,0.323-0.472,0.685-0.472,1.139s0.15,0.816,0.473,1.14\n' +
    '	c0.64,0.641,1.634,0.644,2.279-0.001c0.322-0.322,0.472-0.684,0.472-1.139s-0.15-0.817-0.472-1.139\n' +
    '	C7.804,12.081,7.441,11.93,6.987,11.93z"/>\n' +
    '<path fill="#FFFFFF" d="M9.348,13.543c0-0.652-0.23-1.208-0.691-1.669c-0.461-0.461-1.018-0.693-1.669-0.693\n' +
    '	c-0.652,0-1.209,0.231-1.671,0.693c-0.46,0.461-0.691,1.017-0.691,1.669c0,0.652,0.231,1.208,0.691,1.669\n' +
    '	c0.461,0.461,1.018,0.691,1.671,0.691c0.651,0,1.208-0.23,1.669-0.691C9.118,14.751,9.348,14.195,9.348,13.543z M8.126,14.682\n' +
    '	c-0.645,0.645-1.639,0.642-2.279,0.001c-0.322-0.324-0.473-0.686-0.473-1.14s0.15-0.816,0.472-1.139\n' +
    '	c0.323-0.323,0.686-0.473,1.141-0.473c0.454,0,0.816,0.15,1.139,0.473c0.322,0.322,0.472,0.684,0.472,1.139\n' +
    '	S8.448,14.36,8.126,14.682z"/>\n' +
    '<path fill="#FFFFFF" d="M9.187,15.742c0.604-0.604,0.911-1.345,0.911-2.2s-0.307-1.595-0.911-2.2\n' +
    '	c-0.605-0.605-1.346-0.913-2.2-0.913c-0.855,0-1.596,0.307-2.202,0.914c-0.604,0.606-0.91,1.346-0.91,2.199s0.306,1.593,0.911,2.2\n' +
    '	c0.604,0.604,1.345,0.911,2.201,0.911C7.842,16.654,8.582,16.347,9.187,15.742z M5.316,15.212c-0.46-0.461-0.691-1.017-0.691-1.669\n' +
    '	c0-0.652,0.231-1.208,0.691-1.669c0.461-0.461,1.018-0.693,1.671-0.693c0.651,0,1.208,0.231,1.669,0.693\n' +
    '	c0.461,0.461,0.691,1.017,0.691,1.669c0,0.652-0.23,1.208-0.691,1.669c-0.461,0.461-1.018,0.691-1.669,0.691\n' +
    '	C6.335,15.904,5.778,15.674,5.316,15.212z"/>\n' +
    '<g>\n' +
    '	<path fill="#010101" d="M16.071,25.005l0.91,0.909l2.419-2.419l-0.785-0.784l0.6-0.601c0.541,0.37,0.949,0.541,1.424,0.659\n' +
    '		l0.712,0.712l-3.402,3.401l0.785,0.785l-0.785,0.785l-2.663-2.664L16.071,25.005z"/>\n' +
    '	<path fill="#010101" d="M20.436,28.658c0.336,0.336,0.323,0.851-0.026,1.199c-0.343,0.344-0.857,0.357-1.194,0.021\n' +
    '		c-0.336-0.336-0.322-0.851,0.021-1.193C19.586,28.336,20.1,28.322,20.436,28.658z"/>\n' +
    '	<path fill="#010101" d="M22.639,28.922c1.424-1.424,2.756-1.555,3.652-0.658s0.765,2.229-0.659,3.652s-2.788,1.589-3.686,0.691\n' +
    '		C21.05,31.711,21.215,30.345,22.639,28.922z M24.715,30.999c1.147-1.147,1.154-1.655,0.824-1.984\n' +
    '		c-0.322-0.323-0.837-0.323-1.984,0.824c-1.14,1.141-1.179,1.694-0.856,2.017C23.028,32.185,23.575,32.139,24.715,30.999z"/>\n' +
    '</g>\n' +
    '<path fill="#FFFFFF" stroke="#231F20" stroke-width="1.5" d="M7.189,16.973l-5.427-5.427c-0.453-0.453-0.678-1.009-0.679-1.67\n' +
    '	c0-0.66,0.226-1.218,0.678-1.669l5.428-5.428c0.46-0.46,1.085-0.853,1.872-1.18s1.511-0.489,2.172-0.49l29.005-0.013\n' +
    '	c0.661,0.018,1.218,0.253,1.669,0.705c0.461,0.461,0.692,1.013,0.692,1.657l0.012,12.823c-0.018,0.661-0.253,1.218-0.705,1.669\n' +
    '	c-0.461,0.461-1.013,0.692-1.656,0.692L11.22,18.63c-0.653,0.009-1.372-0.15-2.16-0.477C8.273,17.827,7.65,17.434,7.189,16.973z"/>\n' +
    '<g>\n' +
    '	<path fill="#010101" d="M16.913,6.777h1.25v4.7c0,0.263,0.119,0.349,0.221,0.349c0.051,0,0.085,0,0.153-0.017l0.153,0.926\n' +
    '		c-0.136,0.06-0.348,0.102-0.629,0.102c-0.858,0-1.147-0.561-1.147-1.411V6.777z"/>\n' +
    '	<path fill="#010101" d="M21.562,10.024C21.537,9.65,21.35,9.412,20.9,9.412c-0.357,0-0.714,0.145-1.122,0.382L19.336,8.97\n' +
    '		c0.536-0.323,1.139-0.552,1.802-0.552c1.08,0,1.674,0.612,1.674,1.904v2.414h-1.02l-0.093-0.434h-0.025\n' +
    '		c-0.357,0.314-0.756,0.536-1.232,0.536c-0.765,0-1.25-0.561-1.25-1.275C19.191,10.678,19.897,10.194,21.562,10.024z M20.866,11.868\n' +
    '		c0.289,0,0.476-0.136,0.697-0.357v-0.74c-0.892,0.119-1.181,0.374-1.181,0.697C20.381,11.74,20.568,11.868,20.866,11.868z"/>\n' +
    '	<path fill="#010101" d="M24.053,9.497h-0.578V8.571l0.646-0.051l0.145-1.122h1.036v1.122h1.012v0.978h-1.012v1.691\n' +
    '		c0,0.476,0.213,0.671,0.544,0.671c0.137,0,0.289-0.042,0.399-0.085l0.196,0.91c-0.222,0.068-0.527,0.153-0.936,0.153\n' +
    '		c-1.045,0-1.453-0.654-1.453-1.632V9.497z"/>\n' +
    '	<path fill="#010101" d="M28.796,8.418c1.198,0,1.793,0.875,1.793,2.022c0,0.221-0.025,0.425-0.051,0.527h-2.524\n' +
    '		c0.111,0.637,0.536,0.917,1.097,0.917c0.314,0,0.604-0.093,0.909-0.28l0.417,0.756c-0.434,0.297-0.994,0.476-1.496,0.476\n' +
    '		c-1.207,0-2.133-0.816-2.133-2.21C26.808,9.259,27.784,8.418,28.796,8.418z M29.528,10.194c0-0.485-0.204-0.825-0.706-0.825\n' +
    '		c-0.391,0-0.73,0.264-0.815,0.825H29.528z"/>\n' +
    '	<path fill="#010101" d="M31.644,11.469c0.383,0.289,0.73,0.442,1.088,0.442c0.374,0,0.535-0.136,0.535-0.357\n' +
    '		c0-0.281-0.425-0.408-0.858-0.578c-0.51-0.195-1.113-0.544-1.113-1.241c0-0.782,0.638-1.317,1.615-1.317\n' +
    '		c0.646,0,1.121,0.263,1.487,0.535l-0.562,0.748c-0.306-0.221-0.595-0.357-0.893-0.357c-0.322,0-0.476,0.119-0.476,0.332\n' +
    '		c0,0.272,0.391,0.374,0.824,0.535c0.536,0.196,1.14,0.493,1.14,1.267c0,0.765-0.604,1.36-1.734,1.36\n' +
    '		c-0.553,0-1.189-0.238-1.614-0.586L31.644,11.469z"/>\n' +
    '	<path fill="#010101" d="M35.392,9.497h-0.578V8.571l0.646-0.051l0.145-1.122h1.036v1.122h1.012v0.978h-1.012v1.691\n' +
    '		c0,0.476,0.213,0.671,0.544,0.671c0.137,0,0.289-0.042,0.399-0.085l0.196,0.91c-0.222,0.068-0.527,0.153-0.936,0.153\n' +
    '		c-1.045,0-1.453-0.654-1.453-1.632V9.497z"/>\n' +
    '</g>\n' +
    '<path fill="none" stroke="#231F20" d="M6.08,9.877c0.001,0.652,0.23,1.208,0.692,1.669s1.018,0.691,1.669,0.692\n' +
    '	c0.653,0,1.209-0.231,1.67-0.692c0.46-0.46,0.692-1.017,0.692-1.669c0-0.653-0.23-1.208-0.692-1.669\n' +
    '	C9.649,7.745,9.094,7.515,8.441,7.515c-0.653,0-1.21,0.23-1.67,0.691C6.31,8.667,6.08,9.224,6.08,9.877z"/>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/coreos/logo-globe-only.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 preserveAspectRatio="xMidYMin" viewBox="0 0 222.068 222.068" enable-background="new 0 0 222.068 222.068"\n' +
    '	 xml:space="preserve">\n' +
    '<g>\n' +
    '	<path fill="#54A3DA" d="M110.804,3.163c-59.27,0-107.479,48.212-107.479,107.473c0,59.265,48.209,107.474,107.479,107.474\n' +
    '		c59.252,0,107.465-48.209,107.465-107.474C218.269,51.375,170.056,3.163,110.804,3.163z"/>\n' +
    '	<path fill="#F1616E" d="M110.804,13.025c-17.283,0-31.941,27.645-37.235,66.069c-0.169,1.236-0.333,2.487-0.478,3.746\n' +
    '		c-0.723,6.047-1.213,12.335-1.458,18.808c-0.117,2.962-0.175,5.956-0.175,8.988c0,3.029,0.058,6.029,0.175,8.985\n' +
    '		c0.245,6.472,0.735,12.764,1.458,18.811c8.104,1.049,16.769,1.761,25.807,2.099c3.907,0.146,7.872,0.233,11.907,0.233\n' +
    '		c4.023,0,8-0.088,11.895-0.233c9.049-0.338,17.708-1.05,25.819-2.099c0.892-0.114,1.77-0.239,2.659-0.368\n' +
    '		c33.754-4.74,57.235-15.232,57.235-27.428C208.412,56.724,164.707,13.025,110.804,13.025z"/>\n' +
    '	<path fill="#FFFFFF" d="M151.177,83.205c-0.979-1.428-2.029-2.796-3.148-4.11c-8.956-10.557-22.297-17.265-37.224-17.265\n' +
    '		c-4.839,0-9.148,7.407-11.907,18.909c-1.096,4.586-1.947,9.819-2.495,15.498c-0.432,4.551-0.665,9.391-0.665,14.399\n' +
    '		s0.233,9.849,0.665,14.396c4.554,0.432,9.387,0.664,14.402,0.664c5.009,0,9.842-0.232,14.396-0.664\n' +
    '		c10.011-0.95,18.653-2.875,24.775-5.411c6.046-2.501,9.624-5.615,9.624-8.985C159.599,100.468,156.494,91.024,151.177,83.205z"/>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/coreos/logo.svg',
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '    preserveAspectRatio="xMidYMin" height="30px" viewBox="24.5 40.5 744 224" enable-background="new 24.5 40.5 744 224" xml:space="preserve">\n' +
    '  <g>\n' +
    '    <g>\n' +
    '      <path fill="#53A3DA" d="M136.168,45.527C76.898,45.527,28.689,93.739,28.689,153c0,59.265,48.209,107.474,107.479,107.474\n' +
    '        c59.252,0,107.465-48.209,107.465-107.474C243.633,93.739,195.42,45.527,136.168,45.527z"/>\n' +
    '      <path fill="#F1606D" d="M136.168,55.389c-17.283,0-31.941,27.645-37.235,66.069c-0.169,1.236-0.333,2.487-0.478,3.746\n' +
    '        c-0.723,6.047-1.213,12.335-1.458,18.808c-0.117,2.962-0.175,5.956-0.175,8.988c0,3.029,0.058,6.029,0.175,8.985\n' +
    '        c0.245,6.472,0.735,12.764,1.458,18.811c8.104,1.049,16.769,1.761,25.807,2.099c3.907,0.146,7.872,0.233,11.907,0.233\n' +
    '        c4.023,0,8-0.088,11.895-0.233c9.049-0.338,17.708-1.05,25.819-2.099c0.892-0.114,1.77-0.239,2.659-0.368\n' +
    '        c33.754-4.74,57.235-15.232,57.235-27.428C233.776,99.088,190.071,55.389,136.168,55.389z"/>\n' +
    '      <path fill="#FFFFFF" d="M176.541,125.569c-0.979-1.428-2.029-2.796-3.148-4.11c-8.956-10.557-22.297-17.265-37.224-17.265\n' +
    '        c-4.839,0-9.148,7.407-11.907,18.909c-1.096,4.586-1.947,9.819-2.495,15.498c-0.432,4.551-0.665,9.391-0.665,14.399\n' +
    '        s0.233,9.849,0.665,14.396c4.554,0.432,9.387,0.664,14.402,0.664c5.009,0,9.842-0.232,14.396-0.664\n' +
    '        c10.011-0.95,18.653-2.875,24.775-5.411c6.046-2.501,9.624-5.615,9.624-8.985C184.963,142.832,181.858,133.388,176.541,125.569z"\n' +
    '        />\n' +
    '    </g>\n' +
    '    <g>\n' +
    '      <path fill="#231F20" d="M344.891,100.053c12.585,0,22.816,6.138,29.262,13.062l-10.064,11.326\n' +
    '        c-5.353-5.192-11.175-8.495-19.041-8.495c-16.839,0-28.953,14.16-28.953,37.291c0,23.448,11.169,37.608,28.32,37.608\n' +
    '        c9.128,0,15.895-3.775,21.717-10.228l10.067,11.169c-8.335,9.598-19.038,14.95-32.099,14.95c-26.119,0-46.731-18.88-46.731-53.025\n' +
    '        C297.37,120.036,318.454,100.053,344.891,100.053z"/>\n' +
    '      <path fill="#231F20" d="M416.961,125.701c19.352,0,36.822,14.793,36.822,40.597c0,25.647-17.471,40.439-36.822,40.439\n' +
    '        c-19.197,0-36.66-14.792-36.66-40.439C380.301,140.494,397.764,125.701,416.961,125.701z M416.961,191.945\n' +
    '        c11.33,0,18.25-10.228,18.25-25.647c0-15.577-6.92-25.804-18.25-25.804s-18.094,10.227-18.094,25.804\n' +
    '        C398.867,181.717,405.631,191.945,416.961,191.945z"/>\n' +
    '      <path fill="#231F20" d="M459.771,127.589h14.943l1.26,13.688h0.629c5.506-10.07,13.691-15.577,21.871-15.577\n' +
    '        c3.938,0,6.455,0.472,8.811,1.574l-3.148,15.734c-2.67-0.784-4.717-1.257-8.018-1.257c-6.139,0-13.539,4.245-18.256,15.893v47.203\n' +
    '        h-18.092L459.771,127.589L459.771,127.589z"/>\n' +
    '      <path fill="#231F20" d="M541.121,125.701c20.928,0,31.941,15.107,31.941,36.667c0,3.458-0.314,6.604-0.787,8.495h-49.09\n' +
    '        c1.57,14.003,10.379,21.869,22.811,21.869c6.613,0,12.273-2.041,17.941-5.662l6.135,11.326\n' +
    '        c-7.395,4.878-16.676,8.341-26.432,8.341c-21.404,0-38.08-14.95-38.08-40.439C505.561,141.12,523.023,125.701,541.121,125.701z\n' +
    '         M557.326,159.376c0-12.277-5.189-19.671-15.732-19.671c-9.125,0-16.996,6.768-18.57,19.671H557.326z"/>\n' +
    '      <path fill="#F1606D" d="M600.602,152.607c0-32.729,17.785-53.344,42.799-53.344c24.863,0,42.641,20.615,42.641,53.344\n' +
    '        c0,32.889-17.777,54.13-42.641,54.13C618.387,206.737,600.602,185.496,600.602,152.607z M678.49,152.607\n' +
    '        c0-28.639-14.158-46.731-35.09-46.731c-21.084,0-35.248,18.093-35.248,46.731c0,28.796,14.164,47.521,35.248,47.521\n' +
    '        C664.332,200.128,678.49,181.403,678.49,152.607z"/>\n' +
    '      <path fill="#53A4D9" d="M699.738,186.125c7.557,8.495,18.412,14.003,30.529,14.003c15.732,0,25.807-8.499,25.807-20.767\n' +
    '        c0-12.904-8.494-17.154-18.723-21.717l-15.736-7.082c-8.969-3.936-20.934-10.385-20.934-25.808\n' +
    '        c0-14.947,12.904-25.492,30.059-25.492c12.588,0,22.658,5.665,28.949,12.435l-4.244,4.878c-5.982-6.452-14.32-10.7-24.705-10.7\n' +
    '        c-13.691,0-22.816,7.239-22.816,18.565c0,11.962,10.385,16.521,17.936,19.985l15.738,6.921\n' +
    '        c11.486,5.195,21.713,11.647,21.713,27.539s-13.061,27.851-33.201,27.851c-15.107,0-26.75-6.451-34.932-15.576L699.738,186.125z"\n' +
    '        />\n' +
    '    </g>\n' +
    '  </g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/quay-enterprise.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 636.213 80" enable-background="new 0 0 636.213 80" xml:space="preserve">\n' +
    '  <g fill="#003764">\n' +
    '    <g>\n' +
    '      <path d="M139.937,74.385c-1.004,0.502-2.33,0.922-3.975,1.257c-1.646,0.335-3.529,0.503-5.649,0.504c-5.803,0.002-10.7-1.337-14.688-4.014c-3.991-2.676-6.963-6.164-8.917-10.458c-2.902-0.613-5.539-1.686-7.91-3.221c-2.373-1.533-4.395-3.499-6.07-5.898c-1.674-2.397-2.959-5.174-3.852-8.326c-0.894-3.15-1.341-6.652-1.342-10.502c-0.001-4.464,0.597-8.439,1.796-11.928c1.198-3.486,2.885-6.416,5.061-8.788s4.782-4.187,7.824-5.443c3.04-1.256,6.402-1.885,10.084-1.886c3.683-0.001,7.044,0.626,10.086,1.88c3.041,1.255,5.65,3.083,7.827,5.479c2.177,2.399,3.864,5.343,5.066,8.829c1.2,3.486,1.801,7.435,1.803,11.842c0.002,7.364-1.559,13.419-4.681,18.162c-3.124,4.743-7.335,7.869-12.635,9.377c1.284,1.896,3.014,3.221,5.19,3.975c2.176,0.752,4.436,1.128,6.779,1.128c1.172-0.001,2.273-0.1,3.306-0.294c1.032-0.197,1.938-0.434,2.72-0.713L139.937,74.385z M100.171,33.723c0.002,5.858,1.091,10.406,3.268,13.641c2.177,3.235,5.134,4.852,8.873,4.851c3.737-0.001,6.695-1.619,8.87-4.855c2.175-3.236,3.262-7.784,3.26-13.643c-0.001-5.468-1.091-9.736-3.268-12.805c-2.177-3.067-5.135-4.602-8.873-4.601c-3.739,0.001-6.695,1.537-8.87,4.605C101.256,23.986,100.169,28.255,100.171,33.723z"/>\n' +
    '      <path d="M142.594,6.677l12.387-0.003l0.009,30.548c0.001,5.356,0.811,9.094,2.43,11.214c1.618,2.12,3.962,3.179,7.031,3.178c3.068-0.001,5.439-1.061,7.113-3.182s2.509-5.859,2.507-11.216l-0.009-30.548l11.884-0.004l0.008,29.292c0.003,9.151-1.823,15.819-5.476,20.005c-3.653,4.186-8.995,6.279-16.025,6.281c-7.086,0.002-12.5-2.088-16.238-6.271c-3.74-4.184-5.61-10.851-5.613-20.002L142.594,6.677z"/>\n' +
    '      <path d="M218.766,48.25l-16.655,0.005l-3.344,12.974l-12.554,0.003L203.27,6.659l14.813-0.004l17.089,54.562l-13.056,0.004L218.766,48.25z M216.252,38.626l-1.257-5.021c-0.783-2.733-1.537-5.635-2.262-8.703c-0.727-3.068-1.454-6.026-2.179-8.871h-0.334c-0.669,2.901-1.352,5.873-2.048,8.914c-0.697,3.041-1.436,5.929-2.215,8.663l-1.337,5.021L216.252,38.626z"/>\n' +
    '      <path d="M242.867,41.799L226.37,6.652l13.223-0.003l4.857,12.552c0.782,2.065,1.521,4.06,2.22,5.983c0.697,1.925,1.437,3.948,2.22,6.067h0.334c0.78-2.12,1.547-4.144,2.3-6.068c0.752-1.925,1.519-3.919,2.299-5.985l4.935-12.555l12.889-0.004L255.17,41.795l0.005,19.417l-12.303,0.004L242.867,41.799z"/>\n' +
    '    </g>\n' +
    '    <g>\n' +
    '      <path d="M302.11,6.045l30.213-0.009l0.001,3.348L305.96,9.392l0.006,20.84l22.094-0.007l0.001,3.348l-22.094,0.007l0.007,24.271l27.2-0.008l0.001,3.348l-31.049,0.009L302.11,6.045z"/>\n' +
    '      <path d="M344.796,21.014l3.181-0.001l0.337,6.193h0.251c2.063-2.064,4.184-3.78,6.359-5.149c2.175-1.366,4.657-2.052,7.448-2.053c4.185-0.001,7.252,1.254,9.207,3.764c1.953,2.511,2.931,6.389,2.933,11.632l0.007,25.777l-3.683,0.002l-0.007-25.275c-0.002-4.295-0.714-7.461-2.137-9.499c-1.424-2.035-3.781-3.054-7.073-3.053c-2.399,0.001-4.575,0.63-6.526,1.886c-1.954,1.256-4.157,3.139-6.611,5.65l0.009,30.297l-3.683,0.001L344.796,21.014z"/>\n' +
    '      <path d="M390.242,24.181l-6.276,0.002l-0.001-2.845l6.36-0.337l0.499-11.634l3.181-0.001L394.008,21l11.633-0.004l0.001,3.18l-11.633,0.004l0.008,26.196c0,1.284,0.098,2.441,0.294,3.473c0.194,1.033,0.545,1.924,1.047,2.678c0.502,0.753,1.185,1.339,2.051,1.757c0.864,0.418,1.995,0.627,3.39,0.627c0.781-0.001,1.633-0.126,2.552-0.378c0.921-0.251,1.743-0.545,2.469-0.879l1.006,3.013c-1.172,0.447-2.344,0.809-3.516,1.089c-1.171,0.278-2.175,0.419-3.012,0.419c-1.953,0-3.572-0.292-4.854-0.877c-1.284-0.585-2.316-1.408-3.097-2.469c-0.783-1.059-1.327-2.342-1.634-3.849c-0.308-1.506-0.462-3.151-0.462-4.938L390.242,24.181z"/>\n' +
    '      <path d="M411.253,41.165c-0.001-3.292,0.486-6.25,1.463-8.873c0.975-2.622,2.285-4.841,3.932-6.654c1.645-1.813,3.515-3.209,5.605-4.187c2.093-0.976,4.254-1.466,6.486-1.467c4.798-0.001,8.563,1.617,11.299,4.852c2.734,3.235,4.104,7.812,4.106,13.725c0,0.502,0,1.004,0,1.506c0,0.503-0.057,1.005-0.168,1.507l-28.957,0.008c0.056,2.511,0.448,4.841,1.174,6.988c0.726,2.148,1.745,3.99,3.057,5.522c1.312,1.535,2.889,2.733,4.729,3.598c1.841,0.865,3.905,1.297,6.194,1.296c2.176-0.001,4.142-0.321,5.899-0.965c1.757-0.641,3.39-1.521,4.895-2.637l1.508,2.844c-1.618,0.951-3.389,1.843-5.313,2.681c-1.925,0.837-4.365,1.256-7.322,1.257c-2.567,0.001-4.98-0.473-7.24-1.421c-2.26-0.946-4.228-2.327-5.901-4.141c-1.675-1.812-3.001-4.016-3.978-6.61C411.743,47.399,411.254,44.457,411.253,41.165zM440.629,38.729c-0.002-5.188-1.063-9.08-3.184-11.674c-2.122-2.595-4.995-3.891-8.621-3.89c-1.73,0.001-3.377,0.364-4.938,1.09c-1.562,0.726-2.97,1.759-4.226,3.098c-1.254,1.339-2.287,2.972-3.095,4.896c-0.809,1.926-1.324,4.088-1.546,6.486L440.629,38.729z"/>\n' +
    '      <path d="M455.018,20.983l3.181-0.001l0.337,7.448l0.251-0.001c1.339-2.511,2.97-4.547,4.895-6.11c1.925-1.562,4.086-2.345,6.485-2.346c0.781,0,1.478,0.057,2.093,0.167c0.613,0.112,1.255,0.335,1.925,0.669l-0.836,3.348c-0.67-0.278-1.256-0.46-1.758-0.543s-1.145-0.125-1.925-0.125c-1.786,0.001-3.669,0.769-5.648,2.303c-1.98,1.536-3.752,4.2-5.312,7.994l0.008,27.367l-3.683,0.002L455.018,20.983z"/>\n' +
    '      <path d="M485.242,64.66l0.005,14.646l-3.683,0.001l-0.018-58.333l3.181-0.001l0.337,5.021h0.251 c1.951-1.562,4.086-2.959,6.401-4.187c2.313-1.228,4.728-1.844,7.238-1.844c5.356-0.002,9.375,1.853,12.054,5.562 c2.679,3.711,4.02,8.69,4.021,14.938c0.001,3.404-0.473,6.444-1.42,9.122c-0.948,2.679-2.246,4.953-3.89,6.822 c-1.646,1.871-3.543,3.294-5.69,4.271c-2.148,0.977-4.393,1.465-6.736,1.466c-1.897,0.001-3.851-0.432-5.859-1.295 c-2.009-0.864-4.073-2.077-6.194-3.639L485.242,64.66z M485.239,53.697c2.345,1.896,4.521,3.234,6.529,4.015 c2.009,0.781,3.795,1.171,5.357,1.17c2.009-0.001,3.876-0.447,5.606-1.341c1.729-0.892,3.207-2.148,4.435-3.768 c1.227-1.617,2.188-3.558,2.886-5.817c0.696-2.26,1.045-4.756,1.044-7.49c-0.001-2.454-0.239-4.742-0.714-6.862c-0.476-2.12-1.214-3.947-2.22-5.481c-1.004-1.534-2.315-2.733-3.935-3.598c-1.618-0.864-3.571-1.296-5.858-1.295c-2.009,0-4.088,0.573-6.234,1.717c-2.148,1.145-4.449,2.777-6.903,4.898L485.239,53.697z"/>\n' +
    '      <path d="M527.074,20.961l3.181-0.001l0.337,7.448h0.251c1.339-2.511,2.97-4.548,4.895-6.11s4.086-2.346,6.485-2.346c0.781-0.001,1.478,0.056,2.093,0.167c0.613,0.112,1.255,0.335,1.925,0.668l-0.836,3.349c-0.67-0.278-1.256-0.46-1.758-0.544c-0.502-0.083-1.145-0.124-1.925-0.124c-1.786,0-3.669,0.769-5.648,2.302c-1.98,1.537-3.752,4.201-5.312,7.995l0.008,27.367l-3.683,0.001L527.074,20.961z"/>\n' +
    '      <path d="M555.526,11.244c-0.95,0-1.745-0.306-2.386-0.92c-0.642-0.612-0.962-1.394-0.963-2.343c0-1.06,0.32-1.883,0.962-2.47c0.641-0.586,1.435-0.879,2.385-0.879c0.947-0.001,1.744,0.292,2.386,0.878c0.641,0.586,0.963,1.409,0.963,2.469c0.001,0.949-0.321,1.73-0.962,2.344C557.27,10.938,556.474,11.243,555.526,11.244zM553.604,20.953l3.683-0.001l0.012,40.172l-3.683,0.001L553.604,20.953z"/>\n' +
    '      <path d="M569.933,53.839c1.729,1.451,3.57,2.664,5.524,3.64c1.952,0.976,4.38,1.464,7.282,1.463c3.18-0.001,5.564-0.797,7.154-2.388s2.385-3.445,2.384-5.566c0-1.227-0.293-2.314-0.88-3.264c-0.586-0.948-1.354-1.758-2.302-2.426c-0.95-0.67-1.996-1.256-3.14-1.757c-1.144-0.502-2.301-0.976-3.473-1.422c-1.508-0.557-3.028-1.142-4.562-1.757c-1.535-0.612-2.916-1.351-4.144-2.217c-1.229-0.863-2.218-1.895-2.973-3.096c-0.753-1.199-1.129-2.662-1.13-4.393c0-1.45,0.277-2.832,0.836-4.144c0.557-1.311,1.393-2.455,2.51-3.432c1.115-0.977,2.468-1.744,4.058-2.304c1.59-0.557,3.444-0.838,5.565-0.838c2.12-0.001,4.198,0.39,6.235,1.17c2.037,0.781,3.78,1.785,5.231,3.011l-2.008,2.596c-1.339-1.004-2.763-1.854-4.269-2.552c-1.507-0.696-3.293-1.045-5.356-1.044c-1.562,0-2.902,0.21-4.018,0.629c-1.116,0.418-2.051,0.963-2.803,1.633c-0.753,0.669-1.312,1.451-1.674,2.343c-0.362,0.894-0.543,1.787-0.543,2.679c0,1.172,0.266,2.163,0.796,2.971c0.53,0.81,1.241,1.521,2.136,2.135c0.892,0.613,1.91,1.157,3.055,1.631c1.143,0.474,2.301,0.934,3.474,1.38c1.562,0.613,3.124,1.227,4.687,1.839c1.562,0.615,2.972,1.367,4.228,2.259c1.256,0.894,2.273,1.995,3.056,3.305c0.781,1.312,1.173,2.944,1.173,4.896c0.001,1.506-0.292,2.943-0.878,4.31c-0.585,1.368-1.463,2.567-2.634,3.601c-1.172,1.032-2.595,1.856-4.269,2.47s-3.598,0.921-5.773,0.922c-3.013,0.001-5.776-0.543-8.287-1.63s-4.66-2.383-6.445-3.89L569.933,53.839z"/>\n' +
    '      <path d="M603.321,41.109c-0.001-3.292,0.486-6.25,1.463-8.873c0.975-2.622,2.285-4.841,3.932-6.654c1.645-1.813,3.515-3.209,5.605-4.187c2.093-0.976,4.254-1.466,6.486-1.467c4.798-0.001,8.563,1.617,11.299,4.852c2.734,3.235,4.104,7.812,4.106,13.725c0,0.502,0,1.004,0,1.506c0,0.503-0.057,1.005-0.168,1.507l-28.957,0.008c0.056,2.511,0.448,4.841,1.174,6.988c0.726,2.148,1.745,3.99,3.057,5.522c1.312,1.535,2.889,2.733,4.729,3.598c1.841,0.865,3.905,1.297,6.194,1.296c2.176-0.001,4.142-0.321,5.899-0.965c1.757-0.641,3.39-1.521,4.895-2.637l1.508,2.844c-1.618,0.951-3.389,1.843-5.313,2.681c-1.925,0.837-4.365,1.256-7.322,1.257c-2.567,0.001-4.98-0.474-7.24-1.421c-2.26-0.946-4.228-2.327-5.901-4.141c-1.675-1.812-3.001-4.016-3.978-6.61C603.812,47.343,603.322,44.401,603.321,41.109zM632.697,38.673c-0.002-5.188-1.063-9.08-3.184-11.674c-2.122-2.595-4.995-3.891-8.621-3.89c-1.73,0.001-3.377,0.364-4.938,1.09c-1.562,0.726-2.97,1.759-4.226,3.098c-1.254,1.339-2.287,2.972-3.095,4.896c-0.809,1.926-1.324,4.088-1.546,6.486L632.697,38.673z"/>\n' +
    '    </g>\n' +
    '  </g>\n' +
    '  <g>\n' +
    '    <g>\n' +
    '      <polygon fill="#68C28D" points="58.633,0 74.909,34.428 58.633,68.857 44.777,68.857 61.053,34.428 44.777,0"/>\n' +
    '      <polygon fill="#003764" points="44.778,68.857 28.502,34.428 44.778,0 58.634,0 42.358,34.428 58.634,68.857"/>\n' +
    '    </g>\n' +
    '    <g>\n' +
    '      <polygon fill="#68C28D" points="37.455,15.491 30.131,0 16.275,0 30.527,30.146"/>\n' +
    '      <polygon fill="#68C28D" points="30.527,38.711 16.275,68.857 30.131,68.857 37.455,53.365"/>\n' +
    '      <polygon fill="#003764" points="16.276,68.857 0,34.428 16.276,0 30.132,0 13.856,34.428 30.132,68.857"/>\n' +
    '    </g>\n' +
    '  </g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/tectonic-enterprise.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 962.991 107.965" enable-background="new 0 0 962.991 107.965" xml:space="preserve">\n' +
    '  <g>\n' +
    '    <polygon fill="#FFFFFF" points="64.693,36.135 45.926,27.776 27.162,36.129 45.926,46.97 45.926,68.639 62.548,56.561"/>\n' +
    '    <polygon fill="#68C28D" points="13.527,28.256 27.162,36.129 45.926,27.776 64.693,36.135 62.548,56.561 45.926,68.639 45.926,84.383 74.626,63.532 78.332,28.257 45.926,13.83"/>\n' +
    '    <path fill="#003764" d="M45.925,0L0,20.448l5.256,50.003L45.924,100l40.674-29.549l5.255-50L45.925,0z M74.624,63.534 L45.926,84.383V46.97L13.527,28.256L45.926,13.83l32.406,14.427L74.624,63.534z"/>\n' +
    '  </g>\n' +
    '  <g fill="#003764">\n' +
    '    <g>\n' +
    '      <path d="M125.006,27.611h-19.48V14.192h54.757v13.419h-19.371v57.138h-15.906V27.611z"/>\n' +
    '      <path d="M164.091,14.192h44.259v13.419h-28.244v14.177h24.023v13.311h-24.023v16.233h29.327v13.417h-45.342V14.192z"/>\n' +
    '      <path d="M242.321,12.895c8.766,0,16.125,4.328,20.885,9.2l-8.766,9.845c-3.571-3.247-6.926-5.303-11.903-5.303c-9.848,0-17.53,8.549-17.53,22.725c0,14.501,6.816,22.942,17.097,22.942c5.843,0,9.956-2.489,13.419-6.277l8.766,9.633c-5.844,6.816-13.638,10.387-22.4,10.387c-18.289,0-33.222-12.443-33.222-36.143C208.667,26.528,224.14,12.895,242.321,12.895z"/>\n' +
    '      <path d="M284.087,27.611h-19.478V14.192h54.754v13.419h-19.37v57.138h-15.907V27.611z"/>\n' +
    '      <path d="M315.497,49.147c0-23.052,13.095-36.252,32.032-36.252c19.045,0,32.031,13.308,32.031,36.252c0,23.048-12.985,36.899-32.031,36.899C328.592,86.047,315.497,72.195,315.497,49.147z M363.22,49.147c0-14.068-6.061-22.51-15.691-22.51c-9.524,0-15.691,8.441-15.691,22.51c0,14.176,6.167,23.157,15.691,23.157C357.159,72.305,363.22,63.323,363.22,49.147z"/>\n' +
    '      <path d="M444.277,14.192h16.017v70.557h-16.017V14.192z"/>\n' +
    '      <path d="M497.825,12.895c8.765,0,16.123,4.328,20.884,9.2l-8.765,9.845c-3.571-3.247-6.925-5.303-11.905-5.303c-9.846,0-17.529,8.549-17.529,22.725c0,14.501,6.817,22.942,17.098,22.942c5.843,0,9.954-2.489,13.418-6.277l8.767,9.633c-5.845,6.816-13.636,10.387-22.401,10.387c-18.29,0-33.222-12.443-33.222-36.143C464.169,26.528,479.644,12.895,497.825,12.895z"/>\n' +
    '      <polygon points="423.888,14.192 423.888,59.451 400.082,14.192 398.999,14.192 383.74,14.192 383.74,84.749 398.999,84.749 398.999,39.605 422.697,84.749 439.038,84.749 439.038,14.192"/>\n' +
    '    </g>\n' +
    '    <g>\n' +
    '      <path d="M556.674,14.465h38.425v4.27h-33.515v26.577h28.178v4.27h-28.178v30.953h34.582v4.27h-39.492V14.465z"/>\n' +
    '      <path d="M608.438,33.571h4.056l0.427,7.897h0.32c5.23-5.229,10.567-9.179,17.611-9.179c10.567,0,15.477,6.404,15.477,19.64v32.874h-4.696V52.57c0-10.887-3.416-16.01-11.741-16.01c-6.084,0-10.46,3.202-16.757,9.606v38.638h-4.696V33.571z"/>\n' +
    '      <path d="M664.257,37.627h-8.005v-3.629l8.112-0.427l0.64-14.837h4.056v14.837h14.836v4.056h-14.836v33.408c0,6.511,1.601,10.887,8.646,10.887c1.921,0,4.59-0.747,6.404-1.601l1.281,3.842c-2.989,1.067-6.191,1.922-8.326,1.922c-9.926,0-12.808-6.298-12.808-15.477V37.627z"/>\n' +
    '      <path d="M711.22,32.29c12.168,0,19.639,8.646,19.639,23.695c0,1.28,0,2.562-0.213,3.843h-36.93c0.213,12.914,7.792,22.2,19.319,22.2c5.55,0,9.926-1.814,13.769-4.589l1.921,3.629c-4.056,2.454-8.646,5.017-16.117,5.017c-13.128,0-23.695-10.033-23.695-26.791S699.799,32.29,711.22,32.29z M726.376,56.198c0-13.128-5.87-19.853-15.049-19.853c-8.752,0-16.544,7.578-17.611,19.853H726.376z"/>\n' +
    '      <path d="M742.596,33.571h4.056l0.427,9.499h0.32c3.416-6.298,8.432-10.78,14.516-10.78c1.921,0,3.416,0.214,5.124,1.067l-1.067,4.27c-1.708-0.641-2.668-0.854-4.696-0.854c-4.59,0-10.033,3.522-13.982,13.129v34.902h-4.696V33.571z"/>\n' +
    '      <path d="M778.99,89.286v18.679h-4.696V33.571h4.056l0.427,6.403h0.32c5.017-3.949,11.101-7.685,17.398-7.685c13.662,0,20.493,10.246,20.493,26.15c0,17.397-10.567,27.645-22.628,27.645c-4.803,0-10.033-2.349-15.37-6.298V89.286zM794.146,81.922c10.354,0,17.825-9.606,17.825-23.481c0-12.595-4.483-21.987-16.224-21.987c-5.124,0-10.567,2.988-16.757,8.432v30.42C784.86,80.108,790.197,81.922,794.146,81.922z"/>\n' +
    '      <path d="M830.22,33.571h4.056l0.427,9.499h0.32c3.416-6.298,8.432-10.78,14.517-10.78c1.921,0,3.415,0.214,5.123,1.067l-1.067,4.27c-1.708-0.641-2.669-0.854-4.696-0.854c-4.59,0-10.033,3.522-13.982,13.129v34.902h-4.696V33.571z"/>\n' +
    '      <path d="M860.103,17.027c0-2.668,1.922-4.269,4.27-4.269c2.349,0,4.27,1.601,4.27,4.269c0,2.455-1.921,4.163-4.27,4.163C862.024,21.19,860.103,19.482,860.103,17.027z M861.917,33.571h4.696v51.232h-4.696V33.571z"/>\n' +
    '      <path d="M880.593,75.518c4.376,3.629,8.966,6.511,16.331,6.511c8.005,0,12.167-4.696,12.167-10.14c0-6.404-6.617-9.179-12.487-11.313c-7.792-2.775-16.331-5.871-16.331-14.623c0-7.472,5.871-13.662,16.544-13.662c5.443,0,10.888,2.241,14.623,5.337l-2.562,3.309c-3.416-2.562-7.045-4.59-12.274-4.59c-7.898,0-11.527,4.59-11.527,9.286c0,5.657,5.977,8.112,12.061,10.354c8.005,2.988,16.758,5.657,16.758,15.689c0,7.686-6.19,14.41-17.291,14.41c-7.578,0-14.196-3.202-18.786-7.045L880.593,75.518z"/>\n' +
    '      <path d="M943.352,32.29c12.168,0,19.64,8.646,19.64,23.695c0,1.28,0,2.562-0.213,3.843h-36.931c0.213,12.914,7.791,22.2,19.319,22.2c5.55,0,9.926-1.814,13.769-4.589l1.921,3.629c-4.056,2.454-8.646,5.017-16.117,5.017c-13.128,0-23.695-10.033-23.695-26.791S931.932,32.29,943.352,32.29z M958.509,56.198c0-13.128-5.871-19.853-15.05-19.853c-8.753,0-16.544,7.578-17.611,19.853H958.509z"/>\n' +
    '    </g>\n' +
    '  </g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/tectonic-horizontal-white.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="529.586px" height="110.059px" viewBox="0 0 529.586 110.059" enable-background="new 0 0 529.586 110.059"\n' +
    '	 xml:space="preserve">\n' +
    '<g>\n' +
    '	<path fill="#FFFFFF" d="M51.189,5.118L5.264,25.566l5.256,50.003l40.668,29.549l40.674-29.549l5.255-50L51.189,5.118z\n' +
    '		 M83.595,33.374L79.889,68.65l-0.001,0.002L51.189,89.5l0.004-37.415L18.79,33.373l32.399-14.426L83.595,33.374L83.595,33.374z"/>\n' +
    '	<rect x="51.189" y="52.087" fill="#FFFFFF" width="0.002" height="21.669"/>\n' +
    '	<polygon fill="#FFFFFF" points="54.193,50.354 54.193,52.085 54.191,71.576 67.812,61.678 67.813,61.678 69.957,41.252 \n' +
    '		51.189,32.894 35.812,39.739 52.693,49.488 	"/>\n' +
    '</g>\n' +
    '<g>\n' +
    '	<path fill="#FFFFFF" d="M130.269,32.365h-19.48V18.946h54.757v13.419h-19.371v57.138h-15.906V32.365z"/>\n' +
    '	<path fill="#FFFFFF" d="M169.354,18.946h44.259v13.419H185.37v14.177h24.023v13.311H185.37v16.233h29.327v13.417h-45.342V18.946z"\n' +
    '		/>\n' +
    '	<path fill="#FFFFFF" d="M247.584,17.649c8.766,0,16.125,4.328,20.885,9.2l-8.766,9.845c-3.571-3.247-6.926-5.303-11.903-5.303\n' +
    '		c-9.848,0-17.53,8.549-17.53,22.725c0,14.501,6.816,22.942,17.097,22.942c5.843,0,9.956-2.489,13.419-6.277l8.766,9.633\n' +
    '		c-5.844,6.816-13.638,10.387-22.4,10.387c-18.289,0-33.222-12.443-33.222-36.143C213.931,31.282,229.403,17.649,247.584,17.649z"/>\n' +
    '	<path fill="#FFFFFF" d="M289.35,32.365h-19.478V18.946h54.754v13.419h-19.37v57.138H289.35V32.365z"/>\n' +
    '	<path fill="#FFFFFF" d="M320.761,53.901c0-23.052,13.095-36.252,32.032-36.252c19.045,0,32.031,13.308,32.031,36.252\n' +
    '		c0,23.048-12.985,36.899-32.031,36.899C333.855,90.8,320.761,76.949,320.761,53.901z M368.483,53.901\n' +
    '		c0-14.068-6.061-22.51-15.691-22.51c-9.524,0-15.691,8.441-15.691,22.51c0,14.176,6.167,23.157,15.691,23.157\n' +
    '		C362.422,77.058,368.483,68.077,368.483,53.901z"/>\n' +
    '	<path fill="#FFFFFF" d="M449.54,18.946h16.017v70.557H449.54V18.946z"/>\n' +
    '	<path fill="#FFFFFF" d="M503.089,17.649c8.765,0,16.123,4.328,20.884,9.2l-8.765,9.845c-3.571-3.247-6.925-5.303-11.905-5.303\n' +
    '		c-9.846,0-17.529,8.549-17.529,22.725c0,14.501,6.817,22.942,17.098,22.942c5.843,0,9.954-2.489,13.417-6.277l8.767,9.633\n' +
    '		C519.211,87.23,511.42,90.8,502.655,90.8c-18.29,0-33.222-12.443-33.222-36.143C469.433,31.282,484.907,17.649,503.089,17.649z"/>\n' +
    '	<polygon fill="#FFFFFF" points="429.152,18.946 429.152,64.204 405.345,18.946 404.262,18.946 389.003,18.946 389.003,89.502 \n' +
    '		404.262,89.502 404.262,44.359 427.96,89.502 444.301,89.502 444.301,18.946 	"/>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '<g>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/tectonic-icon-white.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="103.55px" height="108.876px" viewBox="0 0 103.55 108.876" enable-background="new 0 0 103.55 108.876"\n' +
    '	 xml:space="preserve">\n' +
    '<g>\n' +
    '	<path fill="#FFFFFF" d="M52.899,5.082L6.974,25.53l5.256,50.003l40.668,29.549l40.674-29.549l5.255-50L52.899,5.082z\n' +
    '		 M85.305,33.339l-3.706,35.275l-0.001,0.002L52.9,89.465l0.004-37.415L20.501,33.338L52.9,18.912L85.305,33.339L85.305,33.339z"/>\n' +
    '	<rect x="52.899" y="52.051" fill="#FFFFFF" width="0.002" height="21.669"/>\n' +
    '	<polygon fill="#FFFFFF" points="55.903,50.318 55.903,52.05 55.901,71.54 69.522,61.643 69.523,61.643 71.667,41.217 52.9,32.858 \n' +
    '		37.523,39.703 54.403,49.452 	"/>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/tectonic-logo.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="529.586px" height="110.059px" viewBox="0 0 529.586 110.059" enable-background="new 0 0 529.586 110.059" xml:space="preserve">\n' +
    '  <g>\n' +
    '    <polygon fill="#FFFFFF" points="70.667,41.251 51.899,32.893 33.136,41.245 51.899,52.086 51.899,73.755 68.522,61.677 "/>\n' +
    '    <polygon fill="#68C28D" points="19.5,33.372 33.136,41.245 51.899,32.893 70.667,41.251 68.522,61.677 51.899,73.755 51.899,89.499 80.599,68.648 84.305,33.373 51.899,18.946 "/>\n' +
    '    <path fill="#243A4C" d="M51.899,5.116L5.974,25.564l5.256,50.003l40.668,29.549l40.674-29.549l5.255-50L51.899,5.116z M80.598,68.65L51.899,89.499V52.086L19.5,33.372l32.399-14.426l32.406,14.427L80.598,68.65z"/>\n' +
    '  </g>\n' +
    '  <g>\n' +
    '    <path fill="#243A4C" d="M130.979,32.363h-19.48V18.944h54.757v13.419h-19.371v57.138h-15.906V32.363z"/>\n' +
    '    <path fill="#243A4C" d="M170.064,18.944h44.259v13.419H186.08V46.54h24.023v13.311H186.08v16.233h29.327v13.417h-45.342V18.944z"/>\n' +
    '    <path fill="#243A4C" d="M248.294,17.647c8.766,0,16.125,4.328,20.885,9.2l-8.766,9.845c-3.571-3.247-6.926-5.303-11.903-5.303 c-9.848,0-17.53,8.549-17.53,22.725c0,14.501,6.816,22.942,17.097,22.942c5.843,0,9.956-2.489,13.419-6.277l8.766,9.633 c-5.844,6.816-13.638,10.387-22.4,10.387c-18.289,0-33.222-12.443-33.222-36.143C214.641,31.28,230.113,17.647,248.294,17.647z"/>\n' +
    '    <path fill="#243A4C" d="M290.06,32.363h-19.478V18.944h54.754v13.419h-19.37v57.138H290.06V32.363z"/>\n' +
    '    <path fill="#243A4C" d="M321.471,53.899c0-23.052,13.095-36.252,32.032-36.252c19.045,0,32.031,13.308,32.031,36.252 c0,23.048-12.985,36.899-32.031,36.899C334.565,90.799,321.471,76.947,321.471,53.899z M369.193,53.899 c0-14.068-6.061-22.51-15.691-22.51c-9.524,0-15.691,8.441-15.691,22.51c0,14.176,6.167,23.157,15.691,23.157 C363.132,77.057,369.193,68.075,369.193,53.899z"/>\n' +
    '    <path fill="#243A4C" d="M450.25,18.944h16.017v70.557H450.25V18.944z"/>\n' +
    '    <path fill="#243A4C" d="M503.799,17.647c8.765,0,16.123,4.328,20.884,9.2l-8.765,9.845c-3.571-3.247-6.925-5.303-11.905-5.303 c-9.846,0-17.529,8.549-17.529,22.725c0,14.501,6.817,22.942,17.098,22.942c5.843,0,9.954-2.489,13.417-6.277l8.767,9.633 c-5.845,6.816-13.636,10.387-22.401,10.387c-18.29,0-33.222-12.443-33.222-36.143C470.143,31.28,485.617,17.647,503.799,17.647z"/>\n' +
    '    <polygon fill="#243A4C" points="429.862,18.944 429.862,64.203 406.055,18.944 404.972,18.944 389.713,18.944 389.713,89.501 404.972,89.501 404.972,44.357 428.67,89.501 445.011,89.501 445.011,18.944 "/>\n' +
    '  </g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/tectonic-preview.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '      viewBox="0 0 868.1 100" enable-background="new 0 0 868.1 100;" xml:space="preserve">\n' +
    '  <g>\n' +
    '    <polygon style="fill:#FFFFFF;" points="64.7,36.1 45.9,27.8 27.2,36.1 45.9,47 45.9,68.6 62.5,56.6"/>\n' +
    '    <polygon style="fill:#68C28D;" points="13.5,28.3 27.2,36.1 45.9,27.8 64.7,36.1 62.5,56.6 45.9,68.6 45.9,84.4 74.6,63.5 78.3,28.3 45.9,13.8"/>\n' +
    '    <path style="fill:#002B49;" d="M45.9,0L0,20.4l5.3,50L45.9,100l40.7-29.5l5.3-50L45.9,0z M74.6,63.5L45.9,84.4V47L13.5,28.3 l32.4-14.4l32.4,14.4L74.6,63.5z"/>\n' +
    '  </g>\n' +
    '  <g>\n' +
    '    <path style="fill:#002B49;" d="M125,27.2h-19.5V13.8h54.8v13.4h-19.4v57.1H125V27.2z"/>\n' +
    '    <path style="fill:#002B49;" d="M164.1,13.8h44.3v13.4h-28.2v14.2h24v13.3h-24V71h29.3v13.4h-45.3V13.8z"/>\n' +
    '    <path style="fill:#002B49;" d="M242.3,12.5c8.8,0,16.1,4.3,20.9,9.2l-8.8,9.8c-3.6-3.2-6.9-5.3-11.9-5.3\n' +
    '            c-9.8,0-17.5,8.5-17.5,22.7c0,14.5,6.8,22.9,17.1,22.9c5.8,0,10-2.5,13.4-6.3l8.8,9.6c-5.8,6.8-13.6,10.4-22.4,10.4\n' +
    '            c-18.3,0-33.2-12.4-33.2-36.1C208.7,26.2,224.1,12.5,242.3,12.5z"/>\n' +
    '    <path style="fill:#002B49;" d="M284.1,27.2h-19.5V13.8h54.8v13.4H300v57.1h-15.9V27.2z"/>\n' +
    '    <path style="fill:#002B49;" d="M315.5,48.8c0-23.1,13.1-36.3,32-36.3c19,0,32,13.3,32,36.3c0,23-13,36.9-32,36.9\n' +
    '            C328.6,85.7,315.5,71.8,315.5,48.8z M363.2,48.8c0-14.1-6.1-22.5-15.7-22.5c-9.5,0-15.7,8.4-15.7,22.5c0,14.2,6.2,23.2,15.7,23.2\n' +
    '            C357.2,71.9,363.2,63,363.2,48.8z"/>\n' +
    '    <path style="fill:#002B49;" d="M444.3,13.8h16v70.6h-16V13.8z"/>\n' +
    '    <path style="fill:#002B49;" d="M497.8,12.5c8.8,0,16.1,4.3,20.9,9.2l-8.8,9.8c-3.6-3.2-6.9-5.3-11.9-5.3\n' +
    '            c-9.8,0-17.5,8.5-17.5,22.7c0,14.5,6.8,22.9,17.1,22.9c5.8,0,10-2.5,13.4-6.3l8.8,9.6c-5.8,6.8-13.6,10.4-22.4,10.4\n' +
    '            c-18.3,0-33.2-12.4-33.2-36.1C464.2,26.2,479.6,12.5,497.8,12.5z"/>\n' +
    '    <polygon style="fill:#002B49;" points="423.9,13.8 423.9,59.1 400.1,13.8 399,13.8 383.7,13.8 383.7,84.4 399,84.4 399,39.2 422.7,84.4 439,84.4 439,13.8"/>\n' +
    '  </g>\n' +
    '  <g>\n' +
    '    <path style="fill:#002B49;" d="M556.7,14.1h19.2c15.7,0,25,5.1,25,19.6c0,13.8-9.4,20.5-25,20.5h-14.3v30.2h-4.9V14.1z\n' +
    '             M574.6,50.1c14.4,0,21.2-4.8,21.2-16.3c0-11.8-6.9-15.5-21.2-15.5h-13v31.8H574.6z"/>\n' +
    '    <path style="fill:#002B49;" d="M608.9,33.3h4.1l0.4,9.5h0.3c3.4-6.3,8.4-10.8,14.5-10.8c1.9,0,3.4,0.2,5.1,1.1l-1.1,4.3\n' +
    '            c-1.7-0.6-2.7-0.9-4.7-0.9c-4.6,0-10,3.5-14,13.1v34.9h-4.7V33.3z"/>\n' +
    '    <path style="fill:#002B49;" d="M657.5,32c12.2,0,19.6,8.6,19.6,23.7c0,1.3,0,2.6-0.2,3.8H640c0.2,12.9,7.8,22.2,19.3,22.2\n' +
    '            c5.6,0,9.9-1.8,13.8-4.6l1.9,3.6c-4.1,2.5-8.6,5-16.1,5c-13.1,0-23.7-10-23.7-26.8S646.1,32,657.5,32z M672.7,55.9\n' +
    '            c0-13.1-5.9-19.9-15-19.9c-8.8,0-16.5,7.6-17.6,19.9H672.7z"/>\n' +
    '    <path style="fill:#002B49;" d="M681.7,33.3h5.1l11.5,32.1c1.6,4.9,3.5,10,5.1,14.7h0.4c1.7-4.7,3.5-9.8,5.2-14.7l11.5-32.1h4.8\n' +
    '            l-19,51.2h-5.6L681.7,33.3z"/>\n' +
    '    <path style="fill:#002B49;" d="M732.6,16.7c0-2.7,1.9-4.3,4.3-4.3s4.3,1.6,4.3,4.3c0,2.5-1.9,4.2-4.3,4.2S732.6,19.2,732.6,16.7z\n' +
    '             M734.4,33.3h4.7v51.2h-4.7V33.3z"/>\n' +
    '    <path style="fill:#002B49;" d="M774.7,32c12.2,0,19.6,8.6,19.6,23.7c0,1.3,0,2.6-0.2,3.8h-36.9c0.2,12.9,7.8,22.2,19.3,22.2\n' +
    '            c5.6,0,9.9-1.8,13.8-4.6l1.9,3.6c-4.1,2.5-8.6,5-16.1,5c-13.1,0-23.7-10-23.7-26.8S763.3,32,774.7,32z M789.9,55.9\n' +
    '            c0-13.1-5.9-19.9-15-19.9c-8.8,0-16.5,7.6-17.6,19.9H789.9z"/>\n' +
    '    <path style="fill:#002B49;" d="M800.1,33.3h5.1l9.2,33.2c1.3,4.7,2.5,9.1,3.5,13.7h0.4c1.2-4.6,2.5-9,3.7-13.7l9.3-33.2h5.7\n' +
    '            l9.3,33.2c1.3,4.7,2.6,9.1,3.8,13.7h0.4c1.2-4.6,2.5-9,3.6-13.7l9.1-33.2h4.8l-14.7,51.2h-6.2l-9-31.8c-1.5-4.9-2.5-9.6-3.9-14.6\n' +
    '            h-0.4c-1.2,5-2.5,9.9-4.1,14.8l-8.9,31.6h-5.7L800.1,33.3z"/>\n' +
    '  </g>\n' +
    '</svg>\n' +
    '');
}]);

angular.module('mochi.ui.svg').run(['$templateCache', function($templateCache) {
  $templateCache.put('/mochi-svg/logo/tectonic/tectonic-support.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<svg version="1.0" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-326.9 294.1 135.2 25" xml:space="preserve">\n' +
    '  <g>\n' +
    '    <path fill="#ffffff" d="M-306.6,298.7c-2.2-2.2-5-3.2-7.8-3.2s-5.7,1-7.8,3.2c-4.3,4.3-4.3,11.3,0,15.6s11.3,4.3,15.6,0S-302.3,303-306.6,298.7z M-309.4,311.4c-1.4,1.4-3.1,2-4.9,2s-3.6-0.7-4.9-2s-2-3.1-2-4.9s0.7-3.6,2-4.9c2.7-2.7,7.1-2.7,9.8,0c1.3,1.3,2,3.1,2,4.9S-308.2,310.1-309.4,311.4z"/>\n' +
    '    <g fill="#76C698">\n' +
    '      <path d="M-306.1,298.2c-0.8-0.8-1.6-1.4-2.5-1.9l-4.2,4.2c1,0.3,2,0.8,2.8,1.6s1.3,1.8,1.6,2.8l4.2-4.2C-304.7,299.8-305.3,298.9-306.1,298.2z"/>\n' +
    '      <path d="M-320.3,308.1l-4.2,4.2c0.5,0.9,1.1,1.7,1.9,2.5s1.6,1.4,2.5,1.9l4.2-4.2c-1-0.3-2-0.8-2.8-1.6S-320,309.1-320.3,308.1z"/>\n' +
    '      <path d="M-309.9,310.9c-0.8,0.8-1.8,1.3-2.8,1.6l4.2,4.2c0.9-0.5,1.7-1.1,2.5-1.9s1.4-1.6,1.9-2.5l-4.2-4.2C-308.7,309.1-309.2,310.1-309.9,310.9z"/>\n' +
    '      <path d="M-320.2,296.3c-0.8,0.5-1.7,1.1-2.4,1.9c-0.8,0.7-1.4,1.6-1.9,2.4l4.2,4.2c0.3-1,0.8-2,1.6-2.8s1.8-1.3,2.8-1.6L-320.2,296.3z"/>\n' +
    '    </g>\n' +
    '    <path fill="#173962" d="M-319.2,301.6c-1.3,1.3-2,3.1-2,4.9c0,1.9,0.7,3.6,2,4.9c1.4,1.4,3.1,2,4.9,2s3.6-0.7,4.9-2s2-3.1,2-4.9c0-1.9-0.7-3.6-2-4.9C-312.1,298.9-316.5,298.9-319.2,301.6z M-310.5,310.3c-2.1,2.1-5.6,2.1-7.7,0c-1-1-1.6-2.4-1.6-3.8s0.6-2.8,1.6-3.8c1.1-1.1,2.4-1.6,3.8-1.6s2.8,0.5,3.8,1.6c1,1,1.6,2.4,1.6,3.8S-309.4,309.3-310.5,310.3z M-305.6,297.7c-4.9-4.9-12.8-4.9-17.6,0s-4.9,12.8,0,17.6c2.4,2.4,5.6,3.7,8.8,3.7s6.4-1.2,8.8-3.7C-300.7,310.5-300.7,302.5-305.6,297.7z M-306.6,314.3c-4.3,4.3-11.3,4.3-15.6,0s-4.3-11.3,0-15.6c2.2-2.2,5-3.2,7.8-3.2s5.7,1.1,7.8,3.2C-302.3,303-302.3,310-306.6,314.3z"/>\n' +
    '  </g>\n' +
    '  <g fill="#003764">\n' +
    '    <path d="M-294.3,310.4c1.2,1.1,2.9,1.8,4.3,1.8c1.6,0,2.5-0.6,2.5-1.7s-1-1.5-2.5-2.1l-2.3-1c-1.8-0.7-3.6-2.2-3.6-4.8c0-2.9,2.6-5.2,6.3-5.2c2,0,4.2,0.8,5.7,2.3l-2,2.5c-1.2-0.9-2.3-1.4-3.7-1.4c-1.3,0-2.2,0.6-2.2,1.6c0,1.1,1.2,1.5,2.7,2.1l2.2,0.9c2.1,0.9,3.5,2.3,3.5,4.8c0,2.9-2.4,5.4-6.6,5.4c-2.3,0-4.7-0.9-6.5-2.5L-294.3,310.4z"/>\n' +
    '    <path d="M-281.9,297.7h4v9.8c0,3.5,1.1,4.6,3,4.6c2,0,3.1-1.2,3.1-4.6v-9.8h3.9v9.4c0,5.9-2.4,8.5-7,8.5s-7-2.6-7-8.5V297.7z"/>\n' +
    '    <path d="M-265.4,297.7h6.4c3.8,0,6.9,1.4,6.9,5.7c0,4.1-3.2,6-6.9,6h-2.4v6h-4V297.7z M-259.2,306.2c2.2,0,3.2-1,3.2-2.8s-1.1-2.5-3.2-2.5h-2.2v5.3H-259.2z"/>\n' +
    '    <path d="M-250.4,297.7h6.4c3.8,0,6.9,1.4,6.9,5.7c0,4.1-3.2,6-6.9,6h-2.4v6h-4V297.7z M-244.2,306.2c2.2,0,3.2-1,3.2-2.8s-1.1-2.5-3.2-2.5h-2.2v5.3H-244.2z"/>\n' +
    '    <path d="M-236.4,306.4c0-5.7,3.3-9,8-9s8,3.3,8,9s-3.2,9.2-8,9.2C-233.1,315.6-236.4,312.2-236.4,306.4zM-224.5,306.4c0-3.5-1.5-5.6-3.9-5.6s-3.9,2.1-3.9,5.6s1.5,5.8,3.9,5.8S-224.5,310-224.5,306.4z"/>\n' +
    '    <path d="M-209.1,315.3l-3.4-6.3h-2.2v6.3h-4v-17.5h6.3c3.7,0,6.8,1.3,6.8,5.5c0,2.6-1.3,4.2-3.1,5.1l4,7H-209.1zM-214.5,305.8h2c2.1,0,3.2-0.9,3.2-2.6s-1.1-2.3-3.2-2.3h-2V305.8z"/>\n' +
    '    <path d="M-200.4,301.1h-4.9v-3.4h13.6v3.3h-4.8v14.2h-4L-200.4,301.1L-200.4,301.1z"/>\n' +
    '  </g>\n' +
    '</svg>\n' +
    '');
}]);

"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var LayoutManager_1 = require("../layoutmanager/LayoutManager");
/**
 * Created by talha.naqvi on 05/04/17.
 * You can create a new instance or inherit and override default methods
 * You may need access to data provider here, it might make sense to pass a function which lets you fetch the latest data provider
 * Why only indexes? The answer is to allow data virtualization in the future. Since layouts are accessed much before the actual render assuming having all
 * data upfront will only limit possibilites in the future.
 *
 * By design LayoutProvider forces you to think in terms of view types. What that means is that you'll always be dealing with a finite set of view templates
 * with deterministic dimensions. We want to eliminate unnecessary re-layouts that happen when height, by mistake, is not taken into consideration.
 * This patters ensures that your scrolling is as smooth as it gets. You can always increase the number of types to handle non deterministic scenarios.
 *
 * NOTE: You can also implement features such as ListView/GridView switch by simple changing your layout provider.
 */
var BaseLayoutProvider = /** @class */ (function () {
    function BaseLayoutProvider() {
        //Unset if your new layout provider doesn't require firstVisibleIndex preservation on application
        this.shouldRefreshWithAnchoring = true;
    }
    return BaseLayoutProvider;
}());
exports.BaseLayoutProvider = BaseLayoutProvider;
var LayoutProvider = /** @class */ (function (_super) {
    __extends(LayoutProvider, _super);
    function LayoutProvider(getLayoutTypeForIndex, setLayoutForType) {
        var _this = _super.call(this) || this;
        _this._getLayoutTypeForIndex = getLayoutTypeForIndex;
        _this._setLayoutForType = setLayoutForType;
        _this._tempDim = { height: 0, width: 0 };
        return _this;
    }
    LayoutProvider.prototype.newLayoutManager = function (renderWindowSize, isHorizontal, cachedLayouts) {
        this._lastLayoutManager = new LayoutManager_1.WrapGridLayoutManager(this, renderWindowSize, isHorizontal, cachedLayouts);
        return this._lastLayoutManager;
    };
    //Provide a type for index, something which identifies the template of view about to load
    LayoutProvider.prototype.getLayoutTypeForIndex = function (index) {
        return this._getLayoutTypeForIndex(index);
    };
    //Given a type and dimension set the dimension values on given dimension object
    //You can also get index here if you add an extra argument but we don't recommend using it.
    LayoutProvider.prototype.setComputedLayout = function (type, dimension, index) {
        return this._setLayoutForType(type, dimension, index);
    };
    LayoutProvider.prototype.checkDimensionDiscrepancy = function (dimension, type, index) {
        var dimension1 = dimension;
        this.setComputedLayout(type, this._tempDim, index);
        var dimension2 = this._tempDim;
        if (this._lastLayoutManager) {
            this._lastLayoutManager.setMaxBounds(dimension2);
        }
        return dimension1.height !== dimension2.height || dimension1.width !== dimension2.width;
    };
    return LayoutProvider;
}(BaseLayoutProvider));
exports.LayoutProvider = LayoutProvider;
//# sourceMappingURL=LayoutProvider.js.map
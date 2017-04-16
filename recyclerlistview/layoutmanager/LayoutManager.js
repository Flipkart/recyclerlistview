import LayoutProvider from "../dependencies/LayoutProvider";
class LayoutManager {
    constructor(layoutProvider: LayoutProvider, dimensions, isHorizontal) {
        this._layoutProvider = layoutProvider;
        this._itemCount = 0;
        this._window = dimensions;
        this._totalHeight = 0;
        this._totalWidth = 0;
        this._layouts = [];
        this._isHorizontal = isHorizontal;

    }

    getLayoutDimension() {
        return {height: this._totalHeight, width: this._totalWidth};
    }

    getLayouts() {
        return this._layouts;
    }

    setTotalItemCount(count) {
        this._itemCount = count;
    }

    relayout() {
        let startX = 0;
        let startY = 0;
        let maxBound = 0;
        let oldItemCount = this._layouts.length;

        let itemDim = {height: 0, width: 0};
        let itemRect = null;

        this._newLayouts = [];

        for (let i = 0; i < this._itemCount; i++) {
            this._layoutProvider.setLayoutForType(this._layoutProvider.getLayoutTypeForIndex(i), itemDim);
            while (!this._checkBounds(startX, startY, itemDim, this._isHorizontal)) {
                if (this._isHorizontal) {
                    startX += maxBound;
                    startY = 0;
                    this._totalWidth += maxBound;
                }
                else {
                    startX = 0;
                    startY += maxBound;
                    this._totalHeight += maxBound;
                }
                maxBound = 0;
            }

            maxBound = this._isHorizontal ? Math.max(maxBound, itemDim.width) : Math.max(maxBound, itemDim.height);

            if (i > oldItemCount - 1) {
                this._newLayouts.push({x: startX, y: startY, height: itemDim.height, width: itemDim.width});
            }
            else {
                itemRect = this._layouts[i];
                itemRect.x = startX;
                itemRect.y = startY;
                itemRect.width = itemDim.width;
                itemRect.height = itemDim.height;
                this._newLayouts.push(itemRect);
            }

            if (this._isHorizontal) {
                startY += itemDim.height;
            }
            else {
                startX += itemDim.width;
            }
        }
        this._layouts = this._newLayouts;
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth += maxBound;
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight += maxBound;
        }
    }

    _checkBounds(itemX, itemY, itemDim, isHorizontal) {
        return isHorizontal ? (itemY + itemDim.height <= this._window.height) : (itemX + itemDim.width <= this._window.width);
    }
}

export default LayoutManager;
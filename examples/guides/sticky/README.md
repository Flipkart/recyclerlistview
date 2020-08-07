# Sticky Recycler Items Guide
* **[Sample Code](https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/sticky/sample)**

All you need to do to get started is wrap your `RecyclerListView` component with the `StickyContainer` component and pass either or both `stickyHeaderIndices` and `stickyFooterIndices`.

### 1) Important points to note
* `stickyHeaderIndices` and `stickyFooterIndices` should be sorted arrays, otherwise error will be thrown.
* `StickyContainer` should have a single child component of type `RecyclerListView` or any that extends it, otherwise error will be thrown.
* In your `RecyclerListView` component, pass ref as a function and not as a string, otherwise error will be thrown.
```js
<RecyclerListView ref={this._setRef}/>

_setRef(recycler) {
    this._recyclerRef = recycler;
}
```
* If using `overrideRowRenderer`, keep in mind that upon scrolling to the very top or bottom of the content, stickies will be hidden. eg. If the first item in the list is given as sticky, scrolling to the top will display the original view and not the overridden view.

### 2) Props
* `stickyHeaderIndices`     - An array of indices whose corresponding items need to be stuck to the top of the RecyclerListView once the items scroll off the top. Every subsequent sticky index view will push the previous sticky view off the top to take its place. Needs to be sorted ascending.
* `stickyFooterIndices`     - Works same as sticky headers, but for views to be stuck at the bottom of the recyclerView. Needs to be sorted ascending.
* `overrideRowRenderer`     - Optional. Will be called instead of rowRenderer for all sticky items. Any changes to the item for when they are stuck can be done here. Refer to sample code for usage.
* `renderStickyContainer`   - Optional. Pass a stylized container for StickyHeader and StickyFooter, providing user extensibility to customize the look and feel of these items.
* `applyWindowCorrection`   - Optional. Enhancement/replacement of `distanceFromWindow` API. Used when window bound of visible view port needs to be altered. Should be used when visible window bound need to be updated for e.g. Other components overlaying on the RecyclerListView. **[Usage?](#applywindowcorrection-usage)**
* `style`                   - Optional. Pass the same style that is applied to the RecyclerListView component here.


### applyWindowCorrection usage

`applyWindowCorrection` is used to alter the visible window bounds of the RecyclerListView dynamically. The windowCorrection of RecyclerListView along with the current scroll offset are exposed to the user. The `windowCorrection` object consists of 3 numeric values:
 - `windowShift`        - Direct replacement of `distanceFromWindow` parameter. Window shift is the offset value by which the RecyclerListView as a whole is displaced within the StickyContainer, use this param to specify how far away the first list item is from window top. This value corrects the scroll offsets for StickyObjects as well as RecyclerListView.
 - `startCorrection`    - startCorrection is used to specify the shift in the top visible window bound, with which user can receive the correct Sticky header instance even when an external factor like CoordinatorLayout toolbar. 
 - `endCorrection`      - endCorrection is used to specify the shift in the bottom visible window bound, with which user can receive correct Sticky Footer instance when an external factor like bottom app bar is changing the visible view bound.

As seen in the example below

![Alt Text](/docs/images/getWindowCorrection_demo.gif)

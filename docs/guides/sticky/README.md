# Sticky Recycler Items Guide
* **[Sample Code](https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/sticky/sample)**

All you need to do to get started is wrap your `RecyclerListView` component with the `StickyContainer` component and pass either or both `stickyHeaderIndices` and 'stickyFooterIndices'.

### 1) Important points to note
* `stickyHeaderIndices` and `stickyFooterIndices` should be sorted arrays, otherwise behaviour will be unexpected.
* StickyContainer should have a single child component of type RecyclerListView or any that extends it.
* In your RecyclerListView component, pass ref as a function and not as a string.
```js
<RecyclerListView ref={this._setRef}/>

_setRef(recycler) {
    this._recyclerRef = recycler;
}
```

### 2) Props
* stickyHeaderIndices   - An array of indices whose corresponding items need to be stuck to the top of the RecyclerListView once the items scroll off the top. Every subsequent sticky index view will push the previous sticky view off the top to take its place. Needs to be sorted ascending.
* stickyFooterIndices   - Works same as sticky headers, but for views to be stuck at the bottom of the recyclerView. Needs to be sorted ascending.
* overrideRowRenderer   - Optional. Will be called instead of rowRenderer for all sticky items. Any changes to the item for when they are stuck can be done here. Refer to sample code for usage.
* style                 - Optional. Pass the same style that is applied to the RecyclerListView component here.

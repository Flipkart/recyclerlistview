# Performance
To ensure optimal performance there are a few thing that you need to watch out for. Main points are mentioned below.

**Common issue:** Lof of people start testing performance with dev mode turned on. Please make sure `dev=false` and `minify=true` before you start your benchmarking.

### 1) `rowHasChanged` method
This is what you pass to the `DataProvider` when you create it. Reference code:

```js
this.state = {
    dataProvider: new DataProvider((r1, r2)=> {
        //This is the important part
        return r1 !== r2;
    })
}
```
The purpose of this method is to equip RLV with a method to detect if data has changed. We chose not to depend on references since lot of datasets have item ids which work better than references when available.

Since RLV is a component it has to do renders to manipulate rows. In these cycles lot of rows which have not changed might get impacted. So, lets say 2 out 10 rows have changed RLV will still try to re-render all of them. In such cases this method allows `ViewRenderer` to completely skip unchanged rows and maintain optimal performance. An issue here can significantly increase load on JS thread which can lead to lot of blank spaces while scrolling.

Getting this method correct is, undoubtedly, the most important performance aspect.

### 2) `key` prop is not needed!
Please **don't** add `key` prop to the output of `rowRenderer`. It is intentional to not have it. Adding it will stop recycling and cause random mounts/unmounts. It will totally ruin performance.

### 3) Estimated heights
If you're using `forceNonDeterministicRendering` the layout manager expects heigts and widths provided by you as close estimates. By default in first pass RLV will compute layout based on estimates and position items. Post that RLV uses `ItemAnimator` to gracefully move items to actual positions based on actual layouts computed after views mount.

Any mismatch in actual and estimated layouts leads to relayout cycles which are not a concern if estimates are close otherwise it becomes a performance bottleneck. Incorrect values may lead to lot of visual glitches and increased blank areas.

Lower estimates may also lead to extra mounts which are not required while higer estimates cause mounts to happen unexpectedly when RLV realises there aren't enough views to fill the screen.

Make sure you try to bring estimates close to actual values. Non deterministic mode improves dev experience dramatically and with some effort you can match the performance of `deterministic` mode where there is zero layout thrashing.

### 4) Ensure `shouldComponentUpdate` is present
In few cases `rowHasChanged` may not work. One example would be when RLV needs to actually reposition items using regular render cycle, let's say if the first row shifts by `1px` all of them need to be moved. In this case RLV will re-render the cell to change position but, inadvertently, your component will also become part of this cycle. 

Look at this code:

```js
rowRenderer(type, data) => {
    return <MyComponent content={data}/>;
}
```

In the above case `MyComponent` should have a valid `shouldComponentUpdate` defined in its implementation. Depending on the use case this might significantly reduce load on JS thread. Make sure you put it there.

### 5) `extendedState` usage
Extendate state defines values that rows/columns depend on but reside outside of the row data. Imagine a wishlist kind of scenario where each row needs to check a separate `set` to detect if it's part of it. Changing `extendedState` re-renders all the rows.

```js
this.state = {
    extendedState: {
        ids: [] //array of ids
    }
}

//CORRECT
<RecyclerListView extendedState={this.state.extendedState}/>

//INCORRECT
<RecyclerListView extendedState={{ ids: []}}/>
```

The second approach will change the object on every render that you might do in your application. This might cause unnecessary RLV renders. Thus make sure `extendedState` object only changes when you intend things to re-render.

### 6) Use Stable Ids
In case you have frequent full page refreshes where entire data changes e.g, cache then network load strategy. In these cases having a stable id to identify data with helps RLV in using the most optimal views to render new data. By default, indexes are used as ids which might not be very optimal in aforementioned case. Stable Ids also help in add/remove animations if they fit your use case.

Note: `stableId` feature is only available in versions above `1.4.0`

### 7) `renderAheadOffset` usage
`renderAheadOffset` specifies how much ahead of current scroll postion does RLV renders items to prevent visible blank spaces. This buffer is maintained both on the top and bottom of the list. You may choose a to play with this but only after you've taken care of all other points.

Please note that lower value is better. A lower values ensures that less number of views are created and that they're quickly available for recycling. You should be choosing the smallest value that gives you zero blank spaces while scrolling.
Larger values mount extra views and increases the offset after which views are available for recycling but it might help with faster scrolling depending on the use case.

In most cases, defaults work the best.

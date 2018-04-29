# Performance
To ensure optimal performance there are a few thing that you need to watch out for:

**Common issue:** Lof of people start testing performance with dev mode turned on. Please make sure `dev=false` and `minify=true` before you start your benchmarking.

## `rowHasChanged` method
This is what you pass to the DataProvider when you create it. Reference code:

```js
this.state = {
    dataProvider: new DataProvider((r1, r2)=> {
        //This is the important part
        return r1 !== r2;
    })
}
```
The purpose of this method is to equip RLV with a method to detect if data has changed. We chose not to depend just on the reference since lot of data has ids which will work better than reference.
Since RLV is also a component it has do renders to manipulate rows but in these cycles lot of rows which have not changed might get impacted. So, lets say 1 out 10 rows has changes RLV will still re-render. In such cases this method allows RLV to completely skip unchanged rows and maintain optimal performance. An issue here can significantly increase load on JS thread which can lead to lot of blank spaces while scrolling.
Getting this method correct is, undoubtedly, the most important aspect.

## Estimated heights
If you're using `forceNonDeterministicRendering` the layout manager expects heigts and widths provides by you as close estimates. By default in first pass RLV will compute layout based on estimates and place the items there post that, RLV uses `ItemAnimator` to gracefully move items to actual positions based on actual layouts computed after views mount.
Any mismatch in actual and estimated layout leads to a relayout cycle which is not a concern if they're not extremely far off.
Incorrect values may lead to lot of visual glitches and increased blank areas.
Make sure you try to bring estimates close to actual values. This mode improves dev experience dramatically and with some effort you can match the performance of `deterministic` mode where there is zero layout thrashing.

## Ensure `shouldComponentUpdate` is present
In few cases `rowHasChanged` may not work. One example would be when RLV needs to actually reposition items using regular render cycle, let's say if the first row shifts by 1px all of them need to be moved. In this case RLV will re-render the cell to change position but, inadvertently, you component will also become part of this cycle. 

Look at this code:

```js
rowRenderer(type, data) => {
    return <MyComponent content={data}/>;
}
```

In the above case `MyComponent` should have a valid `shouldComponentUpdate` define in its implementation. Depending on the use case this might significantly reduce load on JS thread. Make sure you put it there.

## `extendedState` usage
Extendate defines state variables of rows/columns the reside outside of the row data. Imagine a wishlist kind of scenario where each row needs to check a separate `set` to detect if it's part of it. Changing `extendedState` re-renders all the rows.

```js
this.state = {
    extendedState: {
        ids: [] //array of ids
    }
}

//CORRECT
<RecyclerListView extendedState={this.state.extendedState}/>

//NOT CORRECT
<RecyclerListView extendedState={{ ids: []}}/>
```

The second approach will change the object on every render that you might do in your application. This might cause unnecessary RLV renders. Thus make sure `extendedState` object only changes when you intend things to re-render.

## Use Stable Ids
In case you have frequent full page refreshes where entire data changes e.g, cache first then network loads. In these cases having a stable id to identify data with helps RLV in using the most optimal views to render new data. By default, indexes are used as ids which might not be very optimal in aforementioned case. Stable Ids also help in add/remove animations if they fit your use case.
 
Note: stableIds are only available in version `1.4.0+`
# RecyclerListView

[![npm version](https://img.shields.io/npm/v/recyclerlistview.svg)](https://www.npmjs.com/package/recyclerlistview)
[![travis](https://travis-ci.org/Flipkart/recyclerlistview.svg?branch=master)](https://travis-ci.org/Flipkart/recyclerlistview)
[![License](https://img.shields.io/badge/License-Apache%202.0-brightgreen.svg)](https://opensource.org/licenses/Apache-2.0)

If this project has helped you out, please support us with a star :star2:.

This is a high performance listview for React Native and Web with support for complex layouts. JS only with no native dependencies, inspired by both RecyclerView on Android
and UICollectionView on iOS.

`npm install --save recyclerlistview`

* **[Overview and features](#overview-and-features)**
* **[Why?](#why)**
* **[Demo](#demo)**
* **[Props](#props)**
* **[Sample Code](#sample-code)**
* **[License](#license)**
* **[Contact us](#contact-us)**

Note: Documentation will be upgraded soon, for now check code comments for clarity and exploring features. This component is actively tested with React Native Web as well.


## Overview and features
RecyclerListView uses "cell recycling" to reuse views that are no longer visible to render items instead of creating new view objects. Creation of objects
is very expensive and comes with a memory overhead which means as you scroll through the list the memory footprint keeps going up. Releasing invisible items off
memory is another technique but that leads to creation of even more objects and lot of garbage collections. Recycling is the best way to render infinite lists
that does not compromise performance or memory efficiency.

Apart from all performance benefits RecyclerListView comes with great features out of the box:
- Cross Platform, works on Web
- Supports staggered grid layouts
- Instant layout switching like going from GridView to ListView and vice versa
- End reach detections
- Horizontal Mode
- Viewability Events
- Initial render offset/index support
- Footer support
- Reflow support on container size change with first visible item preservation
- Scroll position preservation
- Window scrolling support for web
- Non deterministic rendering mode on demand (height cannot be determined before rendering)

## Why?

RecyclerListView was built with performance in mind which means no blanks while quick scrolls or frame drops.
RecyclerListView encourages you to have deterministic heights for items you need to render. This does not mean that you need to have all items of same height and stuff, all you need
is a way to look at the data and compute height upfront so that RecyclerListView can compute layout in one pass rather than waiting for the draw to happen.
You can still do all sorts of GridViews and ListViews with different types of items which are all recycled in optimal ways. Type based recycling is very easy
to do and comes out of the box.

In case you really need non deterministic rendering set `forceNonDeterministicRendering` prop to true on RecyclerListView. This increases layout thrashing and thus, will
not be as fast.


## Demo

Expo snack demos: 
https://snack.expo.io/rksoUdx-f
https://snack.expo.io/B1GYad52b

Sample project: https://github.com/naqvitalha/travelMate

Context Preservation Sample: https://github.com/naqvitalha/recyclerlistview-context-preservation-demo

Watch Demo Video: https://www.youtube.com/watch?v=Tnv4HMmPgMc

[![Watch Video](https://img.youtube.com/vi/Tnv4HMmPgMc/0.jpg)](https://www.youtube.com/watch?v=Tnv4HMmPgMc)

## Props
For full feature set have a look at prop definitions of [RecyclerListView](https://github.com/Flipkart/recyclerlistview/blob/593b7636264a49eb17bf75f88513420b8f0c9b85/src/core/RecyclerListView.tsx#L478-L547)
(bottom of the file).

## Sample Code
Please go through DataProvider, LayoutProvider and rowRenderer in detail. Those are the basic building blocks of this component. For more details dive into
the source code, lot of relevant comments have been added to help you out. 

```js
/***
 Use this component inside your React Native Application.
 A scrollable list with different item type
 */
import React, { Component } from "react";
import { View, Text, Dimensions } from "react-native";
import { RecyclerListView, DataProvider, LayoutProvider } from "recyclerlistview";

const ViewTypes = {
    FULL: 0,
    HALF_LEFT: 1,
    HALF_RIGHT: 2
};

let containerCount = 0;

class CellContainer extends React.Component {
    constructor(args) {
        super(args);
        this._containerId = containerCount++;
    }
    render() {
        return <View {...this.props}>{this.props.children}<Text>Cell Id: {this._containerId}</Text></View>;
    }
}

/***
 * To test out just copy this component and render in you root component
 */
export default class RecycleTestComponent extends React.Component {
    constructor(args) {
        super(args);

        let { width } = Dimensions.get("window");

        //Create the data provider and provide method which takes in two rows of data and return if those two are different or not.
        //THIS IS VERY IMPORTANT, FORGET PERFORMANCE IF THIS IS MESSED UP
        let dataProvider = new DataProvider((r1, r2) => {
            return r1 !== r2;
        });

        //Create the layout provider
        //First method: Given an index return the type of item e.g ListItemType1, ListItemType2 in case you have variety of items in your list/grid
        //Second: Given a type and object set the exact height and width for that type on given object, if you're using non deterministic rendering provide close estimates
        //If you need data based check you can access your data provider here
        //You'll need data in most cases, we don't provide it by default to enable things like data virtualization in the future
        //NOTE: For complex lists LayoutProvider will also be complex it would then make sense to move it to a different file
        this._layoutProvider = new LayoutProvider(
            index => {
                if (index % 3 === 0) {
                    return ViewTypes.FULL;
                } else if (index % 3 === 1) {
                    return ViewTypes.HALF_LEFT;
                } else {
                    return ViewTypes.HALF_RIGHT;
                }
            },
            (type, dim) => {
                switch (type) {
                    case ViewTypes.HALF_LEFT:
                        dim.width = width / 2;
                        dim.height = 160;
                        break;
                    case ViewTypes.HALF_RIGHT:
                        dim.width = width / 2;
                        dim.height = 160;
                        break;
                    case ViewTypes.FULL:
                        dim.width = width;
                        dim.height = 140;
                        break;
                    default:
                        dim.width = 0;
                        dim.height = 0;
                }
            }
        );

        this._rowRenderer = this._rowRenderer.bind(this);

        //Since component should always render once data has changed, make data provider part of the state
        this.state = {
            dataProvider: dataProvider.cloneWithRows(this._generateArray(300))
        };
    }

    _generateArray(n) {
        let arr = new Array(n);
        for (let i = 0; i < n; i++) {
            arr[i] = i;
        }
        return arr;
    }

    //Given type and data return the view component
    _rowRenderer(type, data) {
        //You can return any view here, CellContainer has no special significance
        switch (type) {
            case ViewTypes.HALF_LEFT:
                return (
                    <CellContainer style={styles.containerGridLeft}>
                        <Text>Data: {data}</Text>
                    </CellContainer>
                );
            case ViewTypes.HALF_RIGHT:
                return (
                    <CellContainer style={styles.containerGridRight}>
                        <Text>Data: {data}</Text>
                    </CellContainer>
                );
            case ViewTypes.FULL:
                return (
                    <CellContainer style={styles.container}>
                        <Text>Data: {data}</Text>
                    </CellContainer>
                );
            default:
                return null;
        }
    }

    render() {
        return <RecyclerListView layoutProvider={this._layoutProvider} dataProvider={this.state.dataProvider} rowRenderer={this._rowRenderer} />;
    }
}
const styles = {
    container: {
        justifyContent: "space-around",
        alignItems: "center",
        flex: 1,
        backgroundColor: "#00a1f1"
    },
    containerGridLeft: {
        justifyContent: "space-around",
        alignItems: "center",
        flex: 1,
        backgroundColor: "#ffbb00"
    },
    containerGridRight: {
        justifyContent: "space-around",
        alignItems: "center",
        flex: 1,
        backgroundColor: "#7cbb00"
    }
};
```
You can find similar web sample [here](samples/web/Sample1.js).
Note: Works with React Native Web out of the box, to use with ReactJS start importing from `recyclerlistview/web` e.g., `import { RecyclerListView } from "recyclerlistview/web"`. Use aliases if you
want to preserve import path. Only platform specific code is part of the build so, no unnecessary code will ship with your app.

## License
[Apache v2.0](https://github.com/Flipkart/recyclerlistview/blob/master/LICENSE.md)

## Contact Us
Please open issues for any bugs that you encounter. You can reach out to me on twitter [@naqvitalha](https://www.twitter.com/naqvitalha) or, write to cross-platform@flipkart.com for any questions that
you might have.

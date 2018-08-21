# RecyclerListView

[![npm version](https://img.shields.io/npm/v/recyclerlistview.svg)](https://www.npmjs.com/package/recyclerlistview)
[![travis](https://travis-ci.org/Flipkart/recyclerlistview.svg?branch=master)](https://travis-ci.org/Flipkart/recyclerlistview)
[![License](https://img.shields.io/badge/License-Apache%202.0-brightgreen.svg)](https://opensource.org/licenses/Apache-2.0)

If this project has helped you out, please support us with a star :star2:.

This is a high performance listview for React Native and Web with support for complex layouts. JS only with no native dependencies, inspired by both RecyclerView on Android
and UICollectionView on iOS.

`npm install --save recyclerlistview`

For latest beta:  
`npm install --save recyclerlistview@beta`

* **[Overview and features](#overview-and-features)**
* **[Why?](#why)**
* **[Demo](#demo)**
* **[Props](#props)**
* **[Guides](#guides)**
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
- (New) ItemAnimator interface added, customize to your will how RLV handles layout changes. Allows you to modify animations that move cells. You can do things like smoothly move an item to a new position when height of one of the cells has changed.
- (New) Stable Id support, ability to associate a stable id with an item. Will enable beautiful add/remove animations and optimize re-renders when DataProvider is updated.

## Why?

RecyclerListView was built with performance in mind which means no blanks while quick scrolls or frame drops.
RecyclerListView encourages you to have deterministic heights for items you need to render. This does not mean that you need to have all items of same height and stuff, all you need
is a way to look at the data and compute height upfront so that RecyclerListView can compute layout in one pass rather than waiting for the draw to happen.
You can still do all sorts of GridViews and ListViews with different types of items which are all recycled in optimal ways. Type based recycling is very easy
to do and comes out of the box.

In case you really need non deterministic rendering set `forceNonDeterministicRendering` prop to true on RecyclerListView. This increases layout thrashing and thus, will
not be as fast.


## Demo

**Production Flipkart Grocery Demo Video (or try the app):** https://youtu.be/6YqEqP3MmoU  
**Infinite Loading/View Change (Expo):** https://snack.expo.io/@naqvitalha/rlv-demo  
**Mixed ViewTypes:** https://snack.expo.io/B1GYad52b  
**Sample project:** https://github.com/naqvitalha/travelMate  
**Web Sample (Using RNW):** https://codesandbox.io/s/k54j2zx977, https://jolly-engelbart-8ff0d0.netlify.com/  
**Context Preservation Sample:** https://github.com/naqvitalha/recyclerlistview-context-preservation-demo

**Other Video:** https://www.youtube.com/watch?v=Tnv4HMmPgMc

[![Watch Video](https://img.youtube.com/vi/Tnv4HMmPgMc/0.jpg)](https://www.youtube.com/watch?v=Tnv4HMmPgMc)

## Props
For full feature set have a look at prop definitions of [RecyclerListView](https://github.com/Flipkart/recyclerlistview/blob/21049cc89ad606ec9fe8ea045dc73732ff29eac9/src/core/RecyclerListView.tsx#L540-L634)
(bottom of the file). All `ScrollView` features like `RefreshControl` also work out of the box.

## Guides
* **[Sample Code](https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/samplecode)**
* **[Performance](https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/performance)**
* **Web Support:** Works with React Native Web out of the box. For use with ReactJS start importing from `recyclerlistview/web` e.g., `import { RecyclerListView } from "recyclerlistview/web"`. Use aliases if you want to preserve import path. Only platform specific code is part of the build so, no unnecessary code will ship with your app.
* **Polyfills Needed:** `requestAnimationFrame`

## License
**[Apache v2.0](https://github.com/Flipkart/recyclerlistview/blob/master/LICENSE.md)**

## Contact Us
Please open issues for any bugs that you encounter. You can reach out to me on twitter [@naqvitalha](https://www.twitter.com/naqvitalha) or, write to cross-platform@flipkart.com for any questions that
you might have.

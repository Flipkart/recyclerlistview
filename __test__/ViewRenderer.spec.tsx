import * as React from "react";
import ViewRenderer from "../src/platform/reactnative/viewrenderer/ViewRenderer";
import * as TestRenderer from "react-test-renderer";
//import * as ShallowRenderer from 'react-test-renderer/shallow'
import { ViewRendererProps } from "../src/core/viewrenderer/BaseViewRenderer";
import { BaseItemAnimator } from "../src/core/ItemAnimator";

const viewRendererProps: ViewRendererProps<any> = {
    x: 0,
    y: 0,
    height: 100,
    width: 100,
    itemAnimator: new BaseItemAnimator(),
    childRenderer: (type: string | number, data: any, index: number, extendedState?: object) => null,
    data: { text: "sfsdfsdfsdf" },
    onSizeChanged: () => {
        // no op
    },
    layoutType: 1,
    index: 0,
    dataHasChanged: (r1, r2) => r1 !== r2,
};

//const renderer = new ShallowRenderer();
//let viewRenderer = renderer.render(<ViewRenderer {...viewRendererProps} />);

test("adds 1 + 2 to equal 3", () => {
    const jsonVR = TestRenderer.create(<ViewRenderer {...viewRendererProps} />).toJSON();
    expect(jsonVR).toMatchSnapshot();
});

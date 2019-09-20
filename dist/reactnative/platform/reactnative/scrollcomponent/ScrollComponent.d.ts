/// <reference types="react" />
import BaseScrollComponent, { ScrollComponentProps } from "../../../core/scrollcomponent/BaseScrollComponent";
/***
 * The responsibility of a scroll component is to report its size, scroll events and provide a way to scroll to a given offset.
 * RecyclerListView works on top of this interface and doesn't care about the implementation. To support web we only had to provide
 * another component written on top of web elements
 */
export default class ScrollComponent extends BaseScrollComponent {
    static defaultProps: {
        contentHeight: number;
        contentWidth: number;
        externalScrollView: {};
        isHorizontal: boolean;
        scrollThrottle: number;
    };
    private _height;
    private _width;
    private _isSizeChangedCalledOnce;
    private _scrollViewRef;
    constructor(args: ScrollComponentProps);
    scrollTo(x: number, y: number, isAnimated: boolean): void;
    render(): JSX.Element;
    private _getScrollViewRef;
    private _onScroll;
    private _onLayout;
}

/// <reference types="react" />
import BaseScrollView, { ScrollViewDefaultProps } from "../../../core/scrollcomponent/BaseScrollView";
/***
 * A scrollviewer that mimics react native scrollview. Additionally on web it can start listening to window scroll events optionally.
 * Supports both window scroll and scrollable divs inside other divs.
 */
export default class ScrollViewer extends BaseScrollView {
    static defaultProps: {
        canChangeSize: boolean;
        horizontal: boolean;
        style: null;
        useWindowScroll: boolean;
    };
    private _mainDivRef;
    private _isScrolling;
    private _scrollEventNormalizer;
    constructor(args: ScrollViewDefaultProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    scrollTo(scrollInput: {
        x: number;
        y: number;
        animated: boolean;
    }): void;
    render(): JSX.Element;
    private _setDivRef(div);
    private _getRelevantOffset();
    private _setRelevantOffset(offset);
    private _isScrollEnd();
    private _trackScrollOccurence();
    private _doAnimatedScroll(offset);
    private _startListeningToDivEvents();
    private _startListeningToWindowEvents();
    private _onWindowResize();
    private _windowOnScroll();
    private _onScroll();
    private _easeInOut(currentTime, start, change, duration);
}

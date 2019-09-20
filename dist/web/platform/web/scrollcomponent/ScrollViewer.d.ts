/// <reference types="react" />
import BaseScrollView from "../../../core/scrollcomponent/BaseScrollView";
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
    private scrollEndEventSimulator;
    private _mainDivRef;
    private _isScrolling;
    private _scrollEventNormalizer;
    componentDidMount(): void;
    componentWillUnmount(): void;
    scrollTo(scrollInput: {
        x: number;
        y: number;
        animated: boolean;
    }): void;
    render(): JSX.Element;
    private _setDivRef;
    private _getRelevantOffset;
    private _setRelevantOffset;
    private _isScrollEnd;
    private _trackScrollOccurence;
    private _doAnimatedScroll;
    private _startListeningToDivEvents;
    private _startListeningToWindowEvents;
    private _onWindowResize;
    private _windowOnScroll;
    private _onScroll;
    private _easeInOut;
}

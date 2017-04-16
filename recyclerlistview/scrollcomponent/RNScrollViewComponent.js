class RNScrollViewComponent extends React.Component {
    constructor(args) {
        super(args);
        let methodsToBind = [this._onScroll];
        EasyBinder.bind(methodsToBind, this, this);
    }

    _onScroll(event) {
        this.props.onScrollCallback(event.currentXOffset, event.currentYOffset);
    }
}
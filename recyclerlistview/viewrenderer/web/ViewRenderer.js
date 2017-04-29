import React from "react";
import ReactDOM from "react-dom";

class ViewRenderer extends React.Component {
    constructor(args) {
        super(args);
    }

    shouldComponentUpdate(newProps) {
        return (this.props.x !== newProps.x ||
        this.props.y !== newProps.y ||
        this.props.width !== newProps.width ||
        this.props.height !== newProps.height ||
        (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data)));
    }

    _getTransform() {
        return "translate(" +
            this.props.x +
            "px," +
            this.props.y +
            "px)";
    }

    render() {
        return (
            <div
                ref="mainDiv"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: this.props.width,
                    height: this.props.height,
                    transform: this._getTransform()
                }}
            >
                {this.props.childRenderer(this.props.layoutType, this.props.data)}
            </div>
        );
    }
}
export default ViewRenderer;
//#if [DEV]
ViewRenderer.propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired,
    childRenderer: React.PropTypes.func.isRequired,
    layoutType: React.PropTypes.any,
    dataHasChanged: React.PropTypes.func,
    data: React.PropTypes.any
};
//#endif

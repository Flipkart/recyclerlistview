import React from "react";
import ReactDOM from "react-dom";

class ViewHolder extends React.Component {
    constructor(args) {
        super(args);
        this.nodeRef = null;
    }

    shouldComponentUpdate(newProps) {
        return this.props.x !== newProps.x ||
            this.props.y !== newProps.y ||
            this.props.width !== newProps.width ||
            this.props.height !== newProps.height;
    }

    componentWillReceiveProps() {
        this.applyTransform();
    }

    applyTransform() {
        if (this.nodeRef) {
            this.nodeRef.style.transform = "translate(" +
                this.props.x +
                "px," +
                this.props.y +
                "px)";
        }
    }

    componentDidMount() {
        if (!this.nodeRef) {
            let div = this.refs["mainDiv"];
            this.nodeRef = ReactDOM.findDOMNode(div);
            this.applyTransform();
        }
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
                    height: this.props.height
                }}
            >
                {this.props.children}
            </div>
        );
    }
}
export default ViewHolder;
//#if [DEV]
ViewHolder.propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired
};
//#endif

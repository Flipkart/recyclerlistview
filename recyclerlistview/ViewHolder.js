import React from "react";
import {View} from "react-native";
class ViewHolder extends React.Component {
    shouldComponentUpdate(newProps) {
        return (this.props.x !== newProps.x ||
        this.props.y !== newProps.y ||
        this.props.width !== newProps.width ||
        this.props.height !== newProps.height);
    }

    render() {
        return (
            <View style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: this.props.width,
                height: this.props.height,
                transform: [{translateX: this.props.x}, {translateY: this.props.y}]
            }}>
                {this.props.children}
            </View>
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
}
//#endif
import React, { Component } from "react";
import { connect } from "react-redux";

export class Counter extends Component {
  render() {
    return (
      <div>
        <p>Count: { this.props.count || 0 } / { this.props.count2 || 0 }</p>
        <button onClick={this.props.onStart}>Start</button>
        <button onClick={this.props.onStop}>Stop</button>
      </div>
    );
  }
}

export default connect(
  (state) => {
    return {
      count: state.count,
      count2: state.count2
    };
  },
  (dispatch) => ({
    onStart: () => dispatch({ type: "START", payload: 1000 }),
    onStop: () => dispatch({ type: "STOP" })
  })
)(Counter);
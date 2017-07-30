import React, { Component } from "react";
import { connect } from "react-redux";
import { selectNextStory } from "../states/hn";

let ID_COUNTER = 0;

export class StoryCycler extends Component {
  render() {
    let { story } = this.props;
    return <div>
      { story ?
        <a href={"https://news.ycombinator.com/item?id=" + story.id}>
          { story.title }
        </a> :
        <span>
          Loading &hellip;
        </span> }
    </div>;
  }

  componentDidMount() {
    this.id = ID_COUNTER++;
    this.props.onStart(this.id);
  }

  componentWillUnmount() {
    this.props.onStop(this.id);
  }
}

export default connect(
  (state, { listType }) => ({ story: selectNextStory(listType)(state) }),
  (dispatch, { listType }) => ({
    onStart: (id) => dispatch({
      type: "START_HN",
      payload: {
        interval: 3000,
        listType,
        id
      }
    }),
    onStop: (id) => dispatch({
      type: "STOP_HN",
      payload: { id }
    })
  })
)(StoryCycler);
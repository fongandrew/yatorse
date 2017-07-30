import React, { Component } from "react";
import { connect } from "react-redux";
import Layout from "./Layout";
import StoryCycler from "./StoryCycler";
import { selectRoute } from "../states/routes";

export class App extends Component {
  render() {
    let { route } = this.props;
    route = route || "top";
    return (
      <Layout>
        <p>What are the haps my friends?</p>
        { this.renderNav(route) }
        { this.renderMain(route) }
      </Layout>
    );
  }

  renderNav(route) {
    return <nav>
      { route === "top" ? "Top Stories" : <a href="#top">Top Stories</a> }
      {" | "}
      { route === "new" ? "New Stories" : <a href="#new">New Stories</a> }
    </nav>;
  }

  renderMain(route) {
    if (route === "new") {
      return <NewStories />;
    } else {
      return <TopStories />;
    }
  }
}

export const NewStories = () => <StoryCycler listType="new" />;
export const TopStories = () => <StoryCycler listType="top" />;

export default connect(
  (state) => ({ route: selectRoute(state) })
)(App);
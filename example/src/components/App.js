import React, { Component } from "react";
import Layout from "./Layout";
import StoryCycler from "./StoryCycler";

export default class App extends Component {
  render() {
    return (
      <Layout>
        <p>What are the haps my friends?</p>
        <StoryCycler />
      </Layout>
    );
  }
}
import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Web3 from 'web3'
import ListingView from './pages/ListingView'
import ListingSearch from './pages/ListingSearch'
import AccountPage from './pages/AccountPage'
import Navigation from './pages/Navigation'
import { setWeb3Js } from '../redux/actions'


class App extends Component {
  constructor() {
    super()
    this.onWindowLoad = this.onWindowLoad.bind(this)
  }

  componentDidMount() {
    window.addEventListener('load', this.onWindowLoad)
  }

  onWindowLoad() {
    const { dispatch } = this.props
    const web3js = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    dispatch(setWeb3Js(web3js))

    // Define global variables
    window.isSet = val => val !== null && typeof (val) !== 'undefined'
  }

  render() {
    return (
      <Router>
        <div className="container">
          <Navigation />
          <Route exact path="/listing" component={ListingSearch} />
          <Route exact path="/account" component={AccountPage} />
          <Route path="/listing/:lid" component={ListingView} />
        </div>
      </Router>
    )
  }
}

App.propTypes = {
  dispatch: PropTypes.func.isRequired,
}

export default connect()(App)

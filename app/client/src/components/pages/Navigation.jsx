import React, { Component } from 'react'
import { Link } from 'react-router-dom'

class Navigation extends Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div>
          <Link className="navbar-brand" to="/listing/">EthBnB</Link>
        </div>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
      </nav>
    )
  }
}

export default Navigation

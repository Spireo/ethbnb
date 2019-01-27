import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import GridLayout from 'react-grid-layout'
import log from '../../logger'
import IPFSImage from '../IPFSImage'
import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'


const mapStateToProps = state => ({ listings: state.server.listings })

class ListingsPage extends Component {
  render() {
    // layout is an array of objects, see the demo for more complete usage
    const self = this
    let i = 0
    const layout = []
    const COLS = 3
    const doms = []
    Object.keys(self.props.listings).forEach((key) => {
      const l = self.props.listings[key]
      doms.push((
        <div key={i}>
          {l.shortName}
          <IPFSImage hash={l.mainImageHash} ext={l.mainImageExtension} />
        </div>
      ))
      layout.push({
        i: i.toString(),
        x: i % COLS,
        y: i / COLS,
        w: 3,
        h: 3,
      })
      i += 1
    })

    return (
      <GridLayout className="layout" layout={layout} cols={COLS} rowHeight={30} width={1200}>
        {doms}
      </GridLayout>
    )
  }
}

export default withRouter(connect(mapStateToProps, null)(ListingsPage))

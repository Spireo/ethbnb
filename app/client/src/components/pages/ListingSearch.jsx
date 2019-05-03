import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import RGL, { WidthProvider } from 'react-grid-layout'
import { Loader } from 'semantic-ui-react'
import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'
import ListingSearchArea from './ListingSearchArea'
import ListingMini from './ListingMini'
import { fetchListingsIfNeeded } from '../../redux/actions'

const ReactGridLayout = WidthProvider(RGL)

class ListingSearch extends Component {
  async componentDidMount() {
    const { dispatch } = this.props
    dispatch(fetchListingsIfNeeded())
  }

  render() {
    const self = this
    // ReactGridLayout
    const COLS = 3
    const layout = []
    const doms = []
    let i = 0

    const { isFetching } = this.props

    Object.keys(self.props.listings).forEach((key) => {
      const listing = self.props.listings[key]
      doms.push((
        <div className="listing-mini" key={i}>
          <ListingMini {...listing} />
        </div>
      ))
      layout.push({
        i: i.toString(),
        x: parseInt(i % COLS, 10),
        y: parseInt(i / COLS, 10),
        w: 1,
        h: 1,
      })
      i += 1
    })
    return (
      <div className="listing-router-container">
        <ListingSearchArea />
        <Loader
          active={isFetching}
        />
        <ReactGridLayout
          items={3}
          layout={layout}
          cols={3}
          rowHeight={300}
          width={300}
          isDraggable={false}
          isResizable={false}
        >
          {doms}
        </ReactGridLayout>
      </div>
    )
  }
}

ListingSearch.propTypes = {
  dispatch: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
  listings: state.listings || [],
  isFetching: state.isFetching,
})

export default connect(mapStateToProps)(ListingSearch)

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import Rating from 'react-rating'
import PropTypes from 'prop-types'
import IPFSImage from '../IPFSImage'

// Returns the appropriate DOM element
// given totalScore and nRatings
const getRatingElem = (totalScore, nRatings) => {
  if (nRatings === 0) {
    return (
      <div className="listing-rating">
        <em> No ratings </em>
      </div>
    )
  }
  const ratingStr = (nRatings > 1) ? 'ratings' : 'rating'
  return (
    <div className="listing-rating">
      <Rating
        readonly
        initialRating={totalScore / nRatings}
        fractions={2}
      />
      <div>
        <em>
          {`${nRatings} ${ratingStr}`}
        </em>
      </div>
    </div>
  )
}

const getMainImageInfo = (images) => {
  // Prep stuff for the image
  let hash = ''
  let ext = ''
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0]
    if (img && Object.prototype.hasOwnProperty.call(img, 'hash')
      && Object.prototype.hasOwnProperty.call(img, 'path')) {
      hash = img.hash
      ext = img.path.split('.').pop()
    }
  }
  return [hash, ext]
}

class ListingMini extends Component {
  render() {
    const { lid, title, location, country, price, nRatings, totalScore, images } = this.props
    const [hash, ext] = getMainImageInfo(images)
    return (
      <div className="listing-mini">
        <Link to={`/listing/${lid}`}>
          <IPFSImage
            hash={hash}
            ext={ext}
          />
          <h5>
            {title}
          </h5>
        </Link>
        {getRatingElem(totalScore, nRatings)}
        <div>
          <em> Location: </em>
          <span className="location">
            {location}
          </span>
        </div>
        <div>
          <em> Country: </em>
          <span className="country">
            {country}
          </span>
        </div>
        <div>
          <em> Price: </em>
          <span className="price">
            {price}
          </span>
        </div>
      </div>
    )
  }
}
ListingMini.defaultProps = {
  nRatings: 0,
  totalScore: 0,
}

ListingMini.propTypes = {
  lid: PropTypes.number.isRequired,
  title: PropTypes.string,
  country: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
  nRatings: PropTypes.number,
  totalScore: PropTypes.number,
}

export default ListingMini

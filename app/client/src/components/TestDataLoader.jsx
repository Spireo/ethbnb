import React, { Component } from 'react'
import { connect } from 'react-redux'
import BigNumber from 'bignumber.js'
import { getExtensionFromFile, fileObjectFromImgDOM } from './Utils'
import { ipfsFileUpload } from './IPFS'
import log from '../logger'

const mapStateToProps = state => ({
  clients: state.clients,
})

const testData = [
  {
    name: 'createAccount',
    inputs: [{ value: 'Sami Farhat' }],
    constant: false,
    clientIndex: 0,
  },
  {
    name: 'createAccount',
    inputs: [{ value: 'Marwan Mobader' }],
    constant: false,
    clientIndex: 1,
  },
  {
    name: 'createListing',
    inputs: [
      { value: 'London', name: 'location' },
      { value: new BigNumber(1000), name: 'price' },
      { value: 'Devonshire house', name: 'shortName' },
      { value: 'Very close to the train station.', name: 'description' },
    ],
    constant: false,
    clientIndex: 0,
  },
  {
    name: 'setListingMainImage',
    // 'file' field denotes the id of the DOM element as well as the filename
    file: 'img1',
    inputs: [
      { value: new BigNumber(1), name: 'listingId' },
      { value: null, name: 'ipfsHash' },
      { value: 'My main image', name: 'title' },
      { value: null, name: 'extension' },
    ],
    constant: false,
    clientIndex: 0,
  },
]

const loadTestData = async (eth, clients, dispatchRunAPICommand) => {
  log.debug('loadTestData function called')
  for (const data of testData) {
    // For images, we need to upload them to IPFS first and get a hash.
    // Our IPFS upload process requires us to provide File objects. So the steps are:
    // 1. Find DOM element
    // 2. Extract a File object from it
    // 3. Pass the File object to ipfsFileUpload and wait to get the hash
    // 4. data.inputs[xx].value = ipfsHash
    // 5. Proceed with regularAPICommand()
    try {
      if (data.name.indexOf('setListingMainImage') > -1) {
        const imgDOM = document.getElementById(data.file)
        console.log('imgDOM', imgDOM)
        const file = await fileObjectFromImgDOM(imgDOM, data.file)
        console.log('file', file)
        data.inputs[1].value = await ipfsFileUpload(file)
        data.inputs[3].value = getExtensionFromFile(file)
        console.log('data is ', data)
      }
    } catch (err) {
      console.log('here', err)
    }
    const firstKey = Object.keys(clients)[data.clientIndex]
    const clientAddr = clients[firstKey].address
    try {
      const result = await dispatchRunAPICommand(data, clientAddr)
      log.debug(result)
    } catch (err) {
      log.error('Failed apiCmd in loadtestData.', err)
    }
  }
}


class TestDataLoader extends Component {
  render() {
    const { eth, clients, dispatchRunAPICommand } = this.props
    return (
      <div>
        <img id="img1" src="img1.jpg" alt="img1" hidden />
        <button
          key="button"
          className="btn btn-default"
          type="button"
          onClick={() => loadTestData(eth, clients, dispatchRunAPICommand)}
        >
        Load Test Data
        </button>
      </div>
    )
  }
}

export default connect(mapStateToProps, null)(TestDataLoader)

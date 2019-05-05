import { SERVER_NODE_URL } from '../constants/global'

// ============================================================
// EXPORT ACTIONS
// ============================================================

export const SET_SEARCH_OPTIONS = 'SET_SEARCH_OPTIONS'
export const REQUEST_LISTINGS = 'REQUEST_LISTINGS'
export const RECEIVE_LISTINGS = 'RECEIVE_LISTINGS'
export const RECEIVE_ACCOUNT_INFO = 'RECEIVE_ACCOUNT_INFO'
export const BOOK_LISTING = 'BOOK_LISTING'
export const SET_WEB3 = 'SET_WEB3'
export const SET_ACCOUNTS = 'SET_ACCOUNTS'
export const SET_SELECTED_ACCOUNT = 'SET_SELECTED_ACCOUNT'
export const SET_ETH_EVENTS = 'SET_ETH_EVENTS'
export const RATE_BOOKING = 'RATE_BOOKING'

// ============================================================
// FUNCTIONS
// ============================================================

const isSet = val => val !== null && typeof (val) !== 'undefined'

const getListingsURL = (opts) => {
  const params = (isSet(opts)) ? opts : {}
  for (const key in params) {
    if (params[key] === null) {
      delete params[key]
    }
  }
  const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&')
  return `${SERVER_NODE_URL}api/listings?${queryString}`
}

const shouldFetchEthEvents = (state, accountAddr) => {
  const { ethEvents, isFetchingEthEvents } = state
  if (!Array.isArray(ethEvents[accountAddr])) {
    return true
  }
  return !isFetchingEthEvents
}

const shouldFetchListings = (state) => {
  if (state.listings === null) {
    return true
  }
  if (state.isFetching) {
    return false
  }
  return false
}

const fetchListingsUsingOptions = (dispatch, state) => {
  // The server expects 'from_date' and 'to_date' in underscore format
  // whereas the client uses camelCase. We convert below.
  let opts
  if (isSet(state.searchOptions)) {
    const { fromDate, toDate, countryCode } = state.searchOptions
    opts = {
      from_date: (fromDate) ? fromDate.getTime() / 1000 : null,
      to_date: (toDate) ? toDate.getTime() / 1000 : null,
      country_code: countryCode,
    }
  } else {
    opts = {}
  }
  const url = getListingsURL(opts)
  return fetch(url)
    .then(response => response.json())
    .then(json => dispatch(({
      type: RECEIVE_LISTINGS,
      listings: json,
    })))
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

// Wrapper function for all state-changing calls
//
// @funcName     the name of the state-changing function
// @input        input values to state-changing function
// @userAddr     address for the account sending the TX
// @other        anything else that needs to be stored in the txObj
//               e.g. txHash, eventName
export const contractCall = (funcName, input, userAddr, other) => {
  return (dispatch, getState) => {
    const { contract } = getState()
    const obj = {
      from: userAddr,
      gas: 1000000,
    }
    contract.methods[funcName](...input).send(obj).then((res) => {
      console.log(`Transaction '${funcName}' sent: `, res)
      const { tx: txHash } = res
      const other1 = {
        ...other,
        txHash,
      }
      dispatch(addPendingTx(funcName, input, userAddr, other1))
    }).catch((err) => {
      console.log(`Transaction '${funcName}' send error ${err}`)
    })
  }
}
export const bookListing = (contract, ethAddr, lid, fromDate, toDate) => {
  const obj = {
    from: ethAddr,
    gas: 1000000,
  }
  if (!contract) {
    console.log('Cannot make booking when contract is not setup')
    return
  }
  if (!fromDate || !toDate) {
    console.log('Book button should be disabled when dates are not set.')
    return
  }
  const lid1 = parseInt(lid, 10)
  const nbOfDays = (toDate - fromDate) / (86400000) // number of milliseconds per day
  const fromDate1 = fromDate.getTime() / 1000

  // ESTIMATE GAS:
  //
  // contract.contract.methods.listingBook(lid1, fromDate1, nbOfDays)
  //   .estimateGas(obj)
  //   .then((err, amount) => {
  //     console.log(err)
  //     console.log(amount)
  //   })
  contract.listingBook(lid1, fromDate1, nbOfDays, obj).then((res) => {
    console.log('listingBook submitted')
    console.log(res)
  }).catch((err) => {
    // TODO: show user alert
    console.log('error from listingBook')
    console.log(err)
  })
  return {
    type: BOOK_LISTING,
    ethAddr,
    lid,
    fromDate,
    toDate,
  }
}

export const setSelectedAcccountIndex = (idx) => {
  return {
    type: SET_SELECTED_ACCOUNT,
    selectedAccountIndex: idx,
  }
}

export const setWeb3Js = (web3js) => {
  return (dispatch) => {
    const { jsonInterface, contractAddress } = window.contractDetails
    const contract = new web3js.eth.Contract(jsonInterface.abi, contractAddress)
    const provider = new web3js.providers.WebsocketProvider('ws://localhost:8545')
    web3js.setProvider(provider)
    web3js.eth.getAccounts()
      .then((accounts) => {
        dispatch({
          type: SET_WEB3,
          web3js,
          contract,
          accounts,
        })
        dispatch({
          type: SET_SELECTED_ACCOUNT,
          selectedAccountIndex: 0,
        })
      })
  }
}

export const setSearchOptions = opts => ({
  type: SET_SEARCH_OPTIONS,
  opts,
})

export const fetchAccountInfo = (user) => {
  const url = `${SERVER_NODE_URL}api/account/${user}`
  return (dispatch) => {
    fetch(url)
      .then(response => response.json())
      .then(json => dispatch({
        type: RECEIVE_ACCOUNT_INFO,
        data: json,
      }))
  }
}

export const fetchEthEvents = (contract, accountAddr) => {
  return (dispatch) => {
    const opts = {
      fromBlock: 0,
      toBlock: 'latest',
    }
    contract.getPastEvents('allEvents', opts)
      .then((events) => {
        dispatch({
          type: SET_ETH_EVENTS,
          accountAddr,
          events,
        })
      })
      .catch((err) => {
        console.log('We hit an error fetching Past events', err)
      })
  }
}

export function fetchEthEventsIfNeeded(accountAddr) {
  return (dispatch, getState) => {
    const state = getState()
    const { contract } = state
    if (shouldFetchEthEvents(state, accountAddr)) {
      return dispatch(fetchEthEvents(contract, accountAddr))
    }
  }
}

export function fetchListings() {
  return (dispatch, getState) => {
    dispatch(({ type: REQUEST_LISTINGS }))
    return fetchListingsUsingOptions(dispatch, getState())
  }
}

export function fetchListingsIfNeeded(opts) {
  return (dispatch, getState) => {
    if (shouldFetchListings(getState())) {
      return dispatch(fetchListings(opts))
    }
  }
}

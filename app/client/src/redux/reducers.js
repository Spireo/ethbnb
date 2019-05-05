import {
  ADD_PENDING_TX,
  BOOK_LISTING,
  RECEIVE_ACCOUNT_INFO,
  RECEIVE_LISTINGS,
  REMOVE_PENDING_TX,
  REQUEST_LISTINGS,
  SET_ACCOUNTS,
  SET_ETH_EVENTS,
  SET_SEARCH_OPTIONS,
  SET_SELECTED_ACCOUNT,
  SET_WEB3,
} from './actions'

const initialState = {
  isFetching: false,
  listings: null,
  searchOptions: {
    fromDate: null,
    toDate: null,
    countryCode: null,
  },
  selectedAccountIndex: 0,
  accounts: [],
  // Fetched from /api/account/:user
  // contains name, addr, bookings, dateCreated
  accountInfo: null,
  web3: null,
  contract: null,
  ethEvents: [],
  pendingTx: {},
}

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_WEB3: {
      const accounts = {}
      Array.forEach(action.accounts, (act) => accounts[act] = {})
      return {
        ...state,
        web3: action.web3js,
        contract: action.contract,
        accounts,
      }
    }
    case SET_ETH_EVENTS: {
      return {
        ...state,
        ethEvents: action.events,
      }
    }
    case SET_ACCOUNTS: {
      return {
        ...state,
        accounts: action.accounts,
      }
    }
    case SET_SELECTED_ACCOUNT: {
      return {
        ...state,
        selectedAccountIndex: action.selectedAccountIndex,
      }
    }
    case SET_SEARCH_OPTIONS: {
      return {
        ...state,
        searchOptions: Object.assign({}, state.searchOptions, action.opts),
      }
    }
    case REQUEST_LISTINGS: {
      return Object.assign({}, state, {
        isFetching: true,
        // didInvalidate: false,
      })
    }
    case RECEIVE_ACCOUNT_INFO:
      return {
        ...state,
        accountInfo: action.data,
      }
    case RECEIVE_LISTINGS:
      return Object.assign({}, state, {
        isFetching: false,
        listings: action.listings,
        lastUpdated: action.receivedAt,
        // didInvalidate: false,
      })
    case BOOK_LISTING: {
      return state
      // TODO: Update the state
    }
    case ADD_PENDING_TX: {
      // Add the tx to pendingTx in state
      // and in localStorage
      const { storageKey } = action.data
      const storageVal = JSON.stringify(action.data)
      localStorage.setItem(storageKey, storageVal)
      return {
        ...state,
        pendingTx: Object.assign({}, state.pendingTx, { [storageKey]: storageVal }),
      }
    }
    case REMOVE_PENDING_TX: {
      // Remove the pendingTx from state
      // and from localStorage
      const copyPendingTx = Object.assign({}, state.pendingTx)
      // TODO: undo this
      // const { storageKey } = action.data
      // delete copyPendingTx[storageKey]
      return {
        ...state,
        pendingTx: copyPendingTx,
      }
    }
    default: {
      return state
    }
  }
}

export default rootReducer

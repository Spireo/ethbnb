import {
  ADD_TX,
  ADD_PENDING_TX,
  BOOK_LISTING,
  RECEIVE_ACCOUNT_INFO,
  RECEIVE_LISTINGS,
  REMOVE_PENDING_TX,
  REQUEST_LISTINGS,
  REQUEST_PUBLIC_ACCOUNT,
  ADD_MESSAGE,
  REMOVE_MESSAGE,
  SET_ACCOUNTS,
  SET_ETH_EVENTS,
  SET_PUBLIC_ACCOUNT,
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
  accounts: null,
  // Fetched from /api/account/:user
  // contains name, addr, bookings, dateCreated
  accountInfo: null,
  web3: null,
  contract: null,
  ethEvents: [],
  pendingTx: {},
  // Store information fetched from '/api/public' here
  // This should be keyed similar to the REST path
  // e.g. /api/public/accounts/{accountAddr} should be under
  // key 'account'
  public: {
    // Stores public account information
    accounts: {},
    // Stores accounts currently being fetched
    // so as to avoid multiple calls to fetch the same
    // resource
    accountsInTransit: {},
  },
  // Messages the user can see on the UI
  //
  // Dismissed messages show be deleted from the list
  messages: [],

  // Recent transactions issue by the client.
  // At the time of writing this dictionary is not serialised
  // and only stores those transactions sent since the last page refresh
  transactions: {
    // Key: txObj.transactionHash
    // Object: txObj = { transactionHash, ...}
  },
}

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_WEB3: {
      return {
        ...state,
        web3: action.web3js,
        contract: action.contract,
      }
    }
    case REQUEST_PUBLIC_ACCOUNT: {
      const addr = action.data
      return {
        ...state,
        public: {
          ...state.public,
          accountsInTransit: Object.assign({}, state.public.accountsInTransit, { [addr]: true }),
        },
      }
    }
    case SET_PUBLIC_ACCOUNT: {
      // action.data contains 'addr', 'name', 'dateCreated'
      // at the time of writing
      const { addr } = action.data
      // Remove the public account from accountsInTransit
      const { accountsInTransit } = state.public
      delete accountsInTransit[addr]
      return {
        ...state,
        public: {
          ...state.public,
          accounts: Object.assign({}, state.public.accounts, { [addr]: action.data }),
          accountsInTransit: Object.assign({}, accountsInTransit),
        },
      }
    }
    case ADD_MESSAGE: {
      return {
        ...state,
        messages: [...state.messages.slice(0), action.data],
      }
    }
    case REMOVE_MESSAGE: {
      // TODO: figure out how to remove the index
      return {
        ...state,
        messages: [],
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
    case ADD_TX: {
      const tx = action.data
      const { transactionHash } = tx
      return {
        ...state,
        transactions: Object.assign({}, state.transactions, { [transactionHash]: tx }),
      }
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

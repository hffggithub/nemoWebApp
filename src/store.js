import { configureStore } from '@reduxjs/toolkit'
import errorSReducer from './slices/errorSlice'
import customerReducer from './slices/customerSlice'
import cacheReducer from './slices/cacheSlice'
import distributionCenterReducer from './slices/distributionCenterSlice'
import navReducer from './slices/navSlice'
import subclassReduce from './slices/subclassSlice'
import orderReducer from './slices/orderSlice'

const store = configureStore({
  reducer: {
    error: errorSReducer,
    customer: customerReducer,
    cache: cacheReducer,
    distributionCenter: distributionCenterReducer,
    nav: navReducer,
    subclass: subclassReduce,
    order: orderReducer,
  }
});

export default store;
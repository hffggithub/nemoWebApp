import { createSlice } from '@reduxjs/toolkit'

export const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orderInContext: null,
  },
  reducers: {
    clearOrderInContext: state => {
      state.orderInContext =  null
    },
    setOrderInContext: (state, action) => {
      state.orderInContext = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { clearOrderInContext, setOrderInContext } = orderSlice.actions

export default orderSlice.reducer
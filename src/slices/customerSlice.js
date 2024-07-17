import { createSlice } from '@reduxjs/toolkit'

export const customerSlice = createSlice({
  name: 'customer',
  initialState: {
    value: null,
    changingCustomer: false,
  },
  reducers: {
    clearSelectedCustomer: state => {
      state.value =  null
      state.changingCustomer = false
    },
    startChangeSelectedCustomer: state => {
      state.value =  null
      state.changingCustomer = true
    },
    setSelectedCustomer: (state, action) => {
      state.value = action.payload
      state.changingCustomer = false
    }
  }
})

// Action creators are generated for each case reducer function
export const { startChangeSelectedCustomer, clearSelectedCustomer, setSelectedCustomer } = customerSlice.actions

export default customerSlice.reducer
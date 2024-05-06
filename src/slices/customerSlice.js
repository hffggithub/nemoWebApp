import { createSlice } from '@reduxjs/toolkit'

export const customerSlice = createSlice({
  name: 'customer',
  initialState: {
    value: null
  },
  reducers: {
    clearSelectedCustomer: state => {
      state.value =  null
    },
    setSelectedCustomer: (state, action) => {
      state.value = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { clearSelectedCustomer, setSelectedCustomer } = customerSlice.actions

export default customerSlice.reducer
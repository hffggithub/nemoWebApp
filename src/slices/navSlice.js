import { createSlice } from '@reduxjs/toolkit'

export const navSlice = createSlice({
  name: 'nav',
  initialState: {
    value: null
  },
  reducers: {
    returnHome: state => {
      state.value =  null
    },
    toScreen: (state, action) => {
      state.value = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { returnHome, toScreen } = navSlice.actions

export default navSlice.reducer
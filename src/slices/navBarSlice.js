import { createSlice } from '@reduxjs/toolkit'

export const navBarSlice = createSlice({
  name: 'navBar',
  initialState: {
    value: {
        selectedTab: 0
    }
  },
  reducers: {
    returnHome: state => {
      state.value = {
        selectedTab: 0
    }
    },
    selectTab: (state, action) => {
      state.value = {
        selectedTab: action.payload
    } 
    }
  }
})

// Action creators are generated for each case reducer function
export const { returnHome, selectTab } = navBarSlice.actions

export default navBarSlice.reducer
import { createSlice } from '@reduxjs/toolkit'

export const subclassSlice = createSlice({
  name: 'subclass',
  initialState: {
    value: null
  },
  reducers: {
    clearSubclass: state => {
      state.value =  null
    },
    setSubclass: (state, action) => {
      state.value = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { clearSubclass, setSubclass } = subclassSlice.actions

export default subclassSlice.reducer
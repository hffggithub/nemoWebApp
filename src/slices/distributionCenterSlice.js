import { createSlice } from '@reduxjs/toolkit'

export const distributionCenterSlice = createSlice({
  name: 'distributionCenter',
  initialState: {
    value: null
  },
  reducers: {
    clearDistributionCenter: state => {
      state.value =  null
    },
    setDistributionCenter: (state, action) => {
      state.value = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { clearDistributionCenter, setDistributionCenter } = distributionCenterSlice.actions

export default distributionCenterSlice.reducer
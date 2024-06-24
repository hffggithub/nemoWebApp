import { createSlice } from '@reduxjs/toolkit'

export const errorSlice = createSlice({
  name: 'error',
  initialState: {
    value: {
        errorTile: '',
        errorBody: '',
        errorButton: '',
        showError: false,
        extraInfo: null,
    }
  },
  reducers: {
    hideError: state => {
      state.value = {
        errorTile: '',
        errorBody: '',
        errorButton: '',
        showError: false,
        extraInfo: null,
    }
    },
    showError: (state, action) => {
      state.value = {
        ...action.payload,
        extraInfo: action.payload.extraInfo ?? null,
      }
    }
  }
})

// Action creators are generated for each case reducer function
export const { hideError, showError } = errorSlice.actions

export default errorSlice.reducer
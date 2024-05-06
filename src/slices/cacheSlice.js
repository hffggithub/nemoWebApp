import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit'
import axios from "axios"

export const cacheSlice = createSlice({
    name: 'cache',
    initialState: {
        products: null,
        customers: null,
        priceTiers: null,
        paymentTerms: null,
        fetched: [],
        fetching: [],
    },
    reducers: {
        clearCache: state => {
            console.log('cache should be cleared')
            state.fetched = []
            state.fetching = []
          },
        setProductsCache: (state, action) => {
            state.products = action.payload
            state.fetched = [...state.fetched, 'products']
        },
        setCustomersCache: (state, action) => {
            state.customers = action.payload
            state.fetched = [...state.fetched, 'customers']
        },
        setPriceTiersCache: (state, action) => {
            state.priceTiers = action.payload
            state.fetched = [...state.fetched, 'priceTiers']
        },
    },
    extraReducers: builder => {
        builder.addCase(fetchCustomers.pending, (state) => {
            state.fetching = [...state.fetching, 'customers']
        })
        builder.addCase(fetchProducts.pending, (state) => {
            state.fetching = [...state.fetching, 'products']
        })
        builder.addCase(fetchPriceTiers.pending, (state) => {
            state.fetching = [...state.fetching, 'priceTiers']
        })
        builder.addCase(fetchPaymentTerms.pending, (state) => {
            state.fetching = [...state.fetching, 'paymentTerms']
        })
        builder.addCase(fetchCustomers.fulfilled, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'customers'})
            state.customers = action.payload
            state.fetched = [...state.fetched, 'customers']
            // localStorage.setItem('customers', JSON.stringify(action.payload))
        })
        builder.addCase(fetchProducts.fulfilled, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'products'})
            state.products = action.payload
            state.fetched = [...state.fetched, 'products']
            // localStorage.setItem('products', JSON.stringify(action.payload))
        })
        builder.addCase(fetchPriceTiers.fulfilled, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'priceTiers'})
            state.priceTiers = action.payload
            state.fetched = [...state.fetched, 'priceTiers']
            // localStorage.setItem('priceTiers', JSON.stringify(action.payload))
        })
        builder.addCase(fetchPaymentTerms.fulfilled, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'paymentTerms'})
            state.paymentTerms = action.payload
            state.fetched = [...state.fetched, 'paymentTerms']
            // localStorage.setItem('priceTiers', JSON.stringify(action.payload))
        })
        builder.addCase(fetchCustomers.rejected, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'customers'})
        })
        builder.addCase(fetchProducts.rejected, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'products'})
        })
        builder.addCase(fetchPriceTiers.rejected, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'priceTiers'})
        })
        builder.addCase(fetchPaymentTerms.rejected, (state, action) => {
            state.fetching = state.fetching.filter((item) => {return item !== 'paymentTerms'})
        })
    }
})

// Action creators are generated for each case reducer function
export const { setProductsCache, setCustomersCache, setPriceTiersCache, clearCache } = cacheSlice.actions

export default cacheSlice.reducer

async function fetchDataFromAPI(endpoint, token) {
    const response = await axios.get(
        import.meta.env.VITE_API_BASE_URL + endpoint,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );

    return response.data
}

async function fetchData(datakey, token, shouldCheckLocalStorage, params) {
    let endpoint = ""
    switch (datakey) {
        case 'products':
            const { locationGroupId } = params
            endpoint = "product/all?locationGroupId=" + locationGroupId;
            break;
        case 'customers':
            endpoint = "customer/all";
            break;
        case 'priceTiers':
            endpoint = "product/priceTiers";
            break;
        case 'paymentTerms':
            endpoint = "orders/paymentTerms";
            break;
    }

    const valueInLocalStorage = localStorage.getItem(datakey)

    if (shouldCheckLocalStorage && valueInLocalStorage) {
        return JSON.parse(valueInLocalStorage);
    }

    return await fetchDataFromAPI(endpoint, token)
}

export const fetchCustomers = createAsyncThunk('cache/fetchCustomers', async (options) => {
    const { token, shouldCheckLocalStorage = true } = options;
    const data = await fetchData('customers', token, shouldCheckLocalStorage)
    return data
})


export const fetchProducts = createAsyncThunk('cache/fetchProducts', async (options) => {
    const { token, shouldCheckLocalStorage = true, params } = options;
    const data = await fetchData('products', token, shouldCheckLocalStorage, params)
    return data
})


export const fetchPriceTiers = createAsyncThunk('cache/fetchPriceTiers', async (options) => {
    const { token, shouldCheckLocalStorage = true } = options;
    const data = await fetchData('priceTiers', token, shouldCheckLocalStorage)
    return data
})

export const fetchPaymentTerms = createAsyncThunk('cache/fetchPaymentTerms', async (options) => {
    const { token, shouldCheckLocalStorage = true } = options;
    const data = await fetchData('paymentTerms', token, shouldCheckLocalStorage)
    return data
})

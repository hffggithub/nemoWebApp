import { useState, useEffect, useRef } from 'react'
import { useLocalStorage } from "@uidotdev/usehooks";
import Navbar from './Components/Navbar/Navbar.jsx'
import './App.css'
import ErrorModal from './Components/Modals/ErrorModal.jsx';
import Welcome from './pages/Welcome.Page.jsx';
import Customer from './pages/Customer.Page.jsx';
import { useSelector, useDispatch } from 'react-redux'
import Order from './pages/Order.Page.jsx';
import OrderLookup from './pages/OrderLookup.page.jsx';
import { fetchCustomers, fetchProducts, fetchPriceTiers, fetchPaymentTerms } from './slices/cacheSlice.js';
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';


function App() {
  const [productsOnOrder, setProductsOnOrder] = useState([])
  const [navOption, setNavOption] = useState("");
  const [distributionCenter, setDistributionCenter] = useState(null);
  const [subclass, setSubclass] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorBody, setErrorBody] = useState('');
  const [token] = useLocalStorage("token", null);
  const fetchedState = useSelector(state => state.cache.fetched)
  const fetchingState = useSelector(state => state.cache.fetching)
  const errorState = useSelector(state => state.error.value)
  const customerState = useSelector(state => state.customer.value)
  const navState = useSelector(state => state.nav.value)
  const dc = useSelector(state => state.distributionCenter.value)
  const dispatch = useDispatch();
  const triesCustomerCache = useRef(0);
  const triesProductsCache = useRef(0);
  const triesPriceTiersCache = useRef(0);
  const triesPaymentTermsCache = useRef(0);

  useEffect(() => {
    if (token !== null) {
      if (!fetchedState.includes('customers') && !fetchingState.includes('customers') && triesCustomerCache.current < 3) {
        triesCustomerCache.current += 1;
        dispatch(fetchCustomers({ token: token, shouldCheckLocalStorage: false }))
      }
      if (!fetchedState.includes('products') && !fetchingState.includes('products') && distributionCenter !== null && triesProductsCache.current < 3) {
        triesProductsCache.current += 1;
        dispatch(fetchProducts({ token: token, shouldCheckLocalStorage: false, params: { locationGroupId: dc.id} }))
      }
      if (!fetchedState.includes('priceTiers') && !fetchingState.includes('priceTiers') && triesPriceTiersCache.current < 3) {
        triesPriceTiersCache.current += 1;
        dispatch(fetchPriceTiers({ token: token, shouldCheckLocalStorage: false }))
      }
      if (!fetchedState.includes('paymentTerms') && !fetchingState.includes('paymentTerms') && triesPaymentTermsCache.current < 3) {
        triesPaymentTermsCache.current += 1;
        dispatch(fetchPaymentTerms({ token: token, shouldCheckLocalStorage: false }))
      }
    }

  }, [token, fetchedState, distributionCenter, dc, dispatch, fetchingState])

  useEffect(() => {
    if(token === null) {
      triesCustomerCache.current = 0;
      triesProductsCache.current = 0;
      triesPriceTiersCache.current = 0;
      triesPaymentTermsCache.current = 0;
    }
  }, [token]);

  useEffect(() => {
    let title = "HF Foods"
    if (subclass !== null && distributionCenter !== null) {
      title = distributionCenter.name + ":" + subclass + " - " + title
    }
    document.title = title
  }, [distributionCenter, subclass]);

  return (
    <>
      <PrimeReactProvider>
        <div className='min-h-screen h-screen w-screen'>
          {errorState.showError && <ErrorModal title={errorState.errorTile} body={errorState.errorBody} dismissButtonTitle={'ok'} dismissAction={errorState.errorButton} setProductsOnOrder={setProductsOnOrder} setDistributionCenter={setDistributionCenter} setSubclass={setSubclass}/>}
          <div className=' h-20'>
            <Navbar setNavOption={setNavOption} navOption={navOption} subclass={subclass} distributionCenter={distributionCenter} setDistributionCenter={setDistributionCenter} setSubclass={setSubclass} setProductsOnOrder={setProductsOnOrder} />
          </div>
          <main className="flex justify-center items-center px-10 py-1">
            {(distributionCenter === null || subclass === null || token === null) &&
              <Welcome setErrorTitle={setErrorTitle} setErrorBody={setErrorBody} setErrorModalVisible={setErrorModalVisible} setDistributionCenter={setDistributionCenter} setSubclass={setSubclass} />
            }
            {(distributionCenter !== null && subclass !== null && token !== null && customerState == null && navState !== 'orderLookup') &&
              <Customer />
            }
            {(distributionCenter !== null && subclass !== null && token !== null && customerState != null && (navState === null || navState === 'newOrder')) &&
              <Order productsOnOrder={productsOnOrder} setProductsOnOrder={setProductsOnOrder} />
            }
            {(distributionCenter !== null && subclass !== null && token !== null && navState == 'orderLookup') &&
              <OrderLookup setProductsOnOrder={setProductsOnOrder} />
            }
          </main>
        </div>
      </PrimeReactProvider>
    </>
  )
}

export default App

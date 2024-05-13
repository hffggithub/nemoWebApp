import { useSelector, useDispatch } from 'react-redux';
import axios from "../providers/axiosProvider.js";
import { clearSelectedCustomer } from '../slices/customerSlice';
import ProductSearch from '../Components/Product/ProductSearch';
import CustomerInfo from '../Components/Customer/CustomerInfo';
import OrderSummary from '../Components/Orders/OrderSummary';
import { AgGridReact } from 'ag-grid-react';
import { showError } from '../slices/errorSlice';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { useLocalStorage } from "@uidotdev/usehooks";
import { fetchCustomers, fetchProducts, fetchPriceTiers } from '../slices/cacheSlice.js';
import ProductHistory from '../Components/Product/ProductHistory.jsx';

function Order({ productsOnOrder, setProductsOnOrder }) {
    const [filteredProductList, setFilteredProductList] = useState([])
    // const [productList, setProductList] = useState([])
    const customerState = useSelector(state => state.customer.value)
    const productList = useSelector(state => state.cache.products)
    const dc = useSelector(state => state.distributionCenter.value)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [productToAdd, setProductToAdd] = useState(null)
    const { t, i18n } = useTranslation()
    const [token, setToken] = useLocalStorage("token", null)
    const [shouldFetch, setShouldFetch] = useState(true)
    const dispatch = useDispatch();
    const [shouldSendOrder, setShouldSendOrder] = useState(false)
    const [orderAction, setOrderAction] = useState("")
    const [customerShippingAddress, setCustomerShippingAddress] = useState(null)
    const [orderInfo, setOrderInfo] = useState(false)
    const [productGridReady, setProductGridReady] = useState(false)
    const paymentTerms = useSelector(state => state.cache.paymentTerms)
    const [selectedPaymentTerm, setSelectedPaymentTerm] = useState(0)
    const subclassState = useSelector(state => state.subclass.value)
    const [selectedProductTab, setSelectedProductTab] = useState(0)

    const [orderNote, setOrderNote] = useState("");

    const productGridRef = useRef();

    const minDate = () => {
        // This will calculate the next working day
        const dateCopy = new Date();
        let day = dateCopy.getDay();
        let add = 1;
        if (day === 6) {
            add = 2;
        } else if (day === 5) {
            add = 3;
        }
        dateCopy.setDate(dateCopy.getDate() + add);
        return dateCopy;
    };

    const [scheduledDate, setScheduledDate] = useState(minDate)

    const [focusedElement, setFocusedElement] = useState("productNum")

    useEffect(() => {
        setFilteredProductList(productList.filter(x => {
            return x.locationgroupid === dc.id
        }))
    }, [productList])

    const columnDefs = [
        { headerName: t('ID'), field: "num", width: 80 },
        { headerName: t('Name'), field: "description", width: 190 },
        { headerName: t('Chinese Name'), field: "chineseName", width: 190 },
        // { headerName: t('Chinese Name'), field: "customFieldsMap.10.value", width: 190 },
        { headerName: t('Total'), field: "inventory", width: 85 },
        { headerName: t('Available'), valueGetter: (p) => (p.data.inventory - (p.data.qtynotavailable + p.data.qtyallocated)), width: 90 },
        { headerName: t('Price'), field: "price", valueFormatter: params => params.value.toFixed(2), width: 85 },
        { headerName: t('UOM'), field: "unitOfMeasure", width: 85 },
        ...(orderInfo ? [{ headerName: t('Cost'), field: "cost", valueFormatter: params => params.value.toFixed(2), width: 85 }] : [])
    ]


    const onGridReady = useCallback((event) => {
        console.log('the grid is ready ngsh')
        setProductGridReady(true)
    }, [setProductGridReady]);


    // useEffect(() => {
    //     async function fetchProducts() {
    //         try {
    //             const { data } = await axios.get(
    //                 import.meta.env.VITE_API_BASE_URL + "product/all",
    //                 {
    //                     headers: { 'Authorization': `Bearer ${token}` }
    //                 }
    //             );
    //             if (data) {
    //                 setProductList(data)
    //                 setFilteredProductList(data)
    //                 setShouldFetch(false)
    //             }
    //         } catch (ex) {

    //             dispatch(
    //                 showError(
    //                     {
    //                         errorTile: t("Connection Error"),
    //                         errorBody: t("Reload the page, if issue persist please contact your administrator. Error code: P001."),
    //                         errorButton: t('ok'),
    //                         showError: true,
    //                     }
    //                 )
    //             )
    //         }
    //     }


    //     if (shouldFetch && token) {
    //         fetchProducts()
    //     }


    // }, [token, setToken, shouldFetch, setShouldFetch, setFilteredProductList, setProductList])

    useEffect(() => {

        async function sendOrder() {
            let customerToSend = {
                ...customerState
            }
            let stringShipDate = formatDate(scheduledDate, "mm/dd/yyyy")
            let stringCreatedDate = formatDate(new Date(), "mm/dd/yyyy")
            if (customerShippingAddress !== null) {
                customerToSend.shippingAddress = customerShippingAddress
            }
            try {
                const response = await axios.post(
                    import.meta.env.VITE_API_BASE_URL + "orders",
                    {
                        "customer": customerToSend,
                        "lineItems": productsOnOrder,
                        "action": orderAction,
                        "shippingTerms": "10",
                        "createdDate": null,
                        "scheduledDate": stringShipDate,
                        "fishbowlDC": dc,
                        "fishbowlSubclass": subclassState,
                        "notes": orderNote,
                        "paymentTerms": paymentTerms[selectedPaymentTerm].name,
                    },
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                )
                if (response.status === 201) {
                    dispatch(
                        showError(
                            {
                                errorTile: t('Success'),
                                errorBody: t(`The order was ${orderAction === 'save' ? 'saved' : 'sent'} successfully`),
                                errorButton: 'returnHome',
                                showError: true,
                            }
                        )
                    )
                } else {
                    dispatch(
                        showError(
                            {
                                errorTile: t('Invalid request'),
                                errorBody: t(`It was not possible to ${orderAction} the order`),
                                errorButton: t('ok'),
                                showError: true,
                            }
                        )
                    )
                }
            } catch (ex) {
                console.log(ex)

                dispatch(
                    showError(
                        {
                            errorTile: t('Error'),
                            errorBody: t('Connection error please contact your administrator.'),
                            errorButton: t('ok'),
                            showError: true,
                        }
                    )
                )
            }
            setShouldSendOrder(false)
            dispatch(fetchProducts({ token: token, shouldCheckLocalStorage: false, params: { locationGroupId: dc.id } }))
        }

        if (shouldSendOrder) {
            sendOrder()
        }
    }, [productsOnOrder, setProductsOnOrder, selectedPaymentTerm, orderNote, dc, customerState, subclassState, shouldSendOrder, scheduledDate, setShouldSendOrder, orderAction])

    function submitOrder(action) {
        setShouldSendOrder(true)
        setOrderAction(action)
    }

    function onProductSelected(event) {
        console.log(event)
        if (!event.node.isSelected()) {
            return;
        }
        console.log(event.data)
        setSelectedProduct(event.data)
        setFocusedElement('qty')
        productGridRef.current?.api.deselectAll('apiSelectAll')
    }

    function addProduct(product) {
        setProductsOnOrder([...productsOnOrder, {
            index: productsOnOrder.length,
            ...product
        }])
    }

    const gridOptions = {
        autoSizeStrategy: {
            type: 'fitGridWidth',
            defaultMinWidth: 100,
            columnLimits: [
                {
                    colId: 'country',
                    minWidth: 900
                }
            ]
        }
    }
    function formatDate(date, format) {
        const map = {
            mm: ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1),
            dd: ((date.getDate()) < 10 ? "0" : "") + (date.getDate()),
            yyyy: date.getFullYear()
        }

        return format.replace(/mm|dd|yyyy/gi, matched => map[matched])
    }

    const handleUserKeyPress = useCallback((event) => {
        const { key, keyCode } = event;
        if ((keyCode === 40 || keyCode === 38) && focusedElement === "productNum") {
            console.log(productGridRef)
            const firstCol = productGridRef.current?.columnApi.getAllDisplayedColumns()[0];
            productGridRef.current?.api.setFocusedCell(0, firstCol)
            setFocusedElement('grid')
        }
    }, [focusedElement]);

    useEffect(() => {
        window.addEventListener("keydown", handleUserKeyPress);
        return () => {
            window.removeEventListener("keydown", handleUserKeyPress);
        };
    }, [handleUserKeyPress, focusedElement]);

    function transformDateFromDatePicker(stringDate) {
        let date = new Date(Date.parse(stringDate))
        var userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset);
    }

    return (
        <>
            <div className="w-full h-full">
                <div className='flex space-x-1'>
                    <div className="flex-initial w-1/2 h-1/4">
                        <ProductSearch focusedElement={focusedElement} setFocusedElement={setFocusedElement} selectedProduct={selectedProduct} setProductToAdd={addProduct} setFilteredProductList={setFilteredProductList} productList={productList} />
                        <div className='tab flex flex-row rounded-t-lg'>
                            <button id='productTab' className={selectedProductTab === 0 ? 'tablinks active' : 'tablinks'} onClick={() => { setSelectedProductTab(0) }}>{t('Product')}</button>
                            <button id='productHistoryTab' disabled={selectedProduct === null} className={selectedProductTab === 1 ? 'tablinks active' : 'tablinks'} onClick={() => { setSelectedProductTab(1) }}>{t('Product History')}</button>
                        </div>
                    </div>
                    <div className="flex-initial w-1/2 h-1/4">
                        <div className='flex flex-col'>
                            <div>
                                <CustomerInfo customer={customerState} setCustomerShippingAddress={setCustomerShippingAddress} showCustomerAddress={true} />
                            </div>
                            <div className='flex flex-row justify-items-start mx-2'>
                                <div className='flex flex-auto'>
                                    <span className='self-center'>{t('Payment Term')}:</span>
                                    <select value={selectedPaymentTerm} onChange={(e) => { setSelectedPaymentTerm(e.target.value) }} className='flex-auto border rounded-lg py-1 mx-1' id='paytermSelect'>
                                        {paymentTerms.map((it, i) => {
                                            return (<option key={i} value={i}>{it.name}</option>)
                                        })
                                        }
                                    </select>
                                </div>
                                <div className='flex flex-auto'>
                                    <span className='self-center'>{t('Scheduled Shipment')}:</span>
                                    <input id='scheduledShipment' onChange={(e) => { setScheduledDate(transformDateFromDatePicker(e.target.value)) }} className='flex-auto w-32 border rounded-lg py-1 mx-1' value={formatDate(scheduledDate, 'yyyy-mm-dd')} min={formatDate(new Date(), 'yyyy-mm-dd')} type='date'></input>
                                </div>
                                <div className='flex flex-auto'>
                                    <input id='orderNote' value={orderNote} onChange={(e) => { setOrderNote(e.target.value) }} placeholder={t('Order Note')} className='flex-auto w-full border rounded-lg py-1 px-2 mx-1' type='text'></input>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex h-5/6 w-full space-x-1'>
                    <div className='w-1/2 h-full tabcontent rounded-b-lg'>
                        {selectedProductTab === 0 && <div className='ag-theme-quartz w-full h-full'>
                            <AgGridReact
                                onGridReady={onGridReady}
                                ref={productGridRef}
                                onRowSelected={onProductSelected}
                                gridOptions={gridOptions}
                                rowSelection="single"
                                columnDefs={columnDefs}
                                rowData={filteredProductList}>
                            </AgGridReact>
                        </div> }
                        {(selectedProductTab === 1 && selectedProduct !== null) && <ProductHistory selectedProduct={selectedProduct} />}
                    </div>
                    <div className='flex flex-col flex-initial w-1/2 h-full'>
                        <div className='flex-initial w-full h-full' >
                            <OrderSummary productList={productsOnOrder} setProductList={setProductsOnOrder} showRemoveButton={true} orderInfo={orderInfo} />
                        </div>
                        <div className='flex flex-initial w-full h-15 space-x-2'>
                            <input type="checkbox" id="orderInfo" name="orderInfo" checked={orderInfo} onChange={() => { setOrderInfo(!orderInfo) }}></input>
                            <label htmlFor="orderInfo">{t('Order information')}</label>
                        </div>
                        <div className='flex flex-initial w-full h-15 justify-evenly px-10'>
                            <button disabled={shouldSendOrder} onClick={() => { setProductsOnOrder([]); dispatch(clearSelectedCustomer()); }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2'>{t('Cancel')}</button>
                            <button disabled={shouldSendOrder} onClick={() => { submitOrder('save') }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2'>{t('Save')}</button>
                            <button disabled={shouldSendOrder} onClick={() => { submitOrder('send') }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2'>{t('Send')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Order;
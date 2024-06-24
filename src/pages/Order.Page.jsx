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
import { clearOrderInContext } from '../slices/orderSlice.js';
import { consolidateLineItemsData } from '../utils/orderUtils.js';
import { getDateWithoutTimezone } from '../utils/timeUtils.js';
import { selectTab } from '../slices/navBarSlice.js';

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
    const orderInContextState = useSelector(state => state.order.orderInContext)
    const [predefinedQty, setPRedifinedQty] = useState(null);
    const [inventoryExceededPopupShown, setInventoryExceededPopupShown] = useState(false)
    const [orderErrorAcnkowledged, setOrderErrorAcnkowledged] = useState(false)
    const errorState = useSelector(state => state.error.value.showError)
    const [savedUsername, saveUsername] = useLocalStorage("username", null);

    dispatch(selectTab(1))

    useEffect(() => {
        if(!errorState && inventoryExceededPopupShown) {
            setInventoryExceededPopupShown(false)
            setOrderErrorAcnkowledged(true)
        }
    }, [errorState])

    useEffect(() => {
        if(productsOnOrder.length == 0) {
            return;
        }
        function handleOnBeforeUnload(event) {
            event.preventDefault();
            return (event.returnValue = '');
        }
        window.addEventListener('beforeunload', handleOnBeforeUnload, { capture: true } )
        return () => {
            window.removeEventListener('beforeunload', handleOnBeforeUnload, { capture: true } )
        }
    }, [productsOnOrder])


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

    useEffect(() => {
        if(orderInContextState !== null) {
            const lineItems = consolidateLineItemsData(orderInContextState.lineItems, productList)
            setProductsOnOrder(lineItems)
            if(paymentTerms) {
                if(paymentTerms.length > 0) {
                    for(let i = 0; i<paymentTerms.length; i++) {
                        if(paymentTerms[i].id === orderInContextState.paymentTermsId) {
                            setSelectedPaymentTerm(i);
                            break;
                        }
                    }
                }
            }
            let scheduledDateFromContext = orderInContextState.scheduledDate?.split('T')[0] ?? "";
            let dateAux = new Date(scheduledDateFromContext)
            dateAux = getDateWithoutTimezone(dateAux)
            setScheduledDate(dateAux)
            setOrderNote(orderInContextState.orderNotes)
        }
    }, [orderInContextState])

    const columnDefs = [
        { headerName: t('ID'), field: "num", width: 120 },
        { headerName: t('Name'), field: "description", flex: 2 },
        { headerName: t('Chinese Name'), field: "chineseName", flex: 2},
        { headerName: t('Total'), field: "inventory", width: 85, type: 'rightAligned', valueFormatter: params => params.value.toFixed(0) },
        { headerName: t('Available'), valueGetter: (p) => (p.data.inventory - (p.data.qtynotavailable + p.data.qtyallocated)), width: 90, type: 'rightAligned', valueFormatter: params => params.value.toFixed(0) },
        { headerName: t('Price'), field: "price", valueFormatter: params => params.value.toFixed(2), width: 85, type: 'rightAligned'  },
        { headerName: t('UOM'), field: "unitOfMeasure", width: 85 },
        ...(orderInfo ? [{ headerName: t('Cost'), field: "cost", valueFormatter: params => params.value.toFixed(2), width: 85, type: 'rightAligned' }] : [])
    ]


    const onGridReady = useCallback((event) => {
        console.log('the grid is ready ngsh')
        setProductGridReady(true)
    }, [setProductGridReady]);


    // useEffect(() => {
    //     async function fetchProducts() {
    //         try {
    //             const { data } = await axios.get(
    //                 NEMO_API_HOST + "product/all",
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

    // useEffect(()=> {
    //     return () => {
    //         window.alert("sometext");
    //     }
    // }, [])



    useEffect(() => {

        async function sendOrder() {
            let customerToSend = {
                ...customerState
            }
            let stringShipDate = formatDate(scheduledDate, "mm/dd/yyyy")
            // let createdDate = orderInContextState !== null ? new Date(orderInContextState.createdDate.split("T")[0]) : new Date();
            let stringCreatedDate = orderInContextState !== null ?  formatDate(getDateWithoutTimezone(new Date(orderInContextState.createdDate.split("T")[0])), "mm/dd/yyyy") : null
            if (customerShippingAddress !== null) {
                customerToSend.shippingAddress = customerShippingAddress
            }
            try {
                const groupedNums = productsOnOrder.reduce((acc, current) => {
                    const num = current.productNumber;
                    const prevObject = acc[num];
                    if(prevObject) {
                        acc[num] = {
                            ...prevObject,
                            quantity: prevObject.quantity + current.quantity,
                        };
                    } else {
                        acc[num] = current;
                    }
                    return acc;
                },{})
                const arrayOfProductNums = productsOnOrder.map((li) => {
                    return "\"" + li.productNumber + "\""
                });
                if(arrayOfProductNums.length > 0 && !orderErrorAcnkowledged) {
                    const resultInventory = await axios.get(
                        NEMO_API_HOST + `product/getProductsInventory?locationGroupId=${dc.id}&products=${arrayOfProductNums.join(',')}`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )
                    const invalidItmes =  resultInventory.data.filter((it) => (it.inventory - (it.qtynotavailable + it.qtyallocated)) < groupedNums[it.num].quantity).map((it) => {
                        return {...it,
                            requested: groupedNums[it.num].quantity
                        }
                    })
                    if (invalidItmes && invalidItmes.length > 0) {
                        dispatch(
                            showError(
                                {
                                    errorTile: t('Invalid request'),
                                    errorBody: t(`Not enough invenotry to fulfill order, please vefiry the following items in the order. If this is intended please send the order again.`),
                                    errorButton: t('ok'),
                                    extraInfo: invalidItmes,
                                    showError: true,
                                }
                            )
                        )
                        setInventoryExceededPopupShown(true)
                        setShouldSendOrder(false)
                        dispatch(fetchProducts({ token: token, shouldCheckLocalStorage: false, params: { locationGroupId: dc.id, locationGroupName: dc.name } }))

                        return
                    }
                }
                const response = await axios.post(
                    NEMO_API_HOST + "orders",
                    {
                        "Id": orderInContextState?.id ?? null,
                        "Number" :  orderInContextState?.num ?? null,
                        "customer": customerToSend,
                        "lineItems": productsOnOrder,
                        "action": orderAction,
                        "shippingTerms": "10",
                        "createdDate": stringCreatedDate,
                        "scheduledDate": stringShipDate,
                        "fishbowlDC": dc,
                        "fishbowlSubclass": subclassState,
                        "notes": orderNote,
                        "paymentTerms": paymentTerms[selectedPaymentTerm].name,
                        "username": savedUsername,
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
                                errorBody: t(`The order has been ${orderAction === 'save' ? 'saved' : 'submitted and issued'} successfully`),
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
            setOrderErrorAcnkowledged(false)
            setShouldSendOrder(false)
            dispatch(fetchProducts({ token: token, shouldCheckLocalStorage: false, params: { locationGroupId: dc.id, locationGroupName: dc.name } }))
        }

        if (shouldSendOrder) {
            sendOrder()
        }
    }, [productsOnOrder, setProductsOnOrder, selectedPaymentTerm, orderNote, dc, customerState, subclassState, shouldSendOrder, scheduledDate, setShouldSendOrder, orderAction])

    function submitOrder(action) {
        setShouldSendOrder(true)
        setOrderAction(action)
    }

    function addProduct(product) {
        setProductsOnOrder([...productsOnOrder, {
            index: productsOnOrder.length,
            ...product
        }])
        setSelectedProduct(null)
        setPRedifinedQty(null)
        if(selectedProductTab !== 2) {
            setSelectedProductTab(0)
        }
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
        if ((keyCode == 38 || keyCode == 40) && focusedElement === "productNum") {
            moveProductRow(keyCode == 40 ? 1 : -1);
        }
    }, [focusedElement]);

    function resetProductRow() {
        setProductRow(0);
    }

    function moveProductRow(increment) {
        let selectedRows = productGridRef.current?.api.getSelectedNodes();
        let indexToSelect = 0;
        if (selectedRows.length) {
            indexToSelect = selectedRows[0].rowIndex + increment;
        }

        setProductRow(indexToSelect);
    }

    function setProductRow(index) {
        productGridRef.current?.api?.forEachNode((rowNode) => {
            if (rowNode.rowIndex == index) {
              rowNode.setSelected(true, true);
            }
        });
        productGridRef.current?.api?.ensureIndexVisible(index);
    }

    function selectCurrentProduct() {
        var selectedRows = productGridRef.current?.api.getSelectedRows();
        if (selectedRows.length) {
            setSelectedProduct(selectedRows[0])
            setSelectedProductTab(1)
            setFocusedElement('qty')
            setPRedifinedQty(1)
        }
    }

    useEffect(() => {
        if(focusedElement === "productNum") {
            console.log('prod element focused')
            if(selectedProductTab !== 2) {
                setSelectedProductTab(0)
            }
            setFilteredProductList(productList)
        }
    }, [focusedElement])

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

    function cancelOrderEdit() {
        if(productsOnOrder.length > 0) {
            dispatch(
                showError(
                    {
                        errorTile: t('Changes not saved'),
                        errorBody: t(`The order has changes that are not saved, Do you want to discard the changes?`),
                        errorButton: t('unsavedOrder'),
                        showError: true,
                    }
                )
            )
        } else {
            setProductsOnOrder([]);
            dispatch(clearSelectedCustomer());
            dispatch(clearOrderInContext());
        }
    }

    function selectProductFromUpsell(product) {
        const productInCache = productList.find((prod) => prod.num === product.productNumber)
        if(productInCache) {
            setSelectedProduct(productInCache)
            setPRedifinedQty(product.quantity)
            setFocusedElement('qty')
        }
    }

    return (
        <>
            <div className="w-full h-full flex flex-col">
                <div className='flex space-x-1 items-end text-sm'>
                    <div className="flex flex-initial h-full flex-col w-1/2">
                        <h1 className="flex-auto self-center text-center font-bold text-lg">{(orderInContextState && orderInContextState.num) ? t('Order') + ": " + orderInContextState.num : ''}</h1>
                        <ProductSearch predefinedQty={predefinedQty} focusedElement={focusedElement} setFocusedElement={setFocusedElement} selectedProduct={selectedProduct} setProductToAdd={addProduct} setFilteredProductList={setFilteredProductList} productList={productList} selectCurrentProduct={selectCurrentProduct} />
                    </div>
                    <div className="flex-initial w-1/2">
                        <div className='flex flex-col'>
                            <div>
                                <CustomerInfo selectedShippingAddress={orderInContextState?.shippingAddress ?? customerState.shippingAddress} customer={customerState} setCustomerShippingAddress={setCustomerShippingAddress} showCustomerAddress={true} />
                            </div>
                            <div className='grid grid-cols-2 mx-2 mt-2 gap-y-2 gap-x-1'>
                                <div className='flex'>
                                    <span className='text-right mr-3 w-1/3 self-center'>{t('Payment Term')}:</span>
                                    <select value={selectedPaymentTerm} onChange={(e) => { setSelectedPaymentTerm(e.target.value) }} className='flex-auto border rounded-lg py-1 px-3 mx-1' id='paytermSelect'>
                                        {paymentTerms.map((it, i) => {
                                            return (<option key={i} value={i}>{it.name}</option>)
                                        })
                                        }
                                    </select>
                                </div>
                                <div className='flex'>
                                    <span className='text-right mr-3 w-1/3 self-center'>{t('Scheduled Shipment')}:</span>
                                    <input id='scheduledShipment' onChange={(e) => { setScheduledDate(transformDateFromDatePicker(e.target.value)) }} className='flex-auto w-32 border rounded-lg py-1 mx-1' value={formatDate(scheduledDate, 'yyyy-mm-dd')} min={formatDate(new Date(), 'yyyy-mm-dd')} type='date'></input>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex w-full space-x-1'>
                    <div className="flex-initial w-1/2">
                        <div className='tab flex flex-row rounded-t-lg text-sm'>
                            <button id='productTab' className={selectedProductTab === 0 ? 'tablinks active' : 'tablinks'} onClick={() => { setSelectedProductTab(0) }}>{t('Product')}</button>
                            <button id='productHistoryTab' disabled={selectedProduct === null} className={selectedProductTab === 1 ? 'tablinks active' : 'tablinks'} onClick={() => { setSelectedProductTab(1) }}>{t('Product History')}</button>
                            <button id='orderHistoryTab' className={selectedProductTab === 2 ? 'tablinks active' : 'tablinks'} onClick={() => { setSelectedProductTab(2) }}>{t('Order History')}</button>
                        </div>
                    </div>
                    <div className="flex-initial w-1/2 text-sm items-end flex justify-center">
                        <h1 className='self-center'>{t('Order Summary')}</h1>
                    </div>
                </div>
                <div className='flex h-5/6 w-full space-x-1'>
                    <div className='w-1/2 h-full tabcontent rounded-b-lg'>
                        {selectedProductTab === 0 && <div className='ag-theme-quartz w-full h-full'>
                            <AgGridReact
                                suppressDragLeaveHidesColumns={true}
                                onGridReady={onGridReady}
                                ref={productGridRef}
                                onRowClicked={selectCurrentProduct}
                                gridOptions={gridOptions}
                                rowSelection="single"
                                columnDefs={columnDefs}
                                rowData={filteredProductList}
                                onRowDataUpdated={resetProductRow}>
                            </AgGridReact>
                        </div> }
                        {(selectedProductTab === 1 && selectedProduct !== null) && <ProductHistory selectedProduct={selectedProduct} />}
                        {(selectedProductTab === 2) && <ProductHistory selectedProduct={undefined} setSelectedProduct={selectProductFromUpsell} />}
                    </div>
                    <div className='flex flex-col flex-initial w-1/2 h-full'>
                        <div className='flex-initial w-full h-full' >
                            <OrderSummary orderNote={orderNote} setOrderNote={setOrderNote} productList={productsOnOrder} setProductList={setProductsOnOrder} showRemoveButton={true} orderInfo={orderInfo} />
                        </div>
                        <div className='flex flex-initial w-full h-15 space-x-2 justify-end'>
                            <input type="checkbox" id="orderInfo" name="orderInfo" checked={orderInfo} onChange={() => { setOrderInfo(!orderInfo) }}></input>
                            <label htmlFor="orderInfo">{t('Order information')}</label>
                        </div>
                        <div className='flex flex-initial w-full h-15 justify-evenly px-10'>
                            <button disabled={shouldSendOrder} onClick={() => { cancelOrderEdit() }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2'>{t('Cancel')}</button>
                            <button disabled={shouldSendOrder || (orderInContextState?.statusId ?? 10) !== 10 || productsOnOrder.length <= 0} onClick={() => { submitOrder('save') }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2'>{t('Save')}</button>
                            <button disabled={shouldSendOrder  || productsOnOrder.length <= 0} onClick={() => { submitOrder('send') }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2'>{t('Send')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Order;
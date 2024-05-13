import { useSelector, useDispatch } from 'react-redux';
import axios from "../providers/axiosProvider";
import { clearSelectedCustomer, setSelectedCustomer } from '../slices/customerSlice';
import { AgGridReact } from 'ag-grid-react';
import { showError } from '../slices/errorSlice';
import { useEffect, useState } from 'react';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { useLocalStorage } from "@uidotdev/usehooks";
import { returnHome } from '../slices/navSlice';
import CustomerInfo from '../Components/Customer/CustomerInfo';
import OrderSummary from '../Components/Orders/OrderSummary';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone } from "@fortawesome/free-solid-svg-icons";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";


function OrderLookup({ setProductsOnOrder }) {
    const [shouldFetchOrders, setShouldFetchOrders] = useState(true)
    const [orderList, setOrderList] = useState([])
    const [filteredList, setFilteredList] = useState([])
    const [token, setToken] = useLocalStorage("token", null)
    const { t } = useTranslation();
    const customerState = useSelector(state => state.customer.value)
    const customerList = useSelector(state => state.cache.customers)
    const [customerShippingAddress, setCustomerShippingAddress] = useState(null)
    const [auxList, setAuxList] = useState([])
    const productsCache = useSelector(state => state.cache.products)
    const [endDate, setEndDate] = useState(getDateWithoutTimezone(new Date()))
    const initialStartDate = () => {
        var today = getDateWithoutTimezone(new Date());
        var priorDate = new Date(new Date().setDate(today.getDate() - 90));
        return priorDate
    }
    const [startDate, setStartDate] = useState(initialStartDate)

    
    function getDateWithoutTimezone(date) {
        var userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset);
    }


    const dispatch = useDispatch()

    const ActionButtons = props => {
        return (<>
            <span class="actionIcons">
                <button onClick={() => { mergeForClone(props.value.lineItems, props.value.customerNumber); dispatch(returnHome()) }} disabled={props.value.statusId !== 10 && props.value.statusId !== 20} title={t('Modify')}><FontAwesomeIcon icon={faPenToSquare} /></button>
                <button onClick={() => { mergeForClone(props.value.lineItems, props.value.customerNumber); dispatch(returnHome()) }} title={t('Clone')}><FontAwesomeIcon icon={faClone} /></button>
            </span>
        </>)
    }

    function showViewOrderItems(items) {
        const soItems = items.map((it, index) => {
            const productInCache = productsCache.find((prod) => {
                return it.productNumber === prod.num
            })
            console.log(productInCache)
            return ({
                index: index,
                productName: productInCache.description,
                productNumber: productInCache.num,
                chineseName: productInCache.chineseName,
                quantity: it.quantity,
                uom: productInCache.unitOfMeasure,
                price: it.price,
                note: it.note,
                weight: productInCache.weight,
                cost: productInCache.cost,
            })
        })

        setAuxList(soItems)
    }

    function mergeForClone(items, customerNumber) {
        const soItems = items.map((it, index) => {
            const productInCache = productsCache.find((prod) => {
                return it.productNumber === prod.num
            })
            console.log(productInCache)
            return ({
                index: index,
                productName: productInCache?.description ?? it.productName,
                productNumber: productInCache?.num ?? it.productNumber,
                chineseName: productInCache?.chineseName ?? '',
                quantity: it.quantity,
                uom: productInCache?.unitOfMeasure ?? it.uom,
                price: it.price,
                note: it.note,
                weight: productInCache?.weight ?? 0.0,
                cost: productInCache.cost ?? 0.0,
            })
        })

        const customer = customerList.find((it) => {
            return it.number === customerNumber
        })

        dispatch(setSelectedCustomer(customer))
        setProductsOnOrder(soItems)
    }

    const orderStatusMap = [
        {
            "name": "Cancelled",
            "id": 85
        },
        {
            "name": "Closed Short",
            "id": 70
        },
        {
            "name": "Estimate",
            "id": 10
        },
        {
            "name": "Expired",
            "id": 90
        },
        {
            "name": "Fulfilled",
            "id": 60
        },
        {
            "name": "Historical",
            "id": 95
        },
        {
            "name": "In Progress",
            "id": 25
        },
        {
            "name": "Issued",
            "id": 20
        },
        {
            "name": "Voided",
            "id": 80
        }
    ]

    function getOrderStatusStatus(id) {
        return orderStatusMap.find((it) => it.id === id).name
    }

    const currencyFormat = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2
    });

    function currencyFormatter(params) {
        return currencyFormat.format(params.value);
    }

    const columnDefs = [
        { headerName: t('ID'), field: "num", width: 135 },
        { headerName: t("Customer ID"), field: "customerNumber", width: 130 },
        { headerName: t("Customer Name"), field: "customerName", flex: 2 },
        { headerName: t('Created'), field: "createdDate", valueFormatter: params => params.value.split('T')[0] , width: 120 },
        { headerName: t('Status'), field: "statusId", valueFormatter: params => t(getOrderStatusStatus(params.value)), width: 120 },
        { headerName: t('Tax Rate'), field: "taxRate", width: 90, valueFormatter: currencyFormatter, type: 'rightAligned' },
        { headerName: t('Total Price'), field: "totalPrice", width: 100, valueFormatter: currencyFormatter, type: 'rightAligned'},
        { headerName: t('Items'), field: "lineItems", valueFormatter: params => params.value.length, width: 90, type: 'rightAligned' },
        { headerName: '', valueGetter: (p) => p.data, cellRenderer: ActionButtons, width: 90, type: 'centerAligned', resizable: false }
    ]

    function orderSelected(event) {
        if (!event.node.isSelected()) {
            return;
        }
        showViewOrderItems(event.data.lineItems)
    }

    useEffect(() => {
        async function fetchData() {
            if (shouldFetchOrders) {
                try {
                    let result = await axios.get(
                        // import.meta.env.VITE_API_BASE_URL + `orders/forCustomer?customerId=${customerState.id}`,
                        
                        import.meta.env.VITE_API_BASE_URL + `orders/all?startDate=${formatDate(startDate,"yyyy-mm-dd")}&endDate=${formatDate(endDate,"yyyy-mm-dd")}`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )
                    const orders = result.data

                    if (orders) {
                        setOrderList([...orderList, ...orders])
                        setFilteredList([...orders])
                    }
                    setShouldFetchOrders(false)
                    console.log(orders)
                } catch (ex) {
                    console.log("axios error ")
                    console.log(ex)
                }
            }
        }
        if (token !== null && shouldFetchOrders) {
            fetchData()
        }

    }, [token, shouldFetchOrders, setShouldFetchOrders, orderList, setOrderList, customerState, filteredList, setFilteredList])

    function filterList(filter) {
        const lowFilter = filter.toLowerCase()
        const result = orderList.filter((so) => {
            const status = t(getOrderStatusStatus(so.statusId)).toLowerCase()
            return (so.num.toLowerCase().includes(lowFilter) ||
                so.createdDate.toLowerCase().includes(lowFilter) ||
                status.includes(lowFilter) ||
                so.customerNumber.toLowerCase().includes(lowFilter) ||
                so.customerName.toLowerCase().includes(lowFilter)
            )
        })

        setFilteredList(result)
    }
    
    function formatDate(date, format) {
        const map = {
            mm: ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1),
            dd: ((date.getDate()) < 10 ? "0" : "") + (date.getDate()),
            yyyy: date.getFullYear()
        }
    
        return format.replace(/mm|dd|yyyy/gi, matched => map[matched])
    }


    return (<>
        <div className='h-full w-full'>
            <div className='flex space-x-2 searchBar w-2/3'>
                <button onClick={() => { dispatch(clearSelectedCustomer()); dispatch(returnHome()) }} className='primary-button flex-none'>{t('Back')}</button>
                <input type='text' onChange={(e) => { filterList(e.target.value) }} className='inputBox grow' placeholder={t('Search')} id='orderSearchInput'></input>
                <span class="pl-2 datePicker">
                    <label for="startDateInput" className='self-center'>{t('From')}</label>
                    <input type='date' max={formatDate(endDate, "yyyy-mm-dd")} value={formatDate(startDate, "yyyy-mm-dd")} onChange={(e) => { setStartDate(getDateWithoutTimezone(new Date(e.target.value))) }} id='startDateInput'/>
                    <label for="endDateInput" className='self-center'>{t('To')}</label>
                    <input type='date' min={formatDate(startDate, "yyyy-mm-dd")} value={formatDate(endDate, "yyyy-mm-dd")} onChange={(e) => { setEndDate(getDateWithoutTimezone(new Date(e.target.value))) }} id='endDateInput'/>
                    <button onClick={() => { setShouldFetchOrders(true) }} className='primary-button'>{t('Search')}</button>
                </span>
            </div>
            <div className='flex w-full h-5/6 space-x-1'>
                <div
                    className="ag-theme-quartz w-2/3 h-full"
                >
                    <AgGridReact
                        columnDefs={columnDefs}
                        rowData={filteredList}
                        rowSelection="single"
                        onRowSelected={orderSelected}>
                    </AgGridReact>
                </div>
                <div
                    className="w-1/3 h-full"
                >
                    <OrderSummary productList={auxList} setProductList={setAuxList} showRemoveButton={false} />
                </div>
            </div>
        </div>
    </>)
}

export default OrderLookup;
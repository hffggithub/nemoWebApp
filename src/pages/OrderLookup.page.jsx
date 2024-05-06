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

    const ModifyButton = props => {
        return (<>
            <button onClick={() => { mergeForClone(props.value.lineItems, props.value.customerNumber); dispatch(returnHome()) }} disabled={props.value.statusId !== 10 && props.value.statusId !== 20} className='primary-button focus:ring-4 focus:outline-none font-medium rounded-lg px-1'>{t('Modify')}</button>
        </>)
    }

    const CloneButton = props => {
        return (<>
            <button onClick={() => { mergeForClone(props.value.lineItems, props.value.customerNumber); dispatch(returnHome()) }} className='primary-button focus:ring-4 focus:outline-none font-medium rounded-lg px-1'>{t('Clone')}</button>
        </>)
    }

    const ViewButton = props => {
        return (<>
            <button onClick={() => { console.log(props.value.lineItems); showViewOrderItems(props.value.lineItems) }} className='primary-button focus:ring-4 focus:outline-none font-medium rounded-lg px-1'>{t('View')}</button>
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


    const columnDefs = [
        { headerName: t('ID'), field: "num", width: 60 },
        { headerName: t("Customer ID"), field: "customerNumber", width: 120 },
        { headerName: t("Customer Name"), field: "customerName", width: 150 },
        { headerName: t('Created'), field: "createdDate", valueFormatter: params => params.value.split('T')[0] , width: 120 },
        { headerName: t('Status'), field: "statusId", valueFormatter: params => t(getOrderStatusStatus(params.value)), width: 90 },
        { headerName: t('Tax Rate'), field: "taxRate", width: 90  },
        { headerName: t('Total Price'), field: "totalPrice", width: 100 },
        { headerName: t('Items'), field: "lineItems", valueFormatter: params => params.value.length, width: 90 },
        { headerName: t('View'), valueGetter: (p) => p.data, cellRenderer: ViewButton, width: 90 },
        { headerName: t('Modify'), valueGetter: (p) => p.data, cellRenderer: ModifyButton, width: 90 },
        { headerName: t('Clone'), valueGetter: (p) => p.data, cellRenderer: CloneButton, width: 90 }
    ]

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
            <div className='flex w-full space-x-2'>
                <button onClick={() => { dispatch(clearSelectedCustomer()); dispatch(returnHome()) }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center'>{t('Back')}</button>
                <input type='text' onChange={(e) => { filterList(e.target.value) }} className='border rounded-lg block w-2/3 my-1 p-2.5' placeholder={t('Search')} id='orderSearchInput'></input>
                <span className='self-center'>{t('From')}</span>
                <input type='date' max={formatDate(endDate, "yyyy-mm-dd")} value={formatDate(startDate, "yyyy-mm-dd")} className='border rounded-lg block my-1 p-2.5' onChange={(e) => { setStartDate(getDateWithoutTimezone(new Date(e.target.value))) }} id='startDateInput'/>
                <span className='self-center'>{t('To')}</span>
                <input type='date' min={formatDate(startDate, "yyyy-mm-dd")} value={formatDate(endDate, "yyyy-mm-dd")} className='border rounded-lg block my-1 p-2.5' onChange={(e) => { setEndDate(getDateWithoutTimezone(new Date(e.target.value))) }} id='endDateInput'/>
                <button onClick={() => { setShouldFetchOrders(true) }} className='primary-button font-medium rounded-lg px-5 py-2.5 text-center'>{t('Search')}</button>
            </div>
            <div className='flex w-full h-5/6 space-x-1'>
                <div
                    className="ag-theme-quartz w-2/3 h-full"
                >
                    <AgGridReact
                        columnDefs={columnDefs}
                        rowData={filteredList}>
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
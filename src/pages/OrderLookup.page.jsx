import { useSelector, useDispatch } from 'react-redux';
import axios from "../providers/axiosProvider";
import { clearSelectedCustomer, setSelectedCustomer } from '../slices/customerSlice';
import { AgGridReact } from 'ag-grid-react';
import { showError } from '../slices/errorSlice';
import { useEffect, useState, useRef, useCallback } from 'react';
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
import { addToDate } from '../utils/timeUtils';
import { setOrderInContext } from '../slices/orderSlice';
import { consolidateLineItemsData } from '../utils/orderUtils';
import { selectTab } from '../slices/navBarSlice.js';


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
    const dispatch = useDispatch()
    const [startDate, setStartDate] = useState(initialStartDate)
    const [productGridReady, setProductGridReady] = useState(false)
    const gridRef = useRef();
    const [focusedElement, setFocusedElement] = useState('search');
    const controlInputed = useRef(false);


    const subclassState = useSelector(state => state.subclass.value)
    const dcState = useSelector(state => state.distributionCenter.value)

    dispatch(selectTab(2))


    function getDateWithoutTimezone(date) {
        var userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset);
    }



    const ActionButtons = props => {
        return (<>
            <span className="actionIcons">
                <button onClick={() => { setOrderToModify(props.value.lineItems, props.value.customerNumber, props.value); dispatch(returnHome()) }} disabled={props.value.statusId !== 10 && props.value.statusId !== 20} title={t('Modify')}><FontAwesomeIcon icon={faPenToSquare} /></button>
                <button onClick={() => { mergeForClone(props.value.lineItems, props.value.customerNumber); dispatch(returnHome()) }} title={t('Clone')}><FontAwesomeIcon icon={faClone} /></button>
            </span>
        </>)
    }

    function showViewOrderItems(items) {
        const soItems = consolidateLineItemsData(items, productsCache)

        setAuxList(soItems)
    }

    function setOrderToModify(items, customerNumber, order) {
        dispatch(setOrderInContext(order))
        mergeForClone(items, customerNumber)
    }

    function mergeForClone(items, customerNumber) {
        const soItems = consolidateLineItemsData(items, productsCache)

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
        { headerName: t('Order ID'), field: "num", width: 135 },
        { headerName: t("Customer ID"), field: "customerNumber", width: 130 },
        { headerName: t("Customer Name"), field: "customerName", flex: 2 },
        { headerName: t('Scheduled Shipment'), field: "scheduledDate", valueFormatter: params => params.value.split('T')[0], width: 170 },
        { headerName: t('Created By'), field: "createdBy", width: 120 },
        { headerName: t('Created'), field: "createdDate", valueFormatter: params => params.value.split('T')[0], width: 120 },
        { headerName: t('Modified By'), field: "lastModifiedBy", width: 120 },
        { headerName: t('Modified'), field: "lastModifiedDate", valueFormatter: params => params.value?.split('T')[0], width: 120 },
        { headerName: t('Status'), field: "statusId", valueFormatter: params => t(getOrderStatusStatus(params.value)), width: 120 },
        { headerName: t('Total Price'), field: "totalPrice", width: 100, valueFormatter: currencyFormatter, type: 'rightAligned' },
        { headerName: t('Items'), field: "lineItems", valueFormatter: params => params.value.length, width: 90, type: 'rightAligned' },
        { headerName: '', valueGetter: (p) => p.data, cellRenderer: ActionButtons, width: 90, type: 'centerAligned', resizable: false }
    ]

    function orderSelected() {
        var selectedRows = gridRef.current?.api.getSelectedRows();
        if (selectedRows.length) {
            showViewOrderItems(selectedRows[0].lineItems)
        }
        // if (!event.node.isSelected()) {
        //     return;
        // }
        // showViewOrderItems(event.data.lineItems)
    }

    useEffect(() => {
        async function fetchData() {
            if (shouldFetchOrders) {
                let filterBy = "";
                if (subclassState) {
                    filterBy = subclassState.name
                } else if (dcState) {
                    filterBy = dcState.name.split('_')[0]
                }
                // Added to include the end date on the range.
                let calculatedEndDate = addToDate(endDate, 1)
                try {
                    let result = await axios.get(
                        // NEMO_API_HOST + `orders/forCustomer?customerId=${customerState.id}`,

                        NEMO_API_HOST + `orders/all?startDate=${formatDate(startDate, "yyyy-mm-dd")}&endDate=${formatDate(calculatedEndDate, "yyyy-mm-dd")}&dcOrCompany=${filterBy}`,
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
            const createdFilter =  so.createdDate?.split('T')[0].toLowerCase().includes(lowFilter) ?? false;
            const modifiedFilter =  so.createdDate?.split('T')[0].toLowerCase().includes(lowFilter) ?? false;
            const scheduledFilter =  so.createdDate?.split('T')[0].toLowerCase().includes(lowFilter) ?? false;
            const modifiedByFilter = so.lastModifiedBy?.toLowerCase().includes(lowFilter) ?? false;
            const createdByFilter = so.createdBy?.toLowerCase().includes(lowFilter) ?? false;
            return (so.num.toLowerCase().includes(lowFilter) ||
                so.createdDate.split('T')[0].toLowerCase().includes(lowFilter) ||
                status.includes(lowFilter) ||
                so.customerNumber.toLowerCase().includes(lowFilter) ||
                so.customerName.toLowerCase().includes(lowFilter) ||
                createdByFilter ||
                modifiedByFilter ||
                scheduledFilter ||
                modifiedFilter ||
                createdFilter
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


    const onGridReady = useCallback((event) => {
        setProductGridReady(true)
        console.log('its ready on order lookup')
    }, [setProductGridReady]);


    const handleUserKeyPress = useCallback((event) => {
        const { key, keyCode } = event;
        if ((keyCode == 38 || keyCode == 40) && focusedElement === "search") {
            moveProductRow(keyCode == 40 ? 1 : -1);
        }
    }, [focusedElement]);

    useEffect(() => {
        window.addEventListener("keydown", handleUserKeyPress);
        return () => {
            window.removeEventListener("keydown", handleUserKeyPress);
        };
    }, [handleUserKeyPress, focusedElement]);

    function onHandleFocus(item) {
        console.log(item)
        switch (item) {
            case 'search':
                setFocusedElement(item);
                break;

            default:
                break;
        }

    }


    function moveProductRow(increment) {
        let selectedRows = gridRef.current?.api.getSelectedNodes();
        let indexToSelect = 0;
        if (selectedRows.length) {
            indexToSelect = selectedRows[0].rowIndex + increment;
        }

        setRow(indexToSelect);
    }

    function resetRow() {
        setRow(0);
    }

    function searchFieldKeyPress(e) {
        if (e.key === 'Enter') {
            orderSelected();
        } else if (e.keyCode === 17) {
            controlInputed.current = false;
        } else if (controlInputed.current) {
            if (e.keyCode === 67) {
                console.log('control+c pressed')
                copyOrdeKeyBinding()
            } else if (e.keyCode === 77) {
                console.log('control+m pressed')
                modifyOrdeKeyBinding()
            }
        }
    }

    function searchFIeldKeyDown(e) {
        if (e.keyCode === 17) {
            controlInputed.current = true;
        }
    }

    function sendKeyboardBinding(action) {
        var selectedRows = gridRef.current?.api.getSelectedRows();
        if (selectedRows.length) {
            showViewOrderItems(selectedRows[0].lineItems)
        }
    }

    function modifyOrdeKeyBinding() {
        var selectedRows = gridRef.current?.api.getSelectedRows();
        if (selectedRows.length) {
            if (selectedRows[0].statusId === 10 || selectedRows[0].statusId === 20) {
                setOrderToModify(selectedRows[0].lineItems, selectedRows[0].customerNumber, selectedRows[0]);
                dispatch(returnHome())
            }
        }
    }

    function copyOrdeKeyBinding() {
        var selectedRows = gridRef.current?.api.getSelectedRows();
        if (selectedRows.length) {
            mergeForClone(selectedRows[0].lineItems, selectedRows[0].customerNumber);
            dispatch(returnHome())
        }
    }



    function setRow(index) {
        gridRef.current?.api.forEachNode((rowNode) => {
            if (rowNode.rowIndex == index) {
                rowNode.setSelected(true, true);
            }
        });
        gridRef.current?.api.ensureIndexVisible(index);
    }

    return (<>
        <div className='h-full w-full'>
            <div className='flex space-x-2 searchBar w-2/3'>
                <button onClick={() => { dispatch(clearSelectedCustomer()); dispatch(returnHome()) }} className='primary-button flex-none'>{t('Back')}</button>
                <input type='text' onKeyDown={searchFIeldKeyDown} autoFocus autoComplete='off' onFocus={() => { onHandleFocus('search') }} onKeyUp={searchFieldKeyPress} onChange={(e) => { filterList(e.target.value) }} className='inputBox grow' placeholder={t('Search')} id='orderSearchInput'></input>
                <span className="pl-2 datePicker">
                    <label for="startDateInput" className='self-center'>{t('Created')+" "+ t('From')}</label>
                    <input type='date' max={formatDate(endDate, "yyyy-mm-dd")} defaultValue={formatDate(startDate, "yyyy-mm-dd")} onChange={(e) => { setStartDate(getDateWithoutTimezone(new Date(e.target.value))) }} id='startDateInput' />
                    <label for="endDateInput" className='self-center'>{t('To')}</label>
                    <input type='date' min={formatDate(startDate, "yyyy-mm-dd")} defaultValue={formatDate(endDate, "yyyy-mm-dd")} onChange={(e) => { setEndDate(getDateWithoutTimezone(new Date(e.target.value))) }} id='endDateInput' />
                    <button onClick={() => { setShouldFetchOrders(true) }} className='primary-button'>{t('Search')}</button>
                </span>
            </div>
            <div className='flex flex-col space-y-1 w-full h-5/6'>
                <div
                    className="ag-theme-quartz w-full h-full"
                >
                    <AgGridReact
                        suppressDragLeaveHidesColumns={true}
                        onGridReady={onGridReady}
                        ref={gridRef}
                        columnDefs={columnDefs}
                        rowData={filteredList}
                        rowSelection="single"
                        onRowDataUpdated={resetRow}
                        onRowClicked={orderSelected}>
                    </AgGridReact>
                </div>
                <div
                    className="w-full h-full"
                >
                    <OrderSummary productList={auxList} setProductList={setAuxList} showRemoveButton={false} />
                </div>
            </div>
        </div>
    </>)
}

export default OrderLookup;
import { useEffect, useState } from "react";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { AgGridReact } from 'ag-grid-react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedCustomer } from '../slices/customerSlice';
import { showError } from "../slices/errorSlice";
import { useLocalStorage } from "@uidotdev/usehooks";
import axios from "../providers/axiosProvider";

import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { returnHome, toScreen } from "../slices/navSlice";
import { setOrderInContext } from "../slices/orderSlice";


function Customer() {
    const [filteredCustomerList, setFilteredCustomerList] = useState([]);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const customerList = useSelector(state => state.cache.customers);
    const [orderLookup, setOrderLookup] = useState(false)
    const [shouldFetchOrders, setShouldFetchOrders] = useState(false)
    const [auxSelectedCustomer, setAuxSelectedCustomer] = useState(null)
    const [token, setToken] = useLocalStorage("token", null)

    const columnDefs = [
        { headerName: t("Customer ID"), field: "number", width: 130 },
        { headerName: t('Name'), field: "name", flex: 2 },
        { headerName: t('Chinese Name'), field: "customFields.18.value", flex: 2 },
        { headerName: t('Contact'), field: "contactName", flex: 1 },
        { headerName: t('Phone Number'), field: "contactNumber", flex: 1 },
        { headerName: t('Street'), field: "shippingAddress.street", flex: 1 },
        { headerName: t('City'), field: "shippingAddress.city", flex: 1 },
        { headerName: t('State'), field: "shippingAddress.state", flex: 1 },
        { headerName: t('Country'), field: "shippingAddress.country", flex: 1 }
    ]

    useEffect(() => {
        setFilteredCustomerList(customerList)
    }, [customerList])

    
    useEffect(() => {
        async function fetchData() {
            if (shouldFetchOrders) {
                try {
                    let result = await axios.get(
                        import.meta.env.VITE_API_BASE_URL + `orders/openForCustomer?customerId=${auxSelectedCustomer.id}`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )
                    let debtResult = await axios.get(
                        import.meta.env.VITE_API_BASE_URL + `orders/customerDebt?customerId=${auxSelectedCustomer.id}`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )

                    const debt = debtResult.data
                    const orders = result.data

                    if(debt && auxSelectedCustomer.creditLimit !== 0 && auxSelectedCustomer.creditLimit >= debt.debt) {
                        dispatch(
                            showError(
                                {
                                    errorTile: t('Credit limit'),
                                    errorBody: t(`This customer is over its credit limit, please contact your manager.`),
                                    errorButton: 'ok',
                                    showError: true,
                                }
                            )
                        )
                    } else {

                        if (orders) {
                            if(orders.length > 0) {
                                dispatch(setOrderInContext(orders[0]))
                                dispatch(
                                    showError(
                                        {
                                            errorTile: t('Open order'),
                                            errorBody: t(`There is an open order for this customer, Do you want to create a new one?`),
                                            errorButton: 'openOrder',
                                            showError: true,
                                        }
                                    )
                                )
                                dispatch(setSelectedCustomer(auxSelectedCustomer))
                                dispatch(toScreen('openOrder'))
                            } else {
                                dispatch(setSelectedCustomer(auxSelectedCustomer))
                            }
                            // setOrderList([...orderList, ...orders])
                            // setFilteredList([...orders])
                        } else {
                            dispatch(setSelectedCustomer(auxSelectedCustomer))
                        }
                    }
                    setShouldFetchOrders(false)
                } catch (ex) {
                    console.log("axios error ")
                    console.log(ex)
                }
            }
        }
        if(shouldHoldSalesForCustomer(auxSelectedCustomer)) {
            dispatch(
                showError(
                    {
                        errorTile: t('Customer not allowed'),
                        errorBody: t(`This customer is not allowed to open any new orders, please contact your manager.`),
                        errorButton: 'ok',
                        showError: true,
                    }
                )
            )
            setShouldFetchOrders(false)
        } else {
            if (token !== null && shouldFetchOrders && auxSelectedCustomer !== null && !orderLookup) {
                fetchData()
            } else if(auxSelectedCustomer !== null && orderLookup) {
                dispatch(setSelectedCustomer(auxSelectedCustomer))
            }
        }

    }, [token, shouldFetchOrders, setShouldFetchOrders, auxSelectedCustomer, setAuxSelectedCustomer, dispatch, setSelectedCustomer, setOrderInContext])

    function shouldHoldSalesForCustomer(customer) {
        return (customer.statusId === 50 || customer.statusId === 30)
    }

    function filterCustomers(filter) {
        const lowerCaseFilter = filter.toLowerCase()
        const result = customerList.filter((customer) => {
            const stateFilter = customer.shippingAddress.state ? customer.shippingAddress.state.toLowerCase().includes(lowerCaseFilter) : false
            const countryFilter = customer.shippingAddress.country ? customer.shippingAddress.country.toLowerCase().includes(lowerCaseFilter) : false
            const contactNameFilter = customer.contactName ? customer.contactName.toLowerCase().includes(lowerCaseFilter) : false
            const contactNumberFilter = customer.contactNumber ? customer.contactNumber.toLowerCase().includes(lowerCaseFilter) : false
            // TODO: Enable again once fishbowlserver02 has chinese translations.
            // const chineseNameFilter = customer.customFields["18"]?.value ? customer.customFields["18"].value.toLowerCase().includes(lowerCaseFilter) : false
            return (
                customer.number.toLowerCase().includes(lowerCaseFilter) ||
                customer.name.toLowerCase().includes(lowerCaseFilter) ||
                contactNameFilter ||
                contactNumberFilter ||
                customer.shippingAddress.street.toLowerCase().includes(lowerCaseFilter) ||
                customer.shippingAddress.city.toLowerCase().includes(lowerCaseFilter) ||
                stateFilter ||
                // chineseNameFilter ||
                countryFilter
            );
        });

        setFilteredCustomerList(result);
    }

    function onCustomerSelected(event) {
        setAuxSelectedCustomer(event.data)
        setShouldFetchOrders(true)
    }

    function handleOrderLookupCheckbox() {
        const newValue = !orderLookup
        setOrderLookup(newValue)
        console.log('order lookup ' + newValue)
        dispatch(newValue ? toScreen('orderLookup') : returnHome())
    }

    return (
        <>
            <div className="w-full h-full">
                <div className="flex space-x-2 searchBar">
                    <input onChange={(e) => { filterCustomers(e.target.value) }} type="text" name="filter" id="filter" className="inputBox basis-1/2" placeholder={t('Customer search')} />
                    <div className="basis-1/2 text-right">  
                       <button onClick={() => {dispatch(toScreen('orderLookup'))}} className="primary-button">{t('Order Lookup')}</button>
                    </div>
                    {/* <input type="checkbox" id="enableOrderLookup" name="enableOrderLookup" checked={orderLookup} onChange={() => {handleOrderLookupCheckbox()}}></input>
                    <label htmlFor="enableOrderLookup h-fit">{t('Order Lookup')}</label> */}

                </div>

                <div
                    className="ag-theme-quartz w-full h-5/6"
                >
                    <AgGridReact
                        rowSelection="single"
                        onRowClicked={onCustomerSelected}
                        columnDefs={columnDefs}
                        rowData={filteredCustomerList}>
                    </AgGridReact>
                </div>
            </div>
        </>
    )

}

export default Customer;
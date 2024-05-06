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


function Customer() {
    const [filteredCustomerList, setFilteredCustomerList] = useState([]);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const customerList = useSelector(state => state.cache.customers);
    const [orderLookup, setOrderLookup] = useState(false)
    const [shouldFetchOrders, setShouldFetchOrders] = useState(false)
    const [auxSelectedCustomer, setAuxSelectedCustomer] = useState(null)
    const [token, setToken] = useLocalStorage("token", null)
    const [openOrder, setOpenOrder] = useState(null)

    const columnDefs = [
        { headerName: t("Customer ID"), field: "number" },
        { headerName: t('Name'), field: "name" },
        { headerName: t('Chinese Name'), field: "customFields.18.value" },
        { headerName: t('Contact'), field: "contactName" },
        { headerName: t('Phone Number'), field: "contactNumber" },
        { headerName: t('Street'), field: "shippingAddress.street" },
        { headerName: t('City'), field: "shippingAddress.city" },
        { headerName: t('State'), field: "shippingAddress.state" },
        { headerName: t('Country'), field: "shippingAddress.country" }
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
                    const orders = result.data

                    if (orders) {
                        if(orders.length > 0) {
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
                            setOpenOrder(orders[0])
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
                    setShouldFetchOrders(false)
                    console.log(orders)
                } catch (ex) {
                    console.log("axios error ")
                    console.log(ex)
                }
            }
        }
        if (token !== null && shouldFetchOrders && auxSelectedCustomer !== null && !orderLookup) {
            fetchData()
        } else if(auxSelectedCustomer !== null && orderLookup) {
            dispatch(setSelectedCustomer(auxSelectedCustomer))
        }

    }, [token, shouldFetchOrders, setShouldFetchOrders, auxSelectedCustomer, setAuxSelectedCustomer, dispatch, setSelectedCustomer, openOrder, setOpenOrder])

    function filterCustomers(filter) {
        const lowerCaseFilter = filter.toLowerCase()
        const result = customerList.filter((customer) => {
            const stateFilter = customer.shippingAddress.state ? customer.shippingAddress.state.toLowerCase().includes(lowerCaseFilter) : false
            const countryFilter = customer.shippingAddress.country ? customer.shippingAddress.country.toLowerCase().includes(lowerCaseFilter) : false
            const contactNameFilter = customer.contactName ? customer.contactName.toLowerCase().includes(lowerCaseFilter) : false
            const contactNumberFilter = customer.contactNumber ? customer.contactNumber.toLowerCase().includes(lowerCaseFilter) : false
            const chineseNameFilter = customer.customFields["18"].value ? customer.customFields["18"].value.toLowerCase().includes(lowerCaseFilter) : false
            return (
                customer.number.toLowerCase().includes(lowerCaseFilter) ||
                customer.name.toLowerCase().includes(lowerCaseFilter) ||
                contactNameFilter ||
                contactNumberFilter ||
                customer.shippingAddress.street.toLowerCase().includes(lowerCaseFilter) ||
                customer.shippingAddress.city.toLowerCase().includes(lowerCaseFilter) ||
                stateFilter ||
                chineseNameFilter ||
                countryFilter
            );
        });

        setFilteredCustomerList(result);
    }

    function onCustomerSelected(event) {
        if (!event.node.isSelected()) {
            return;
        }

        console.log(event.data)
        setAuxSelectedCustomer(event.data)
        setShouldFetchOrders(true)
        // dispatch(
        //     setSelectedCustomer(
        //         event.data
        //     )
        // )
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
                <div className="flex space-x-2 items-center">
                    <input onChange={(e) => { filterCustomers(e.target.value) }} type="text" name="filter" id="filter" className="border sm:text-sm rounded-lg block w-2/3 my-1 p-2.5" placeholder={t('Customer search')} />
                    <button onClick={() => {dispatch(toScreen('orderLookup'))}} className="primary-button font-medium rounded-lg text-center p-2">{t('Order Lookup')}</button>
                    {/* <input type="checkbox" id="enableOrderLookup" name="enableOrderLookup" checked={orderLookup} onChange={() => {handleOrderLookupCheckbox()}}></input>
                    <label htmlFor="enableOrderLookup h-fit">{t('Order Lookup')}</label> */}

                </div>

                <div
                    className="ag-theme-quartz w-full h-5/6"
                >
                    <AgGridReact
                        rowSelection="single"
                        onRowSelected={onCustomerSelected}
                        columnDefs={columnDefs}
                        rowData={filteredCustomerList}>
                    </AgGridReact>
                </div>
            </div>
        </>
    )

}

export default Customer;
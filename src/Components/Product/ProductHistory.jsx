import { useEffect } from "react"
import axios from "../../providers/axiosProvider.js"
import { AgGridReact } from 'ag-grid-react'
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { useLocalStorage } from "@uidotdev/usehooks";
import { useState } from "react";
import { useSelector } from "react-redux";
import { API_DATE_FORMAT, dateInFuture, dateInPast, formatDate } from "../../utils/timeUtils.js";


function ProductHistory({selectedProduct}) {


    const { t, i18n } = useTranslation()
    const [token, setToken] = useLocalStorage("token", null)
    const [shouldFetch, setShouldFetch] = useState(true)
    const [productOrderHistory, setProductOrderHistory] = useState([])
    const customerState = useSelector(state => state.customer.value)
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState(dateInPast(90))
    const [endDate, setEndDate] = useState(dateInFuture(1))

    const columnDefs = [
        { headerName: t('Date'),field: "orderCreatedDate", valueFormatter: params => params.value.split('T')[0] , width: 105 },
        { headerName: t('Name'), field: "productName", flex: 1 },
        { headerName: t('Chinese Name'), field: "chineseName", flex: 1},
        // { headerName: t('Chinese Name'), field: "customFieldsMap.10.value", width: 190 },
        { headerName: t('Quantity'), field: "quantity", width: 90, type: 'rightAligned' },
        { headerName: t('Unit Price'), field: "price", valueFormatter: params => params.value.toFixed(2), width: 100,  type: 'rightAligned'  },
        { headerName: t('Total Price'), valueGetter: (p) => (p.data.price * p.data.quantity).toFixed(2),  type: 'rightAligned', width: 100   },
        { headerName: t('UOM'), field: "uom", width: 70 },
        { headerName: t('Note'), field: "note", width: 190},
    ]

    

    useEffect(() => {
        async function fetchData() {
            if (shouldFetch) {
                setIsLoading(true)
                try {
                    let result = await axios.get(
                        import.meta.env.VITE_API_BASE_URL + 
                        `orders/productHistory?startDate=${formatDate(startDate, API_DATE_FORMAT)}&endDate=${formatDate(endDate, API_DATE_FORMAT)}&productNum=${selectedProduct.num}&customerId=${customerState.id}`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )
                    if(result?.data) {
                        setProductOrderHistory(result.data)
                    }
                    setShouldFetch(false)
                    setIsLoading(false)
                } catch (ex) {
                    console.log("axios error ")
                    console.log(ex)
                }
            }
        }
        if (token !== null && shouldFetch) {
            fetchData()
        }

    }, [token, selectedProduct, customerState, shouldFetch, setShouldFetch, setProductOrderHistory, productOrderHistory, isLoading, setIsLoading, startDate, endDate, customerState])

    return (<div className='ag-theme-quartz w-full h-full'>
        <AgGridReact
            rowSelection="none"
            columnDefs={columnDefs}
            rowData={productOrderHistory}>
        </AgGridReact>
    </div>)
}

export default ProductHistory;
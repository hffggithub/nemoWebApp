import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useEffect, useState } from 'react';

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





function OrderSummary({ productList, setProductList, showRemoveButton, orderInfo }) {
    const { t, i18n } = useTranslation()
    const [subTotal, setSubTotal] = useState(0.0)
    const [tax, setTax] = useState(0.0)
    const [total, setTotal] = useState(0.0)
    const [netWeight, setNetWeight] = useState(0.0)
    const [grossWeight, setGrossWeight] = useState(0.0)
    const [margin, setMargin] = useState(0.0)

    function removeItem(itemToRemove) {
        const newProductList = productList.filter(product => {
            return product.productNumber != itemToRemove
        })
        setProductList(newProductList)
    }

    function updateQuantity(index, qty) {
        console.log(`ngsh index qty ${index}`)
        const newProductList = productList.map((it) => {
            if(it.index === index) {
                console.log(`ngsh index qty ${it}`)
                let copy = it
                copy.quantity = qty
                return copy                
            }
            return it
        })
        setProductList(newProductList)
    }

    function updatePrice(index, price) {
        console.log(`ngsh index price ${index}`)
        const newProductList = productList.map((it) => {
            if(it.index === index) {
                console.log(`ngsh index price ${it}`)
                let copy = it
                copy.price = price
                return copy                
            }
            return it
        })
        setProductList(newProductList)
    }



    const DeleteButton = props => {
        return (<>
            <button onClick={() => { removeItem(props.value) }} className='primary-button focus:ring-4 focus:outline-none font-medium rounded-lg px-1'>{t('Remove')}</button>
        </>)
    }

    const QuantityTextField = props => {
        const [qty, setQty] = useState(props.value.quantity)

        function handleBlur(event) {
            updateQuantity(props.value.index, qty)
        }

        return(
            <>
            <input id='itemQty' disabled={!showRemoveButton} value={qty} onBlur={handleBlur} onChange={(e) => {setQty(e.target.value)}}/>
            </>
        )
    }

    const PriceTextField = props => {
        const [price, setPrice] = useState(props.value.price)

        function handleBlur(event) {
            updatePrice(props.value.index, price)
        }

        return(
            <>
            <input id='itemPrice' disabled={!showRemoveButton} value={price} onBlur={handleBlur} onChange={(e) => {setPrice(e.target.value)}}/>
            </>
        )
    }

    useEffect(() => {
        if (productList) {
            console.log(productList)
            let totalAux = 0.0;
            let subTotalAux = 0.0;
            let taxAux = 0.0;
            let grossWeightAux = 0.0;
            let netWeightAux = 0.0;
            let marginAux = 0.0;
            let costAux = 0.0;
            productList.forEach(element => {
                subTotalAux += element.quantity * element.price
                grossWeightAux += element.quantity * element.weight
                netWeightAux += element.quantity * element.weight
                costAux += element.cost * element.quantity
            });

            // TODO: Fix logic for tax amount
            taxAux = 0.0 * subTotalAux;
            totalAux = subTotalAux + taxAux;
            if(subTotalAux !== 0.0 ){ 
                marginAux = ((subTotalAux - costAux) / subTotalAux) * 100.0
            }

            setMargin(marginAux ?? 0.0)

            setGrossWeight(grossWeightAux)
            setNetWeight(netWeightAux)
            setSubTotal(subTotalAux)
            setTax(taxAux)
            setTotal(totalAux)
        }

    }, [setSubTotal, setTax, setTotal, productList])

    



    const columnDefsSumary = [
        { headerName: t('ID'), field: "productNumber", width: 80 },
        { headerName: t('Name'), field: "productName" },
        { headerName: t('Chinese Name'), field: "chineseName", width: 150 },
        { headerName: t('Quantity'), valueGetter: (p) => p.data, cellRenderer: QuantityTextField, width: 100  },
        { headerName: t('UOM'), field: "uom", width: 100 },
        { headerName: t('Note'), field: "note" },
        { headerName: t('Price'), valueGetter: (p) => p.data, cellRenderer: PriceTextField, width: 100   },
        ...(orderInfo ? [{ headerName: t('Cost'), field: "cost", valueFormatter: params => params.value.toFixed(2) , width: 100  }] : []),
        ...(showRemoveButton ? [{ headerName: t('Remove'), field: "productNumber", cellRenderer: DeleteButton }] : []),
    ]
    return (
        <div className="h-full w-full">
            <div className='flex-initial ag-theme-quartz w-full h-5/6'>
                {showRemoveButton && <h1 className=' self-center'>{t('Order Summary')}</h1>}
                <AgGridReact
                    gridOptions={gridOptions}
                    columnDefs={columnDefsSumary}
                    rowData={productList}>
                </AgGridReact>
            </div>
            <div className='w-full h-1/6 py-4 text-right'>
                {orderInfo && (<>
                    <span>{t('Gross Weight')}: {grossWeight.toFixed(2)}</span>
                    <br></br>
                    <span>{t('Net Weight')}: {netWeight.toFixed(2)}</span>
                    <br></br>
                    <span>{t('Margin')}: {margin.toFixed(2)}</span>
                    <br></br>
                </>)}
                <span>{t('Sub total')}: {subTotal.toFixed(2)}</span>
                <br></br>
                <span>{t('Tax')}: {tax.toFixed(2)}</span>
                <br></br>
                <span>{t('Total')}: {total.toFixed(2)}</span>
                <br></br>
            </div>
        </div>
    );
}

export default OrderSummary;
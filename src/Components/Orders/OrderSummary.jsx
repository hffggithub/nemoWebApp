import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

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
        
        <span class="actionIcons">
                <button onClick={() => { removeItem(props.value)}} title={t('Remove')}><FontAwesomeIcon icon={faXmark} /></button>
         </span>
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
        { headerName: t('ID'), field: "productNumber", width: 100 },
        { headerName: t('Name'), field: "productName", flex: 2 },
        { headerName: t('Chinese Name'), field: "chineseName", flex: 2},
        { headerName: t('Quantity'), valueGetter: (p) => p.data, cellRenderer: QuantityTextField, width: 90  },
        { headerName: t('UOM'), field: "uom", width: 70 },
        { headerName: t('Note'), field: "note", flex: 2 },
        { headerName: t('Unit Price'), valueGetter: (p) => p.data, cellRenderer: PriceTextField,  type: 'rightAligned' , width: 100   },
        { headerName: t('Total Price'), valueGetter: (p) => (p.data.price * p.data.quantity).toFixed(2),  type: 'rightAligned', width: 100   },
        ...(orderInfo ? [{ headerName: t('Cost'), field: "cost", valueFormatter: params => params.value.toFixed(2),  type: 'rightAligned' , width: 100 }] : []),
        ...(showRemoveButton ? [{ headerName: '', field: "productNumber", cellRenderer: DeleteButton,  width: 60, resizable: false  }] : []),
    ]
    return (
        <div className="h-full w-full">
            <div className='flex-initial ag-theme-quartz w-full h-5/6'>
                <AgGridReact
                    gridOptions={gridOptions}
                    columnDefs={columnDefsSumary}
                    rowData={productList}>
                </AgGridReact>
            </div>
            <div className='w-full h-1/6 py-4 text-right grid grid-cols-4'>
                <div className='col-span-2'></div>
                <div class="grid grid-cols-1 gap-x-4"> 
                    {orderInfo && (<>
                        <span className="flex">
                            <span className='text-right mr-3 w-1/2'>{t('Gross Weight')}:</span><span className='text-right grow'>{grossWeight.toFixed(2)}</span>
                        </span>
                        <span className="flex">
                            <span className='text-right mr-3 w-1/2'>{t('Net Weight')}:</span><span className='text-right grow'>{netWeight.toFixed(2)}</span>
                        </span>
                        <span className="flex">
                            <span className='text-right mr-3 w-1/2'>{t('Margin')}:</span><span className='text-right grow'>{margin.toFixed(2)}</span>
                        </span>
                    </>)}
                </div>
                <div class="grid grid-cols-1 text-right">
                    <span className="flex">
                        <span className='text-right mr-3 w-1/2'>{t('Sub total')}:</span><span className='text-right grow'>{subTotal.toFixed(2)}</span>
                    </span>
                    <span className="flex">
                        <span className='text-right mr-3 w-1/2'>{t('Tax')}:</span><span className='text-right grow'>{tax.toFixed(2)}</span>
                    </span>
                    <span className="flex">
                        <span className='text-right mr-3 w-1/2'>{t('Total')}:</span><span className='text-right grow'>{total.toFixed(2)}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default OrderSummary;
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-quartz.css';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { verifyValidData } from '../../utils/orderUtils';

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





function OrderSummary({ productList, setProductList, showRemoveButton, orderInfo, orderNote, setOrderNote }) {
    const { t, i18n } = useTranslation()
    const [subTotal, setSubTotal] = useState(0.0)
    const [tax, setTax] = useState(0.0)
    const [total, setTotal] = useState(0.0)
    const [netWeight, setNetWeight] = useState(0.0)
    const [grossWeight, setGrossWeight] = useState(0.0)
    const [margin, setMargin] = useState(0.0)

    function removeItem(itemToRemove) {
        const newProductList = productList.filter(product => {
            return product.index != itemToRemove
        })
        setProductList(newProductList)
    }

    function updateQuantity(index, qty) {
        console.log(`ngsh index qty ${index}`)
        const newProductList = productList.map((it) => {
            if(it.index === index) {
                console.log(`ngsh index qty ${it}`)
                let copy = it
                if(it.catchWeightMax) {
                    let caseQty = Math.ceil(qty / it.catchWeightMax);
                    copy.note = `Grab ${caseQty} ${caseQty === 1.0 ? 'case' : 'cases' }.`
                }
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
        
        <span className="actionIcons">
                <button onClick={() => { removeItem(props.value)}} title={t('Remove')}><FontAwesomeIcon icon={faXmark} /></button>
         </span>
        </>)
    }

    const QuantityTextField = props => {
        const [qty, setQty] = useState(props.value.quantity)

        function handleBlur(event) {
            const numberQty = parseFloat(qty)
            if(!verifyValidData(numberQty, 1)) {
                updateQuantity(props.value.index, qty)
            } else {
                setQty(props.value.quantity)
            }
        }

        return(
            <>
            <input id='itemQty' className='text-right w-full' disabled={!showRemoveButton} value={qty} onBlur={handleBlur} onChange={(e) => {setQty(e.target.value)}}/>
            </>
        )
    }

    const PriceTextField = props => {
        const [price, setPrice] = useState(props.value.price)

        function handleBlur(event) {
            const numberPrice = parseFloat(price)
            if(!verifyValidData(1, numberPrice)) {
                updatePrice(props.value.index, price)
            } else {
                setPrice(props.value.price)
            }
        }

        return(
            <>
            <input id='itemPrice' className='text-right w-full' disabled={!showRemoveButton} value={price.toLocaleString('en-US', {minimumFractionDigits:2})} onBlur={handleBlur} onChange={(e) => {setPrice(e.target.value)}}/>
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
                const itemWeightCW = element.catchWeightMax ? Math.ceil(element.quantity / element.catchWeightMax) * element.catchWeightMax : null;
                console.log('elemnt weight',element.weight);
                subTotalAux += element.quantity * element.price
                grossWeightAux += itemWeightCW ? itemWeightCW : element.quantity * element.weight
                netWeightAux += itemWeightCW ? itemWeightCW : element.quantity * element.weight
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
        { headerName: t('Product ID'), field: "productNumber", width: 100 },
        { headerName: t('Name'), field: "productName", flex: 2 },
        { headerName: t('Chinese Name'), field: "chineseName", flex: 2},
        { headerName: t('Quantity'), valueGetter: (p) => p.data, cellRenderer: QuantityTextField, width: 90  },
        { headerName: t('UOM'), field: "uom", width: 80 },
        { headerName: t('Note'), field: "note", flex: 2 },
        { headerName: t('Unit Price'), valueGetter: (p) => p.data, cellRenderer: PriceTextField,  type: 'rightAligned' , width: 100   },
        { headerName: t('Total Price'), valueGetter: (p) => (p.data.price * p.data.quantity).toLocaleString('en-US', {minimumFractionDigits:2}),  type: 'rightAligned', width: 100   },
        ...(orderInfo ? [{ headerName: t('Cost'), field: "cost", valueFormatter: params => params.value.toLocaleString('en-US', {minimumFractionDigits:2}),  type: 'rightAligned' , width: 100 }] : []),
        ...(showRemoveButton ? [{ headerName: '', field: "index", cellRenderer: DeleteButton,  width: 60, resizable: false  }] : []),
    ]
    return (
        <div className="h-full w-full">
            <div className='flex-initial ag-theme-quartz w-full h-5/6'>
                <AgGridReact
                    suppressDragLeaveHidesColumns={true}
                    gridOptions={gridOptions}
                    columnDefs={columnDefsSumary}
                    rowData={productList}>
                </AgGridReact>
            </div>
            <div className='w-full h-1/6 py-4 text-right grid grid-cols-4'>
                <div className='col-span-2'>
                    {setOrderNote && <div className='flex flex-col flex-initial w-full'>
                        <span className="text-right mr-3 self-center">{t('Order Note')}:</span>
                        <textarea id='orderNote' value={orderNote} onChange={(e) => { setOrderNote(e.target.value) }} placeholder={t('Order Note')} className='flex-auto border rounded-lg py-1 px-2 mx-1 resize-none' type='text'></textarea>
                    </div>}
                </div>
                <div className="grid grid-cols-1 gap-x-4"> 
                    <>
                        <span className="flex">
                            <span className='text-right mr-3 w-1/2'>{t('Gross Weight')}:</span><span className='text-right grow'>{grossWeight.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                        </span>
                        <span className="flex">
                            <span className='text-right mr-3 w-1/2'>{t('Net Weight')}:</span><span className='text-right grow'>{netWeight.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                        </span>
                        {orderInfo && (<span className="flex">
                            <span className='text-right mr-3 w-1/2'>{t('Margin')}:</span><span className='text-right grow'>${((margin/100) * total).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                            <span className='text-right grow'>({margin.toLocaleString('en-US', {minimumFractionDigits:2})}%)</span>
                        </span>)}
                    </>
                </div>
                <div className="grid grid-cols-1 text-right">
                    <span className="flex">
                        <span className='text-right mr-3 w-1/2'>{t('Sub total')}:</span><span className='text-right grow'>${subTotal.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                    </span>
                    <span className="flex">
                        <span className='text-right mr-3 w-1/2'>{t('Tax')}:</span><span className='text-right grow'>${tax.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                    </span>
                    <span className="flex">
                        <span className='text-right mr-3 w-1/2'>{t('Total')}:</span><span className='text-right grow'>${total.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default OrderSummary;
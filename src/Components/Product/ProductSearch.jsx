import { useEffect, useRef, useState } from 'react';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown } from 'primereact/dropdown';
import { showError } from '../../slices/errorSlice';
import { verifyValidData } from '../../utils/orderUtils';

function ProductSearch({ selectedProduct, setProductToAdd, setFilteredProductList, productList, focusedElement, setFocusedElement, selectCurrentProduct, predefinedQty }) {
    const [productName, setProductName] = useState("");
    const [productQty, setProductQty] = useState("");
    const [productUom, setProductUom] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productNote, setProductNote] = useState("");
    const { t, i18n } = useTranslation()
    const dc = useSelector(state => state.distributionCenter.value)
    const priceTiers = useSelector(state => state.cache.priceTiers)
    const priceTiersByCategory = useSelector(state => state.cache.priceTiersByCategory)
    const customerState = useSelector(state => state.customer.value)
    const errorState = useSelector(state => state.error.value.showError)
    const catchWeight = useRef(1.0)
    const dispatch = useDispatch();
    const [productPrices, setProductPrices] = useState(null)
    const [notePlaceHolder, setNotePlaceHolder] = useState(t('Note'))

    const [catchWeightMax, setCatchWeightMax] = useState(null);

    const [cwQty, setCwQty] = useState("");

    const qtyRef = useRef(null)
    const priceRef = useRef(null)
    const noteRef = useRef(null)
    const addRef = useRef(null)
    const numRef = useRef(null)
    // const [addProductMode, setAddProductMode] = useState(false) // hitting Enter on the add product was firing the enter on the product name, so a hack around it

    useEffect(() => {
        if(predefinedQty !== null) {
            setProductQty(predefinedQty)
            console.log(qtyRef)
        }
    },[predefinedQty])

    // useEffect(() => {
    //     if(!errorState) {
    //         const lastElement = focusedElement
    //         setFocusedElement('')
    //         console.log('this is dismissed')
    //         setFocusedElement(lastElement)
    //     }
    // }, [errorState])

    useEffect(() => {
        console.log(selectedProduct)
        if(selectedProduct !== null) {
            let priceSetByCategory = false
            setProductPrice(selectedProduct.price)
            let priceTiersList = [];
            const filteredPrices = priceTiers.find((price) => {
                return price.productNumber === selectedProduct.id
            })
            const productTreeIdsFromSelectedProduct = selectedProduct.productTreeId ? selectedProduct.productTreeId.split(',').map((it) => parseInt(it)) : undefined
            const filteredPricesByCategory = priceTiersByCategory.filter( (pr) => productTreeIdsFromSelectedProduct ? productTreeIdsFromSelectedProduct.includes(pr.productTreeId) : false)
            if (filteredPricesByCategory && filteredPricesByCategory.length > 0) {
                filteredPricesByCategory.sort((a,b)=> a.markupPercent - b.markupPercent)
                const priceTiersByCategory = filteredPricesByCategory.map((pr) => {
                    const title = pr.name.split('-')
                    return {
                        price: selectedProduct.price + (selectedProduct.price * pr.markupPercent),
                        title: title.length > 2 ? title[2] : pr.name
                    }
                })
                priceTiersList = [...priceTiersList, ...priceTiersByCategory]

                let defaultProductPrice = selectedProduct.price

                if(customerState) {
                    const defaultPriceTierForCustomer = filteredPricesByCategory.find((pr) => pr.customerGroup === customerState.defaultAccountGroup)
                    if(defaultPriceTierForCustomer) {
                        defaultProductPrice += defaultProductPrice * defaultPriceTierForCustomer.markupPercent
                    } else {
                        defaultProductPrice += defaultProductPrice * filteredPricesByCategory[filteredPricesByCategory.length - 1].markupPercent
                    }
                    priceSetByCategory = true;
                } else {
                    defaultProductPrice += defaultProductPrice * filteredPricesByCategory[filteredPricesByCategory.length - 1].markupPercent
                    priceSetByCategory = true;
                }
                setProductPrice(defaultProductPrice)
            }
            if (filteredPrices) {
                const priceTiersByProduct = filteredPrices.prices.map((pr,i) => {
                    const title = filteredPrices.titles[i].split('-')
                    return {
                        price: pr,
                        title: filteredPrices.titles[i]
                    }
                })
                let defaultProductPrice = selectedProduct.price
                if(!priceSetByCategory) {
                    if(customerState) {
                        const defaultPriceTierForCustomer = filteredPrices.customerGroups.findIndex((cg) => cg === customerState.defaultAccountGroup)
                        if(defaultPriceTierForCustomer !== -1) {
                            defaultProductPrice = filteredPrices.prices[defaultPriceTierForCustomer]
                        } else {
                            defaultProductPrice = filteredPrices.prices[filteredPrices.prices.length - 1]
                        }
                    } else {
                        defaultProductPrice = filteredPrices.prices[filteredPrices.prices.length - 1]
                    }
                }
                setProductPrice(defaultProductPrice)
                priceTiersList = [...priceTiersList, ...priceTiersByProduct]
            }

            setProductPrices(priceTiersList)
            // qtyRef?.current?.select()
        }
    }, [selectedProduct, setProductPrices, priceTiers, customerState, setProductPrice])

const [editingQty, setEditingQty] = useState(false);

    useEffect(() => {
        if (selectedProduct != null) {
            setProductName(selectedProduct.description)
            setProductUom(selectedProduct.unitOfMeasure)
            // setProductPrice(selectedProduct.price)
            if (isCatchWeight(selectedProduct)) {
                const numberCatchWeight = parseFloat(getMaxCatchWeight(selectedProduct))
                if (numberCatchWeight) {
                    catchWeight.current = numberCatchWeight
                    setCatchWeightMax(numberCatchWeight)
                }
                let floatProductQty = parseFloat(productQty);
                if(!isNaN(floatProductQty)) {
                    setProductNote(`Grab ${isNaN(floatProductQty) ? 0.0 : floatProductQty } ${floatProductQty === 1.0 ? 'case' : 'cases' }.`)
                }
                setProductUom("Cs")
            } else {
                setProductNote("")
                catchWeight.current = 1.0
                setCatchWeightMax(null)
            }
            if(!editingQty) {
                qtyRef?.current?.select()
            }
        }
    }, [selectedProduct, productPrices, setProductName, setProductUom, setProductPrice, productQty, setProductNote])

    function filterProducts(inputFilter) {
        const filter = inputFilter.toLowerCase()
        let result = productList.filter(x => x.locationgroupid === dc.id).filter((product) => {
            return (
                product.num.toLowerCase().includes(filter) ||
                product.description.toLowerCase().includes(filter) ||
                product.chineseName.includes(filter)
            );
        });

        setFilteredProductList(result);
    }

    function getMaxCatchWeight(product) {
        if (product === null || product === undefined) {
            return null
        }
        const productCatchWeight = searchCustomFieldValue(product.customFieldsMap, "Max Catch Weight")
        return productCatchWeight
    }

    function isCatchWeight(product) {
        if (product === null || product === undefined) {
            return false
        }
        const productStyle = searchCustomFieldValue(product.customFieldsMap, "Style")
        return productStyle === "By Catch Weight"
    }

    function searchCustomFieldValue(customFields, fieldToSearch) {
        for (const field in customFields) {
            const auxField = customFields[field];
            if (auxField.name === fieldToSearch) {
                return auxField.value
            }
        }
        return null
    }

    function addProduct() {
        const numberQty = parseFloat(productQty)
        const numberPrice = parseFloat(productPrice)
        const chekInvalidData = verifyValidData(numberQty, numberPrice)
        const availableQty = (selectedProduct.inventory - (selectedProduct.qtynotavailable + selectedProduct.qtyallocated))
        let errorMessage = '';
        let errorTitle = '';
        if(chekInvalidData) {
            switch(chekInvalidData) {
                case 'qty':
                    setFocusedElement('qty')
                    errorMessage = t('Please input a valid quantity amount.')
                    errorTitle = t('Invalid Quantity')
                    break;
                case 'price':
                    setFocusedElement('price')
                    errorMessage = t('Please input a valid price amount.')
                    errorTitle = t('Invalid Price')
                    break;
            }
            dispatch(
                showError(
                    {
                        errorTile: errorTitle,
                        errorBody: errorMessage,
                        errorButton: t('ok'),
                        showError: true,
                    }
                )
            )
        } else {
            if (numberQty > availableQty) {
                dispatch(
                    showError(
                        {
                            errorTile: t('Invalid Quantity'),
                            errorBody: t('The quantity exceeds the inventory available for this product, please verify in order summary, available inventory: ') + availableQty,
                            errorButton: t('ok'),
                            showError: true,
                        }
                    )
                )
            }
            setProductToAdd({
                productName: productName,
                productNumber: selectedProduct.num,
                chineseName: selectedProduct.chineseName,
                quantity: (parseFloat(productQty) ?? 0) * catchWeight.current,
                uom: selectedProduct.unitOfMeasure,
                price: (parseFloat(productPrice) ?? 0.0),
                note: productNote,
                weight: selectedProduct.weight,
                cost: selectedProduct.cost,
                catchWeightMax: catchWeightMax,
            })
            setProductName("")
            setProductQty("")
            setProductUom("")
            setProductPrice("")
            setProductNote("")
            // setFocusedElement('productNum')
        }
        // setAddProductMode(true)
    }

    function handleOnFocus(element) {
        setFocusedElement(element)
    }

    useEffect(() => {
        if(!errorState) {
            console.log("ngsh focused element", focusedElement)
            switch (focusedElement) {
                case 'productNum':
                    console.log('ngsh productNum is focused')
                    numRef?.current?.focus()
                    break;
                case 'qty':
                    console.log('ngsh qty is focused')
                    setEditingQty(false);
                    qtyRef?.current?.focus()
                    qtyRef?.current?.select()
                    console.log(qtyRef)
                    // if(!productQty) {
                    //     setProductQty(1);
                    // }
                    break;
                case 'price':
                    console.log('ngsh price is focused')
                    priceRef?.current?.focus()
                    priceRef?.current?.select()
                    break;
                case 'note':
                    console.log('ngsh note is focused')
                    noteRef?.current?.focus()
                    break;
                case 'add':
                    console.log('ngsh add is focused')
                    addRef?.current?.focus()
                    break;
                default:
                    break;
            }
        }
    }, [focusedElement, errorState])

    function productNameKeyPress(e) {
        if (e.key === 'Enter' && enableEnterAction) {  
            // if (!addProductMode) {
                selectCurrentProduct(); 
                // handleOnFocus('qty') 
            // } else {
                // setAddProductMode(false);
            // }
        }
    }

    useEffect(() => {
        calculateCWQty()
    }, [productQty])



    function calculateCWQty() {
        const numQty = parseFloat(productQty);
        if(!isNaN(numQty)) {
            setCwQty((numQty * catchWeightMax) + " " + selectedProduct?.unitOfMeasure);
        }
    }

    const [enableEnterAction, setEnableEnterAction] = useState(false);

    function onKeyDown(e) {
        if (e.key === 'Enter') { 
            setEnableEnterAction(true)
        }
    }

    
    function onKeyUp(e, nextFocus) {

        if (e.key === 'Enter' && enableEnterAction) { 
            setEnableEnterAction(false)
            handleOnFocus(nextFocus)
            if('productNum' === nextFocus) {
                addProduct()
            }
        }
    }

    return (
        <div className="flex space-x-1 my-1">
            <div className="flex-auto">
                <div className="flex space-x-1">
                    <input ref={numRef} autoFocus onKeyDown={(e) => {onKeyDown(e)}} onFocus={(e) => {handleOnFocus("productNum"); e.target.select();}} onKeyUp={productNameKeyPress} autoComplete='off' onChange={(e) => { filterProducts(e.target.value); setProductName(e.target.value); }} value={productName} className="inputBox grow" type="text" placeholder={t("Product")} id="productSearch"></input>
                    <input onKeyDown={(e) => {onKeyDown(e)}}  onChange={(e) => { setProductQty(e.target.value); setEditingQty(true); }} onKeyUp={(e) => { onKeyUp(e, 'price') }} onFocus={(e) => { handleOnFocus('qty'); e.target.select(); }} ref={qtyRef} autoComplete='off' value={productQty} className="inputBox w-32" placeholder={t("Qty")} id="productQty"></input>
                    <input onChange={(e) => { setProductUom(e.target.value) }} disabled={true} onFocus={() => { handleOnFocus('uom') }} autoComplete='off' value={productUom} className="inputBox w-32" type="text" placeholder={t("UOM")} id="productUom"></input>
                    <input onKeyDown={(e) => {onKeyDown(e)}}  ref={priceRef} autoComplete='off' onChange={(e) => { setProductPrice(e.target.value) }} onKeyUp={(e) => { onKeyUp(e, 'productNum'); }} onFocus={(e) => { handleOnFocus('price'); e.target.select(); }} value={productPrice} list='priceList' className="inputBox w-32"   placeholder={t("Price")} id="productPrice" />
                    <datalist id='priceList'>
                        {
                            productPrices !== null && productPrices !== undefined && productPrices.map((it, i) => {
                                return (<option value={it.price} key={i}>{it.price.toFixed(2) + " - " + it.title}</option>);
                            })
                        }
                    </datalist>
                </div>
                <div className="flex space-x-1 mt-2">
                    <input ref={noteRef} onChange={(e) => { setProductNote(e.target.value) }} onKeyDown={(e) => {onKeyDown(e)}}  onKeyUp={(e) => { onKeyUp(e, 'productNum');  }} autoComplete='off' onFocus={() => { handleOnFocus('note') }} value={productNote} className="inputBox flex-auto" type="text" placeholder={notePlaceHolder} id="productNote"></input>
                </div>
            </div>
            <div className='space-y-2.5 flex-col'>
                <button ref={addRef} onClick={() => { addProduct() }} className="primary-button h-min">{t("Add Product")}</button>
                {catchWeightMax && <input disabled={true} autoComplete='off' value={cwQty} className="inputBox w-32" type="text" placeholder={t("CW Qty")} id="cwQty"></input>}
            </div>
        </div>
    );
}

export default ProductSearch;
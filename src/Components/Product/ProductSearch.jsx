import { useEffect, useRef, useState } from 'react';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Dropdown } from 'primereact/dropdown';

function ProductSearch({ selectedProduct, setProductToAdd, setFilteredProductList, productList, focusedElement, setFocusedElement, selectCurrentProduct }) {
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
    const catchWeight = useRef(1.0)
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
        if(selectedProduct !== null) {
            let priceTiersList = [];
            const filteredPrices = priceTiers.find((price) => {
                return price.productNumber === selectedProduct.id
            })
            const filteredPricesByCategory = priceTiersByCategory.filter( (pr) => pr.productTreeId === selectedProduct.productTreeId)
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
                } else {
                    defaultProductPrice += defaultProductPrice * filteredPricesByCategory[filteredPricesByCategory.length - 1].markupPercent
                }
                setProductPrice(defaultProductPrice)
            } else {
                setProductPrice(selectedProduct.price)
            }
            if (filteredPrices) {
                const priceTiersByProduct = filteredPrices.prices.map((pr,i) => {
                    const title = filteredPrices.titles[i].split('-')
                    return {
                        price: pr,
                        title: filteredPrices.titles[i]
                    }
                })
                priceTiersList = [...priceTiersList, ...priceTiersByProduct]
            }

            setProductPrices(priceTiersList)
        }
    }, [selectedProduct, setProductPrices, priceTiers, customerState, setProductPrice])



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
        // setAddProductMode(true)
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
        })
        setProductName("")
        setProductQty("")
        setProductUom("")
        setProductPrice("")
        setProductNote("")
        setFocusedElement('productNum')
    }

    function handleOnFocus(element) {
        setFocusedElement(element)
    }

    useEffect(() => {
        switch (focusedElement) {
            case 'productNum':
                console.log('ngsh productNum is focused')
                numRef?.current?.focus()
                break;
            case 'qty':
                console.log('ngsh qty is focused')
                qtyRef?.current?.focus()
                if(!productQty) {
                    setProductQty(1);
                }
                break;
            case 'price':
                console.log('ngsh price is focused')
                priceRef?.current?.focus()
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
    }, [focusedElement])

    function productNameKeyPress(e) {
        if (e.key === 'Enter') {  
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

    return (
        <div className="flex space-x-1 my-1">
            <div className="flex-auto">
                <div className="flex space-x-1">
                    <input ref={numRef} autoFocus onFocus={() => {handleOnFocus("productNum")}} onKeyUp={productNameKeyPress} autoComplete='off' onChange={(e) => { filterProducts(e.target.value); setProductName(e.target.value); }} value={productName} className="inputBox grow" type="text" placeholder={t("Product")} id="productSearch"></input>
                    <input onChange={(e) => { setProductQty(e.target.value) }} onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('price') } }} onFocus={() => { handleOnFocus('qty') }} ref={qtyRef} autoComplete='off' value={productQty} className="inputBox w-32" type="text" placeholder={t("Qty")} id="productQty"></input>
                    <input onChange={(e) => { setProductUom(e.target.value) }} disabled={true} onFocus={() => { handleOnFocus('uom') }} autoComplete='off' value={productUom} className="inputBox w-32" type="text" placeholder={t("UOM")} id="productUom"></input>
                    <input ref={priceRef} autoComplete='off' onChange={(e) => { setProductPrice(e.target.value) }} onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('productNum'); addProduct(); } }} onFocus={() => { handleOnFocus('price') }} value={productPrice} list='priceList' className="inputBox w-32" type="text" placeholder={t("Price")} id="productPrice" />
                    <datalist id='priceList'>
                        {
                            productPrices !== null && productPrices !== undefined && productPrices.map((it, i) => {
                                return (<option value={it.price} key={i}>{it.price.toFixed(2) + " - " + it.title}</option>);
                            })
                        }
                    </datalist>
                </div>
                <div className="flex space-x-1 mt-2">
                    <input ref={noteRef} onChange={(e) => { setProductNote(e.target.value) }} onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('add') } }} autoComplete='off' onFocus={() => { handleOnFocus('note') }} value={productNote} className="inputBox flex-auto" type="text" placeholder={notePlaceHolder} id="productNote"></input>
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
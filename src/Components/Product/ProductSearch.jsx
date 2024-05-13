import { useEffect, useRef, useState } from 'react';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Dropdown } from 'primereact/dropdown';

function ProductSearch({ selectedProduct, setProductToAdd, setFilteredProductList, productList, focusedElement, setFocusedElement }) {
    const [productName, setProductName] = useState("");
    const [productQty, setProductQty] = useState("");
    const [productUom, setProductUom] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productNote, setProductNote] = useState("");
    const { t, i18n } = useTranslation()
    const dc = useSelector(state => state.distributionCenter.value)
    const priceTiers = useSelector(state => state.cache.priceTiers)
    const catchWeight = useRef(1.0)
    const [productPrices, setProductPrices] = useState(null)

    const qtyRef = useRef(null)
    const priceRef = useRef(null)
    const noteRef = useRef(null)
    const addRef = useRef(null)
    const numRef = useRef(null)



    useEffect(() => {
        if (selectedProduct != null) {
            setProductName(selectedProduct.description)
            setProductUom(selectedProduct.unitOfMeasure)
            setProductPrice(selectedProduct.price)
            const filteredPrices = priceTiers.find((price) => {
                return price.productNumber === selectedProduct.id
            })
            setProductPrices(filteredPrices)
        }
    }, [selectedProduct, setProductPrices, productPrices, setProductName, setProductUom, setProductPrice])
    console.log(selectedProduct)
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
    useEffect(() => {
        if (isCatchWeight(selectedProduct)) {
            const numberCatchWeight = parseFloat(getMaxCatchWeight(selectedProduct))
            if (numberCatchWeight) {
                catchWeight.current = numberCatchWeight
            }
            setProductNote("By Catch Weight, Max " + getMaxCatchWeight(selectedProduct) + " " + selectedProduct.unitOfMeasure)
        } else {
            setProductNote("")
            catchWeight.current = 1.0
        }
    }, [selectedProduct, setProductNote])

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
        setProductToAdd({
            productName: productName,
            productNumber: selectedProduct.num,
            chineseName: selectedProduct.chineseName,
            quantity: parseFloat(productQty) ?? 0,
            uom: productUom,
            price: (parseFloat(productPrice) ?? 0.0) * catchWeight.current,
            note: productNote,
            weight: catchWeight.current === 1 ? selectedProduct.weight : catchWeight.current,
            cost: selectedProduct.cost,
        })
        setProductName("")
        setProductQty("")
        setProductUom("")
        setProductPrice("")
        setProductNote("")
        setFocusedElement('productNum')
        filterProducts("")
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

    return (
        <div className="flex space-x-1 my-1">
            <div className="flex-auto">
                <div className="flex space-x-1">
                    <input ref={numRef} autoFocus onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('qty') } }} onFocus={() => { handleOnFocus('productNum') }} autoComplete='off' onChange={(e) => { filterProducts(e.target.value); setProductName(e.target.value); }} value={productName} className="inputBox grow" type="text" placeholder={t("Product")} id="productSearch"></input>
                    <input onChange={(e) => { setProductQty(e.target.value) }} onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('price') } }} onFocus={() => { handleOnFocus('qty') }} ref={qtyRef} autoComplete='off' value={productQty} className="inputBox w-32" type="text" placeholder={t("Qty")} id="productQty"></input>
                    <input onChange={(e) => { setProductUom(e.target.value) }} disabled={true} onFocus={() => { handleOnFocus('uom') }} autoComplete='off' value={productUom} className="inputBox w-32" type="text" placeholder={t("UOM")} id="productUom"></input>
                    <input ref={priceRef} onChange={(e) => { setProductPrice(e.target.value) }} onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('note') } }} onFocus={() => { handleOnFocus('price') }} value={productPrice} list='priceList' className="inputBox w-32" type="text" placeholder={t("Price")} id="productPrice" />
                    <datalist id='priceList'>
                        {
                            productPrices !== null && productPrices != undefined && productPrices.prices.map((it, i) => {
                                return (<option value={it} key={i}>{it.toFixed(2) + " - " + productPrices.titles[i]}</option>);
                            })
                        }
                    </datalist>
                </div>
                <div className="flex space-x-1 mt-2">
                    <input ref={noteRef} onChange={(e) => { setProductNote(e.target.value) }} onKeyUp={(e) => { if (e.key === 'Enter') { handleOnFocus('add') } }} autoComplete='off' onFocus={() => { handleOnFocus('note') }} value={productNote} className="inputBox flex-auto" type="text" placeholder={t("Note")} id="productNote"></input>
                </div>
            </div>
            <button ref={addRef} onClick={() => { addProduct() }} className="primary-button h-min">{t("Add Product")}</button>
        </div>
    );
}

export default ProductSearch;
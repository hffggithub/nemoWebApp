export function consolidateLineItemsData(items, productsCache) {
    
    const soItems = items.map((it, index) => {
        const productInCache = productsCache.find((prod) => {
            return it.productNumber === prod.num
        })
        console.log(productInCache)
        const catchWeight =  productInCache ? searchCustomFieldValue(productInCache?.customFieldsMap, 'Max Catch Weight') : null
        console.log('catchweight prod', catchWeight)
        return ({
            index: index,
            productName: productInCache?.description ?? it.productName,
            productNumber: productInCache?.num ?? it.productNumber,
            chineseName: productInCache?.chineseName ?? '',
            quantity: it.quantity,
            uom: productInCache?.unitOfMeasure ?? it.uom,
            price: it.price,
            note: it.note ?? '',
            weight: productInCache?.weight ?? 0.0,
            cost: productInCache?.cost ?? 0.0,
            lineItemNumber: it.lineItemNumber ?? null,
            catchWeightMax: catchWeight,
            status: it.statusId ?? undefined,
        })
    })

    return soItems;
}



export function searchCustomFieldValue(customFields, fieldToSearch) {
    for (const field in customFields) {
        const auxField = customFields[field];
        if (auxField.name === fieldToSearch) {
            return auxField.value
        }
    }
    return null
}

export function verifyValidData(qty, price) {
    if (isNaN(qty) || qty < 1.0){
        return 'qty'
    } else if( isNaN(price) || price < 0.0) {
        return 'price'
    }
    return undefined
}
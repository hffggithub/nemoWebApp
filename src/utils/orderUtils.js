export function consolidateLineItemsData(items, productsCache) {
    
    const soItems = items.map((it, index) => {
        const productInCache = productsCache.find((prod) => {
            return it.productNumber === prod.num
        })
        console.log(productInCache)
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
            cost: productInCache.cost ?? 0.0,
        })
    })

    return soItems;
}
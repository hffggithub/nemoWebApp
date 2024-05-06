import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { clearSelectedCustomer } from "../../slices/customerSlice";

function CustomerInfo({ customer, setCustomerShippingAddress, showCustomerAddress }) {

    const { t } = useTranslation()
    const dispatch = useDispatch();
    const [street, setStreet] = useState(customer.shippingAddress.street)
    const [city, setCity] = useState(customer.shippingAddress.city)
    const [state, setState] = useState(customer.shippingAddress.state)
    const [zip, setZip] = useState(customer.shippingAddress.zip)
    const [country, setCountry] = useState(customer.shippingAddress.country)
    const [toLine, setToLine] = useState(customer.shippingAddress.toLine)
    const [description, setDescription] = useState(customer.shippingAddress.description)
    const [customerAddresses, setCustomerAddresses] = useState(customer.addresses)
    const [modifyAddress, setModifyAddress] = useState(false)

    useEffect(() => {
        setCustomerShippingAddress(
            {
                "street": street,
                "city": city,
                "state": state,
                "zip": zip,
                "country": country,
                "toLine": toLine,
                "description": description,
            }
        )
    }, [street, city, state, zip, country, toLine, description, setCustomerShippingAddress])


    function changeCustomerAddress(index) {
        const address = customerAddresses[index]
        setStreet(address.street)
        setCity(address.city)
        setState(address.state)
        setCountry(address.country)
        setZip(address.zip)
        setDescription(address.description)
        setToLine(address.toLine)
    }

    return (
        <>
            <div className="w-full h-full p-1 px-3 flex flex-col">
                <div className="flex flex-initial flex-row">
                    <h1 className="flex-auto self-center text-center">{t('Customer info')}:</h1>
                </div>
                <div className="flex flex-initial flex-row">
                    <div className="flex flex-wrap justify-evenly space-x-1">
                        <span className="flex-auto">{t('Id')}: {customer.number}</span>
                        <span className="flex-auto">{t('Name')}: {customer.name}</span>
                        <span className="flex-auto">{t('Contact')}: {customer.contactName}</span>
                        <span className="flex-auto">{t('Phone Number')}: {customer.contactNumber}</span>
                    </div>
                    <div className="flex flex-initial px-1">
                        <button onClick={() => { dispatch(clearSelectedCustomer()) }} className="primary-button rounded-lg p-1 text-center">{t('Change')}</button>
                    </div>
                </div>
                <div className="flex flex-initial flex-row">
                    <h1 className="flex-auto self-center text-center">{t('Shipping Address')}:</h1>
                </div>
                <div className="flex flex-initial flex-row">
                    <select onChange={(e) => { changeCustomerAddress(e.target.value) }} className="flex-auto w-full border rounded-lg py-1" id="addressSelect" defaultValue={customer.shippingAddress}>
                        {customerAddresses.map((it, i) => {
                            return (<option key={i} value={i}>{`${it.street}, ${it.city}, ${it.state}, ${it.country}, ${it.zip}`}</option>)
                        })}
                    </select>
                </div>
            </div>
            {/* <div className="w-full h-full p-1 px-3" >
                <div className="flex items-center">
                    <h1 className="flex-auto self-center text-center">{t('Customer info')}:</h1>
                </div>
                <div className="flex flex-wrap justify-evenly space-x-1">
                    <span className="flex-auto">{t('Id')}: {customer.number}</span>
                    <span className="flex-auto">{t('Name')}: {customer.name}</span>
                    <span className="flex-auto">{t('Contact')}: {customer.contactName}</span>
                    <span className="flex-auto">{t('Phone Number')}: {customer.contactNumber}</span>
                </div>
                <div>
                    
                <button onClick={() => { dispatch(clearSelectedCustomer()) }} className="primary-button rounded-lg p-1 text-center">{t('Change')}</button>
                </div>
                {showCustomerAddress &&

                    <div className="flex flex-initial space-y-1 flex-col">
                        <span className="flex-auto  self-center text-center">{t('Shipping Address')}:</span>
                        <div className="flex flex-initial space-x-1">
                            <select onChange={(e) => { changeCustomerAddress(e.target.value) }} className="flex-auto w-full border rounded-lg py-1" id="addressSelect" defaultValue={customer.shippingAddress}>
                                {customerAddresses.map((it, i) => {
                                    return (<option key={i} value={i}>{`${it.street}, ${it.city}, ${it.state}, ${it.country}, ${it.zip}`}</option>)
                                })}
                            </select>
                        </div>
                        {modifyAddress && <>

                            <div className="flex space-x-1">
                                <input onChange={(e) => { setStreet(e.target.value) }} value={street} className="border rounded-lg p-1 flex-auto" type="text" placeholder={t("Street")} id="address"></input>
                                <input onChange={(e) => { setCity(e.target.value) }} value={city} className="border rounded-lg p-1 flex-auto" type="text" placeholder={t("City")} id="city"></input>
                            </div>
                            <div className="flex space-x-1">
                                <input onChange={(e) => { setState(e.target.value) }} value={state} className="border rounded-lg p-1 flex-auto" type="text" placeholder={t("State")} id="state"></input>
                                <input onChange={(e) => { setCountry(e.target.value) }} value={country} className="border rounded-lg p-1 flex-auto" type="text" placeholder={t("Country")} id="country"></input>
                                <input onChange={(e) => { setZip(e.target.value) }} value={zip} className="border rounded-lg p-1 flex-auto" type="text" placeholder={t("ZIP")} id="zip"></input>
                            </div>
                        </>}
                    </div>
                }
            </div> */}
        </>
    )
}

export default CustomerInfo;
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { clearSelectedCustomer } from "../../slices/customerSlice";

function CustomerInfo({ customer, setCustomerShippingAddress, selectedShippingAddress, showCustomerAddress }) {

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
    const chineseName = customer.chineseName ? "- " + customer.chineseName : "";
    const [indexAddressSelected, setIndexAddressSelected] = useState(0);

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

    useEffect(() => {
        for(let i=0;i<customerAddresses.length; i++) {
            const address = customerAddresses[i]
            if(
                address.street === selectedShippingAddress.street &&
                address.city === selectedShippingAddress.city &&
                address.state === selectedShippingAddress.state &&
                address.country === selectedShippingAddress.country &&
                address.zip === selectedShippingAddress.zip
            ) {
                setIndexAddressSelected(i);
                break;
            }
        }
    }, [selectedShippingAddress])


    function changeCustomerAddress(index) {
        setIndexAddressSelected(index);
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
                <div className="flex-initial">
                    <div className="grid grid-cols-2 gap-y-2">
                        <div className="flex flex-initial flex-row center col-span-2">
                            <h1 className="flex-auto self-center text-center font-bold text-lg">{t('Customer')}: [{customer.number}] {customer.name} {chineseName}</h1>
                            <button onClick={() => { dispatch(clearSelectedCustomer()) }} className="primary-button rounded-lg p-1">{t('Change')}</button>
                        </div>
                        <span className="flex">
                            <span className="text-right mr-3 w-1/3 self-center">{t('Contact')}:</span><span className="">{customer.contactName}</span>
                        </span>
                        <span className="flex">
                            <span className="text-right mr-3 w-1/3 self-center">{t('Phone Number')}:</span><span className="">{customer.contactNumber}</span>
                        </span>
                        <span className="flex col-span-2 align-middle">
                            <span className="text-right mr-3 w-1/6 self-center">{t('Shipping Address')}:</span>
                            <span className="flex-grow">
                                <select onChange={(e) => { changeCustomerAddress(e.target.value) }} className="flex-auto w-full border rounded-lg py-1 px-3" id="addressSelect" value={indexAddressSelected}>
                                    {customerAddresses.map((it, i) => {
                                        return (<option key={i} value={i}>{`${it.street}, ${it.city}, ${it.state}, ${it.country}, ${it.zip}`}</option>)
                                    })}
                                </select>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}


export default CustomerInfo;

import { useLocalStorage } from "@uidotdev/usehooks";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { useDispatch } from "react-redux";
import { clearDistributionCenter } from "../../slices/distributionCenterSlice";
import hffLogoUrl from '../../assets/hffoods-logo.png'
import { clearSelectedCustomer } from "../../slices/customerSlice";
import { returnHome } from "../../slices/navSlice";
import { clearCache } from "../../slices/cacheSlice";

const navOptions = [
    {
        title: "New order",
        value: "order"
    },
    {
        title: "Order lookup",
        value: "lookup"
    }];

const lanugageOptions = [
    'en',
    'cn'
];

function Navbar({ setNavOption, navOption, distributionCenter, subclass, setDistributionCenter, setSubclass , setProductsOnOrder}) {
    const { t, i18n } = useTranslation();

    const [token, saveToken] = useLocalStorage("token", null);
    const [tryLogout, setTryLogout] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState('en');
    const dispatch = useDispatch();

    useEffect(() => {
        i18n.changeLanguage(activeLanguage);
    }, [activeLanguage]);

    
    useEffect(() => {
        const attemptLogout = async () => {
            try{
                const { data } = await axios.post(
                    import.meta.env.VITE_API_BASE_URL + "auth/logout",
                    {},
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                )
                if(data.wasSuccess) {
                    dispatch(clearDistributionCenter())
                    dispatch(clearSelectedCustomer())
                    dispatch(returnHome())
                    dispatch(clearCache())
                    setDistributionCenter(null);
                    setSubclass(null);
                    saveToken(null);
                    setProductsOnOrder([]);
                }
            } catch(ex) {
                console.log(ex)
            }
            setTryLogout(false)
    
        }
        if(tryLogout) {
            attemptLogout()
        }
    }, [tryLogout, token, setTryLogout, dispatch, clearDistributionCenter, clearSelectedCustomer, returnHome, clearCache]);

    return (
        <>
            <nav className="nav-bar">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto py-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <img src={hffLogoUrl} className="h-8" alt="HF Foods Logo" />
                        <span className="self-center text-2xl font-semibold whitespace-nowrap">HF Foods Group</span>
                        {/* {(token !== null && distributionCenter !== null && subclass !== null) && <ul className="flex flex-col font-medium mt-4 rounded-lg  md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
                            {navOptions.map((option, i) => {
                                return (
                                    <li key={i}>
                                        <button onClick={() => { setNavOption(option.value) }} className={"block "+ (option.value === navOption ? "nav-bar-option-selected" : "nav-bar-option")} aria-current="page">
                                            {t(option.title)}
                                        </button>
                                    </li>
                                )
                            }
                            )}
                        </ul> } */}
                    </div>
                    <div className="w-full md:block md:w-auto" id="navbar-solid-bg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            {(token !== null && distributionCenter !== null && subclass !== null) && <span className="self-center font-semibold whitespace-nowrap">{distributionCenter.name}:{subclass}</span> }
                            {token !== null && <button type="button" onClick={() => {setTryLogout(true)}} className="primary-button font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">{t('Logout')}</button>}
                            <select id="languagePref" className="border text-sm rounded-lg block w-full p-2.5" onChange={(e) => {setActiveLanguage(e.target.value);}} value={activeLanguage}>
                                {
                                    lanugageOptions.map((lanugage) => {
                                        return <option value={lanugage} key={lanugage}>{t(lanugage)}</option>
                                    })
                                }
                            </select>
                            {/* <button type="button" onClick={() => {changeLanguage()}} className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" >Change language</button> */}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar
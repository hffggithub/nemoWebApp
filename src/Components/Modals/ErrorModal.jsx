import { useTranslation } from 'react-i18next'
import { clearSelectedCustomer } from '../../slices/customerSlice'
import { hideError } from '../../slices/errorSlice'
import { returnHome, toScreen } from '../../slices/navSlice'
import { clearDistributionCenter } from '../../slices/distributionCenterSlice'
import { clearCache } from '../../slices/cacheSlice'
import { useSelector, useDispatch } from 'react-redux'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { clearOrderInContext } from '../../slices/orderSlice'

function ErrorModal({ title, body, dismissButtonTitle, dismissAction, setProductsOnOrder, setDistributionCenter, setSubclass }) {
    const { t } = useTranslation();
    const [token, saveToken] = useLocalStorage("token", null);
    const [tryLogout, setTryLogout] = useState(false);
    const dispatch = useDispatch()
    
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
                    dispatch(hideError())
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

    function dismissDecline() {
        dispatch(hideError())
        if(dismissAction === 'returnHome') {
            setProductsOnOrder([])
            dispatch(clearSelectedCustomer())
            dispatch(clearOrderInContext());
        }
        if(dismissAction === 'openOrder') {
            dispatch(toScreen('newOrder'))
        }
    }

    function dismissConfirm() {
        if(dismissAction === 'sessionExpired') {
            setTryLogout(true)
            return
        }
        dispatch(hideError())
        if(dismissAction === 'returnHome' || dismissAction === 'unsavedOrder') {
            setProductsOnOrder([])
            dispatch(clearSelectedCustomer())
            dispatch(clearOrderInContext())
        }
        
        if(dismissAction === 'openOrder') {
            dispatch(clearOrderInContext())
            dispatch(toScreen('newOrder'))
        }

    }

    function noActionDismiss() {
        dispatch(hideError())
        if(dismissAction === 'returnHome') {
            setProductsOnOrder([])
            dispatch(clearSelectedCustomer())
            dispatch(clearOrderInContext());
        }
        if(dismissAction === 'openOrder') {
            dispatch(clearSelectedCustomer())
            dispatch(clearOrderInContext())
            dispatch(returnHome())
        }
    }

    function shouldShowDeclineButton() {
        switch(dismissAction) {
            case 'unsavedOrder':
            case 'openOrder':
                return true
            default:
                return false
        }
    }

    return (
        <>
            <div className="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full modal-backdrop">
                <div className="relative p-4 w-full max-w-2xl max-h-full">
                    <div className="modal-background relative rounded-lg shadow ">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                            <h3 className="text-xl">
                                {title}
                            </h3>
                            <button type="button" onClick={() => { if(shouldShowDeclineButton()) {noActionDismiss()} else {dismissConfirm()} }} className="bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center">
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 md:p-5 space-y-4">
                            <p className="text-base leading-relaxed">
                                {body}
                            </p>
                        </div>

                        <div className="flex items-center p-4 md:p-5 border-t rounded-b">
                            {shouldShowDeclineButton() && <button type="button" onClick={() => { dismissDecline()} } className="primary-button mx-auto uppercase focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('no')}</button>}
                            <button type="button" onClick={() => { dismissConfirm()} } className="primary-button mx-auto uppercase focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center">{shouldShowDeclineButton() ? t('yes') : dismissButtonTitle}</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ErrorModal;
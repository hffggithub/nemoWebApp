import { useEffect, useState } from "react";
import axios from "../../providers/axiosProvider";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux'
import { clearSelectedCustomer } from '../../slices/customerSlice';
import { setDistributionCenter as setDistributionCenterRedux } from '../../slices/distributionCenterSlice';
import { fetchProducts } from "../../slices/cacheSlice";
import { clearSubclass, setSubclass as setSubclassRedux } from "../../slices/subclassSlice";

function DCSelector({ setDistributionCenter, setSubclass }) {
    const [token, saveToken] = useLocalStorage("token", null);

    const [selectedDC, setSelectedDC] = useState("");
    const [selectedSubclass, setSelectedSubclass] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [shouldFetch, setShouldFetch] = useState(true);
    const [dcList, setDcList] = useState([]);
    const [subclassList, setSubclassList] = useState([]);
    const [filteredSubclassList, setFilteredSubclassList] = useState([]);
    const [shouldFilterSubclassList, setShouldFilterSubclassList] = useState(true);
    const [savedUsername, saveUsername] = useLocalStorage("username", null);
    const { t } = useTranslation();

    const dispatch = useDispatch();


    useEffect(() => {
        async function fetchData() {
            if (shouldFetch) {
                setIsLoading(true)
                try {
                    let resultDC = await axios.get(
                        NEMO_API_HOST + "dc/getAllDCForUser?userName="+ savedUsername,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )
                    let resultSubclass = await axios.get(
                        NEMO_API_HOST + "dc/getAllSubclass",
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    )
                    const distributionCenters = resultDC.data
                    const subclasses = resultSubclass.data
                    if( distributionCenters) {
                        setDcList(distributionCenters)
                        setSelectedDC(distributionCenters[0].name)
                        dispatch(setDistributionCenterRedux(distributionCenters[0]))
                    }
                    if (subclasses) {
                        setSubclassList(subclasses)
                    }
                    setShouldFilterSubclassList(true)
                    setShouldFetch(false)
                    setIsLoading(false)
                    console.log(distributionCenters)
                } catch (ex) {
                    console.log("axios error ")
                    console.log(ex)
                }
                // const distributionCenters = ["DC1", "DC2", "DC3", "DC4"]
                // const subclasses = ["DC1:Sub1", "DC2:Sub2", "DC3:Sub3", "DC4:Sub4"]
            }
        }
        if (token !== null && shouldFetch) {
            fetchData()
        }

    }, [token, isLoading, shouldFetch, setIsLoading, setShouldFetch, setDcList, setSubclassList, setSelectedDC, setShouldFilterSubclassList])

    useEffect(() => {
        if(shouldFilterSubclassList) {
            const newFilteredList = 
            subclassList.filter(subclass => {
                return subclass.parent == selectedDC
            });
            setFilteredSubclassList(
                newFilteredList
            )
            if (newFilteredList.length > 0) {
                setSelectedSubclass(newFilteredList[0].name)
                dispatch(setSubclassRedux(newFilteredList[0]))
            } else {
                dispatch(clearSubclass())
                setSubclass(null)
            }
            setShouldFilterSubclassList(false)
        }
    }, [selectedDC, subclassList, shouldFilterSubclassList, dispatch, setSelectedSubclass, setFilteredSubclassList, clearSubclass, setSubclassRedux, filteredSubclassList, setSubclass, setShouldFilterSubclassList])

    function setSelectedDCandSubclass() {
        const dcFound = dcList.find(x => x.name === selectedDC);
        if(filteredSubclassList.length > 0) {
            const subclassFound = filteredSubclassList.find(x => x.name === selectedSubclass)
            dispatch(setSubclassRedux(subclassFound))
        }
        dispatch(clearSelectedCustomer())
        setDistributionCenter(dcFound)
        setSubclass(selectedSubclass)
        dispatch(setDistributionCenterRedux(dcFound))
        dispatch(fetchProducts({ token: token, shouldCheckLocalStorage: false, params: { locationGroupId: dcFound.id, locationGroupName: dcFound.name } }))
    }

    return (
        <>
            <section className="h-full">
                <div className="flex flex-col items-center justify-center w-screen px-6 py-8 mx-auto h-full">
                    <div className="w-full rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <form className="space-y-4 md:space-y-6" action="#">
                                <div>
                                    <label htmlFor="distributionCenterInput" className="block mb-2 text-sm font-medium">{t('Distribution center')}</label>
                                    <select onChange={e => { setSelectedDC(e.target.value); setShouldFilterSubclassList(true); }} id="distributionCenterInput" className="border text-sm rounded-lg block w-full p-2.5">
                                        {dcList.map(dc => {
                                            return (
                                                <option key={dc.name} value={dc.name}>{dc.name}</option>
                                            )
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="subclassInput" className="block mb-2 text-sm font-medium ">{t('Company')}</label>
                                    <select onChange={e => { setSelectedSubclass(e.target.value) }} id="subclassInput" className="border text-sm rounded-lg block w-full p-2.5">
                                        {filteredSubclassList.map(subclass => {
                                            return (
                                                <option key={subclass.name} value={subclass.name}>{subclass.parent}:{subclass.name}</option>
                                            )
                                        })}
                                    </select>
                                </div>
                                <button type="button" onClick={() => { setSelectedDCandSubclass() }} className="w-full primary-button font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('Save')}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default DCSelector
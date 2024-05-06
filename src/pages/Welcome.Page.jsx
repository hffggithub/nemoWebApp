import Login from '../Components/Login/Login.jsx'
import DCSelector from '../Components/DCSelector/DCSelector.jsx'
import { useState, useEffect } from 'react'
import { useLocalStorage } from "@uidotdev/usehooks";

function Welcome({setErrorBody, setErrorTitle, setErrorModalVisible, setDistributionCenter, setSubclass}) {
    
  const [token] = useLocalStorage("token", null);
    return (
        <>
            {token === null && <Login />}
            {token !== null && <DCSelector setDistributionCenter={setDistributionCenter} setSubclass={setSubclass} />}
        </>
    )
}

export default Welcome;
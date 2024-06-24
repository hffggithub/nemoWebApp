import { useLocalStorage } from "@uidotdev/usehooks";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { showError } from '../../slices/errorSlice'
import { useSelector, useDispatch } from 'react-redux'


function Login() {

    const [token, saveToken] = useLocalStorage("token", null);
    const [savedUsername, saveUsername] = useLocalStorage("username", null);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const [tryLogin, setTryLogin] = useState(false);
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();

    useEffect(() => {
        const logInAttemp = async (u, p) => {
            try {
                const response = await axios.post(
                    NEMO_API_HOST + "auth/login",
                    {
                        "username": u,
                        "password": p
                    },
                )
                if (response.status === 200) {
                    const { data } = response;

                    if (data.wasSuccess) {
                        saveToken(data.token)
                        saveUsername(u)
                    }
                } else {
                    dispatch(
                        showError(
                            {
                                errorTile: t('Invalid credentials'),
                                errorBody: t("Pleaase verify your login credentials."),
                                errorButton: t('ok'),
                                showError: true,
                            }
                        )
                    )
                }
            } catch (ex) {
                console.log(ex)
                
                dispatch(
                    showError(
                        {
                            errorTile: t('Login error'),
                            errorBody: t(ex.response?.data ?? 'Connection error please contact your administrator.'),
                            errorButton: t('ok'),
                            showError: true,
                        }
                    )
                )
            }
            setTryLogin(false)

        }
        if (tryLogin) {
            logInAttemp(userName, password)
        }
    }, [tryLogin, userName, password]);


    return (
        <>
            <section className="h-full">
                <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-full lg:py-0">
                    <div className="w-full rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
                                {t('Sign in to your account')}
                            </h1>
                            <form className="space-y-4 md:space-y-6" action="#">
                                <div>
                                    <label htmlFor="user" className="block mb-2 text-sm font-medium ">{t('Username')}</label>
                                    <input onChange={e => { setUserName(e.target.value) }} type="user" name="user" id="user" className="border sm:text-sm rounded-lg block w-full p-2.5" placeholder={t('Username')} required="" />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block mb-2 text-sm font-medium">{t('Password')}</label>
                                    <input onChange={e => { setPassword(e.target.value) }} type="password" name="password" id="password" placeholder="••••••••" className="border sm:text-sm rounded-lg block w-full p-2.5" required="" />
                                </div>
                                <button type="button" onClick={() => { setTryLogin(true) }} className="w-full primary-button focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('Sign in')}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Login
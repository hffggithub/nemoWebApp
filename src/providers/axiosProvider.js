import axios from "axios";
import store from "../store";
import { showError } from "../slices/errorSlice";
import i18n from "../i18n";

axios.interceptors.response.use( (config) => {
    return config;
}, (error) => {
    if (error.response && error.response.status === 401) {
        store.dispatch(
            showError(
                {
                    errorTile: i18n.t('Expired session'),
                    errorBody: i18n.t(`Your session has expired, please login again.`),
                    errorButton: 'sessionExpired',
                    showError: true,
                }
            ))
    }
});


export default axios;
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
console.log(import.meta.env.VITE_BACKEND_URL);

import {createHostedQuoteHandlers} from '../custom-tour-quotes.mjs';
export default {fetch:request=>createHostedQuoteHandlers().publicRequest(request)};

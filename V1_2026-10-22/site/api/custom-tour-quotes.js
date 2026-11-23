import {createHostedQuoteHandlers} from '../backend/custom-tour-quotes.mjs';
export default {fetch:request=>createHostedQuoteHandlers().publicRequest(request)};

import { format } from 'winston';
import { requestNumber } from '../../server';

export const addRequestNumber = format((info, opts) => {
    if (requestNumber) info.requestNumber = requestNumber;
    return info;
});

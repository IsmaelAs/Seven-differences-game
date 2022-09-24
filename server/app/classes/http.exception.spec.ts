import { HttpException } from './http.exception';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('HttpException', () => {
    it('should create a simple HTTPException', () => {
        const createdMessage = 'HTTPException created successfully';
        const httpException: HttpException = new HttpException(createdMessage);

        expect(httpException.message).to.equals(createdMessage);
    });
});

import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

export function FileBody(fieldName = 'file') {
  return applyDecorators(
    FormDataRequest(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            // 👈 this property
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
  );
}

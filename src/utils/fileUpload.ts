import {HttpException, HttpStatus} from "@nestjs/common";
import {extname} from "path";

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|JPG|png|PNG|gif)$/i)) {
    return callback(
      new HttpException(
        'Only image files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const dateBasedName = Date.now();
  callback(null, `${name}-${dateBasedName}${fileExtName}`);
};
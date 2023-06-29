# File Handling Module

1. Client에서 File/Image를 Body에 실어서 API에 Request를 보낸다.
2. API는 `nestjs-form-data` 패키지를 사용해 Body를 파싱한다.
3. Body에 있던 File/Image를 AWS S3에 저장한다.
4. File/Image가 S3에 저장되면 Client는 AWS CloudFront 주소를 통해 해당 File/Image에 접근할 수 있다.
5. AWS CloudFront에는 캐싱(Caching) 정책이 있기 때문에 기존 파일을 덮어쓰기(replace) 하면 반영될 때까지 최대 30분 정도 걸릴 수 있다.
6. 장소/장비의 이미지 URL은 `image_url` 컬럼에서도 확인 할 수 있다.

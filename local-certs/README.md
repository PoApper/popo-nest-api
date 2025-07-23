# How to setup local certificates

로컬에서 popo-nest-api 서버를 개발할 때, https를 적용하는 방법에 대해 다룹니다.

요걸 세팅 해야 popo-{public, admin}-web에서 HTTPS 엔드포인트를 요구하는 각종 auth 및 cookie 기반 Request를 로컬에서도 테스트 할 수 있습니다.

[NestJS - Localhost 환경에서 HTTPS 적용하기](https://lee-yo-han.github.io/nestjs-localhost-https) 포스트를 참고할 걸 권장드립니다. 아래의 내용은 위 포스트의 대충에 가깝습니다.


## Generate Self-signed certificates

(요기 명령어가 아니라 아래 `mkcert` 명령어로 진행하는 것을 권장 합니다.)

```sh
# 폴더 이동
$ cd local-certs

# 개인키 생성
$ openssl genrsa -out localhost-key.pem 2048

# 개인키를 사용한 새로운 인증서 요청서 생성
# 모두 엔터만 쳐도 무방함.
$ openssl req -new -key localhost-key.pem -out localhost.csr

# 요청서를 사용한 자체 서명 인증서 생성
$ openssl x509 -req -in localhost.csr -signkey localhost-key.pem -out localhost.pem
Certificate request self-signature ok
subject=C=KR, ST=Seoul, L=Seoul, O=personal, OU=local, CN=haha, emailAddress=hoho
```

본래 Production 서비스는 권위 있는 기관에 SSL Cert의 서명을 받아야 한다.
그러나 로컬에서는 그런게 필요없기 때문에 Self-signed SSL Cert를 사용해도 충분하다.

## Setup HTTPS on NestJS Application

`main.ts` 폴더에 아래 코드를 작성한다. 참고로 현재 POPO 코드에서는 아래 내용이 이미 반영 되어 있다. 따로 작업할 필요는 X

```ts
import * as fs from "fs";
import * as https from "https";

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync("./local-certs/localhost-key.pem"),
    cert: fs.readFileSync("./local-certs/localhost.pem"),
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  await app.listen(3000);
}
bootstrap();
```

위의 것까지만 하고 로컬에서 `npm run start:dev`를 실행하면, `https://localhost:4000`에 popo-nest-api 서버가 구동된다.

POPO 코드에서는 `NODE_ENV=local`이어야 제대로 동작한다. `.env` 파일에 아래 내용을 추가하자.

```sh
NODE_ENV=local
```

## Setup HTTPS on Client-side

로컬 HTTPS를 제대로 활용하려면, 클라이언트 사이드(public & admin web)에서도 HTTPS를 세팅해야 한다.

클라이언트 사이드에서 HTTPS를 세팅 하는 방법은 그쪽 레포의 README를 읽어보자.

세팅 후에 클라이언트에서 요청하는 로컬 popo-nest-api 서버의 주소가 `http://localhost:4000`에서 `https://localhost:4000`으로 바뀌어야 한다는 것도 잊지 말자!!

## NODE_TLS_REJECT_UNAUTHORIZED

그리고 Client-side에서 아래의 ENV를 설정해줘야 한다.

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Chrome Allow Insecure Localhost

~~또, 크롬에서도 insecure localhost에 대한 접속을 허용해줘야 한다. `chrome://flags/#allow-insecure-localhost` 경로로 이동해서 해당 옵션을 Enabled로 바꾸자.~~

크롬이 업데이트됨에 따라 해당 설정값 사라짐

## 위 방법을 시도했을 때도 안된다면

2025.07.15 일자 수정

`local-certs` 폴더에서 아래 명령어를 실행

```sh
$ brew install mkcert
$ mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
```

프론트에서도 동일한 명령어를 실행해야 한다.

해당 명령어는 다음을 모두 커버한다:
- localhost (도메인으로 요청 시)
- 127.0.0.1 (IPv4로 요청 시)
- ::1 (IPv6로 요청 시)

이래도 안된다면 트러블슈팅 후 이어서 작성해주시길..

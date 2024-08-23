## I Blue It 5.0 Server Side 🐬

## Sobre
Esta aplicação *BackEnd/API* foi desenvolvida baseando-se na azure-functions para criação de rotas especializadas.

### Documentação em POSTMAN
Caso queira exemplos de requisições e uma documentação mais detalhada, siga os seguintes passos:
1. Acesso a [Documentação](https://documenter.getpostman.com/view/10306115/Uz5DoweB)
2. Instale o [Postman](https://www.postman.com/downloads/)
3. Dentro do Postman, vá em File->Import
4. Importe o arquivo que se encontra na pasta **utils** deste repositório (*BlueApiFunc.postman_collection.json*)

## Tecnologias e Bibliotecas Utilizadas
- [Node.js](https://nodejs.org/en/) 12.16.1
- [Microsoft Azure Functions](https://azure.microsoft.com/pt-br/services/functions/) 3.0
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose](https://mongoosejs.com) 5.9.2
- [validatorjs](https://github.com/skaterdav85/validatorjs) 3.18.1
- [Nodemailer](https://nodemailer.com/about/) 6.4.6
- bcryptjs 2.4.3

### Instalação
1. Baixe o nvm [Windows](https://github.com/coreybutler/nvm-windows/releases) OU [linux](https://github.com/nvm-sh/nvm)
2. Baixe a Versão dp Node <strong>12.16.1</strong> com:
```
nvm install 12.16.1
```
3. Instale o Azure Functions com:
```
npm install -g azure-functions-core-tools@3 --unsafe-perm true
```
4. Rode o comando para instalar as dependencias:
```
npm install
```
5. crie um arquivo chamado local.settings.json com a seguintes informações:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "MongoDbAtlas":"mongodb://usuarioiblueit:senhaiblueit@iblueit-mongo/?retryWrites=true&w=majority Alterar Usuario e senha",
    "URL_API_IA": "http://127.0.0.1:5000"
  },
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```
6. Rode o Script de Start do Azure Function:
```
func host start --cors *
```
7. Pronto, o Blue_It_BackEnd estará ativo. Para acessá-lo utilize a rota http://localhost:7071

### Repositório GitHub I Blue It 5.0 Flow Psicofisiológico

- [I Blue It](https://github.com/UDESC-LARVA/iblueit-psychophysiological-flow)


## IBLUEIT 🐬
Este repositório trata-se de um fork/estudo do projeto **[UDESC-LARVA/IBLUEIT](https://github.com/UDESC-LARVA/IBLUEIT)** no propósito de TCC na Universidade UniSociesc tendo como objetivo a sugestão de melhoria da aplicação.

#### Integrantes
- [@claudineidias](https://github.com/claudineidias) 

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

### Instalação e Inicialização SEM Docker-Compose
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

### Instalação e Inicialização COM Docker-Compose

Este repositório contém os artefatos necessários para executar o IBLUEIT utilizando o Docker.
Antes de mais nada, será necessário instalar alguns pré-requisitos, se ainda não estiverem instalados:

1. Instale o [Docker](https://docs.docker.com/install/)
2. Faça o download do arquivo [docker-compose.yml](https://github.com/unisocisec/Blue_It_BackEnd/blob/main/docker-compose.yml "docker-compose.yml").

3. Em seguida parametrize as variáveis de ambiente conforme a sua necessidade seguindo o exemplo abaixo:
```yaml
version: '3.3'

services:
  iblueit-mongo:
    image: mongo
    container_name: iblueit-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: 'usuarioiblueit' #Usuario
      MONGO_INITDB_ROOT_PASSWORD: 'senhaiblueit' #Senha do banco de dados

  iblueit-proxy:
    image: iblueit/proxy:latest
    container_name: iblueit-proxy
    ports:
     - "7071:80"

  iblueit-api:
    image: iblueit/api:latest
    container_name: iblueit-api
    ports:
      - "8080:80"
    environment:
      MongoDbAtlas: 'mongodb://usuarioiblueit:senhaiblueit@iblueit-mongo/?retryWrites=true&w=majority' #Alterar Usuario e senha (linha: 10 e 11)
      SMTP_Server_Hostname: 'seudominio.com' #Servidor de emails
      SMTP_Server_Username: 'service@seudominio.com' #Usuario email
      SMTP_Server_Password: 'Teste@123' #Senha email
      URL_API_IA: 'http://iblueit-ia:5000/' #iblueit-ia + porta (linha: 48)
    links:
      - "iblueit-mongo:iblueit-mongo"
      - "iblueit-ia:iblueit-ia"

  iblueit-front:
    image: iblueit/front:latest
    container_name: iblueit-front
    ports:
      - "3000:80"
    environment:
      API_URL: 'http://localhost:7071/api' #localhost + iblueit-proxy porta (linha: 23)
    links:
      - "iblueit-api:iblueit-api"

   iblueit-ia:
    image: iblueit/ia:latest
    container_name: iblueit-ia
    ports:
      - "5000:5000"
    environment:
      MongoDbAtlas: 'mongodb://usuarioiblueit:senhaiblueit@iblueit-mongo/?retryWrites=true&w=majority' #Alterar Usuario e senha (linha: 10 e 11)
    links:
      - "iblueit-api:iblueit-api"
```

4. Utilize o Docker para carregar e depois disponibilizar todos os serviços necessários ao funcionamento do IBLUEIT:

```
$ docker-compose up
```

5. Pronto, o Blue_It_BackEnd estará ativo. Para acessá-lo utilize a rota http://localhost:7071. Registre-se e faça o seu login

### Repositórios GitHub - Código fonte

- Aplicação (BackEnd) [Blue_It_BackEnd](https://github.com/unisocisec/Blue_It_BackEnd)
- Interface gráfica (FrontEnd) [blue_It_front](https://github.com/unisocisec/blue_It_front)
- Inteligência artificial [Blue_It_IA](https://github.com/unisocisec/Blue_It_IA)
- Repositório do Jogo [Blue_It_Game](https://github.com/unisocisec/Blue_It_Game)

### Repositórios Docker
- Aplicação (BackEnd) [iblueit-api](https://hub.docker.com/repository/docker/iblueit/api)
- Interface gráfica (FrontEnd) [iblueit-front](https://hub.docker.com/repository/docker/iblueit/front)
- Inteligência artificial [iblueit-ia](https://hub.docker.com/repository/docker/iblueit/ia)
- Intermediário de comunicação [iblueit-proxy](https://hub.docker.com/repository/docker/iblueit/proxy)
- Banco de dados [MongoDB](https://hub.docker.com/_/mongo)

### Demonstrativo Containers

![Demonstrativo Containers](https://github.com/unisocisec/Blue_It_BackEnd/blob/main/containers.png?raw=true)
